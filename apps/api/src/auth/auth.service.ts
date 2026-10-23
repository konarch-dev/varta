import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, AccountStatus } from '@varta/shared';
import { MailjetService } from './mailjet.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailjetService: MailjetService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateVerificationToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'EMAIL_VERIFICATION' },
      {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'varta_dev_access_secret_super_secure_key_change_in_prod_32chars',
        ),
        expiresIn: '24h',
      },
    );
  }

  private generatePasswordResetToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { sub: userId, email, type: 'PASSWORD_RESET' },
      {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'varta_dev_access_secret_super_secure_key_change_in_prod_32chars',
        ),
        expiresIn: '1h',
      },
    );
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      // Return ambiguous success message to prevent user enumeration
      return {
        success: true,
        message: 'If an account exists with this email address, a password reset link has been sent.',
      };
    }

    if (user.status === AccountStatus.SUSPENDED) {
      throw new BadRequestException('This account has been suspended. Please contact support.');
    }

    const resetToken = this.generatePasswordResetToken(user.id, user.email);
    const appUrl = this.configService.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;

    await this.mailjetService.sendPasswordResetEmail(
      user.email,
      user.profile?.displayName || user.username,
      resetUrl,
    );

    return {
      success: true,
      message: 'Password reset link has been sent to your email address.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (!dto.token) {
      throw new BadRequestException('Password reset token is required');
    }

    try {
      const payload = this.jwtService.verify(dto.token, {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'varta_dev_access_secret_super_secure_key_change_in_prod_32chars',
        ),
      });

      if (payload.type !== 'PASSWORD_RESET') {
        throw new BadRequestException('Invalid password reset token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('User account not found');
      }

      const passwordHash = await argon2.hash(dto.newPassword, {
        type: argon2.argon2id,
      });

      // Update user password and activate if it was pending verification
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          status: user.status === AccountStatus.PENDING_VERIFICATION ? AccountStatus.ACTIVE : user.status,
          emailVerifiedAt: user.emailVerifiedAt || new Date(),
        },
      });

      // Invalidate all active sessions for security
      await this.prisma.session.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return {
        success: true,
        message: 'Your password has been successfully reset. You can now sign in with your new credentials.',
      };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new BadRequestException('The password reset link has expired. Please request a new one.');
      }
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException('Password reset link is invalid or expired.');
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          { username: dto.username.toLowerCase() },
        ],
      },
      include: { profile: true },
    });

    if (existing) {
      if (existing.email.toLowerCase() === dto.email.toLowerCase()) {
        // If account is still pending verification, resend the activation link
        if (existing.status === AccountStatus.PENDING_VERIFICATION) {
          const token = this.generateVerificationToken(existing.id, existing.email);
          const appUrl = this.configService.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
          const verificationUrl = `${appUrl}/verify-email?token=${token}`;
          await this.mailjetService.sendVerificationEmail(
            existing.email,
            existing.profile?.displayName || existing.username,
            verificationUrl,
          );
          return {
            requiresVerification: true,
            message: 'Your account is pending verification. A fresh activation link has been sent to your email.',
            email: existing.email,
          };
        }
        throw new ConflictException('Email is already registered');
      }
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    // Account created in PENDING_VERIFICATION status until email link is clicked
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username.toLowerCase(),
        passwordHash,
        role: Role.USER,
        status: AccountStatus.PENDING_VERIFICATION,
        isVerified: false,
        profile: {
          create: {
            displayName: dto.displayName.trim(),
          },
        },
        notificationPref: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

    // Generate verification token and send email via Mailjet
    const verificationToken = this.generateVerificationToken(user.id, user.email);
    const appUrl = this.configService.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;

    await this.mailjetService.sendVerificationEmail(
      user.email,
      user.profile?.displayName || user.username,
      verificationUrl,
    );

    return {
      requiresVerification: true,
      message: 'Account created! Please check your email to activate your account before logging in.',
      email: user.email,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        profile: user.profile,
      },
    };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>(
          'JWT_ACCESS_SECRET',
          'varta_dev_access_secret_super_secure_key_change_in_prod_32chars',
        ),
      });

      if (payload.type !== 'EMAIL_VERIFICATION') {
        throw new BadRequestException('Invalid verification token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { profile: true },
      });

      if (!user) {
        throw new NotFoundException('User account not found');
      }

      if (user.status === AccountStatus.ACTIVE) {
        return {
          success: true,
          alreadyActive: true,
          message: 'Your account is already active! You can sign in now.',
          email: user.email,
        };
      }

      // Activate user account
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          status: AccountStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Your account has been successfully activated! You can now sign in.',
        email: user.email,
      };
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new BadRequestException('Activation link has expired. Please request a new verification email.');
      }
      throw new BadRequestException(err.message || 'Activation link is invalid or expired.');
    }
  }

  async resendVerification(email: string) {
    if (!email) {
      throw new BadRequestException('Email address is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user) {
      // Prevent user enumeration
      return {
        success: true,
        message: 'If an account exists with this email, a new confirmation link has been sent.',
      };
    }

    if (user.status === AccountStatus.ACTIVE) {
      return {
        success: true,
        alreadyActive: true,
        message: 'Your account is already active. Please sign in.',
      };
    }

    const token = this.generateVerificationToken(user.id, user.email);
    const appUrl = this.configService.get<string>('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    await this.mailjetService.sendVerificationEmail(
      user.email,
      user.profile?.displayName || user.username,
      verificationUrl,
    );

    return {
      success: true,
      message: 'A fresh activation link has been sent to your email inbox.',
    };
  }

  async login(dto: LoginDto, userAgent?: string, ipAddress?: string) {
    const identifier = dto.identifier.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === AccountStatus.PENDING_VERIFICATION) {
      throw new UnauthorizedException(
        'Your account is not active yet. Please click the activation link sent to your email address.',
      );
    }

    if (user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active or suspended');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.username,
      user.email,
      user.role,
      userAgent,
      ipAddress,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        isPrivate: user.isPrivate,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string, userAgent?: string, ipAddress?: string) {
    const hashed = this.hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({
      where: { refreshTokenHash: hashed },
      include: { user: { include: { profile: true } } },
    });

    if (!session || session.revokedAt || new Date() > session.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (session.user.status !== AccountStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Revoke old session (Rotation)
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    // Generate new tokens
    return this.generateTokens(
      session.user.id,
      session.user.username,
      session.user.email,
      session.user.role,
      userAgent,
      ipAddress,
    );
  }

  async logout(refreshToken: string) {
    const hashed = this.hashToken(refreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: hashed, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      isPrivate: user.isPrivate,
      profile: user.profile,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      counts: {
        followers: user._count.followers,
        following: user._count.following,
        posts: user._count.posts,
      },
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(
    userId: string,
    username: string,
    email: string,
    role: string,
    userAgent?: string,
    ipAddress?: string,
  ) {
    const payload = { sub: userId, username, email, role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m')) as any,
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'varta_dev_access_secret_super_secure_key_change_in_prod_32chars',
      ),
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash,
        expiresAt,
        userAgent,
        ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: 900, // 15 mins in seconds
    };
  }
}

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, AccountStatus } from '@varta/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.toLowerCase() },
          { username: dto.username.toLowerCase() },
        ],
      },
    });

    if (existing) {
      if (existing.email.toLowerCase() === dto.email.toLowerCase()) {
        throw new ConflictException('Email is already registered');
      }
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        username: dto.username.toLowerCase(),
        passwordHash,
        role: Role.USER,
        status: AccountStatus.ACTIVE,
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

    const tokens = await this.generateTokens(user.id, user.username, user.email, user.role);
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified,
        isPrivate: user.isPrivate,
        profile: user.profile,
      },
      ...tokens,
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
      isVerified: user.isVerified,
      isPrivate: user.isPrivate,
      profile: user.profile,
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

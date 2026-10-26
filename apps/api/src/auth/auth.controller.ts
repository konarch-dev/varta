import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import {
  SendSignupOtpDto,
  VerifySignupOtpDto,
  SendLoginOtpDto,
  VerifyLoginOtpDto,
} from './dto/otp.dto';
import { GoogleAuthDto } from './dto/google.dto';
import {
  SendPhoneOtpDto,
  VerifyPhoneSignupDto,
  VerifyPhoneLoginDto,
  PhonePasswordLoginDto,
} from './dto/phone.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('varta_refresh_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('varta_refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 201, description: 'User registered, confirmation email dispatched' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    if ('refreshToken' in result && result.refreshToken) {
      this.setRefreshTokenCookie(res, (result as any).refreshToken);
    }
    return result;
  }

  @Post('signup/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 6-digit OTP verification code to email for user registration' })
  async sendSignupOtp(@Body() dto: SendSignupOtpDto) {
    return this.authService.sendSignupOtp(dto);
  }

  @Post('signup/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify signup OTP and immediately activate user account' })
  async verifySignupOtp(
    @Body() dto: VerifySignupOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.verifySignupOtp(dto, userAgent, ipAddress);
    if ('refreshToken' in result && result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }
    return {
      success: true,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('login/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 6-digit login OTP code to registered email' })
  async sendLoginOtp(@Body() dto: SendLoginOtpDto) {
    return this.authService.sendLoginOtp(dto);
  }

  @Post('login/verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify login OTP and authenticate user without password' })
  async verifyLoginOtp(
    @Body() dto: VerifyLoginOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.verifyLoginOtp(dto, userAgent, ipAddress);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      success: true,
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  // --- PHONE AUTH ENDPOINTS ---

  @Post('phone/send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send 6-digit OTP verification code to phone number' })
  async sendPhoneOtp(@Body() dto: SendPhoneOtpDto) {
    return this.authService.sendPhoneOtp(dto);
  }

  @Post('phone/verify-signup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone signup OTP and register new user account' })
  async verifyPhoneSignup(
    @Body() dto: VerifyPhoneSignupDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.verifyPhoneSignup(dto, userAgent, ipAddress);
    if ('refreshToken' in result && result.refreshToken) {
      this.setRefreshTokenCookie(res, result.refreshToken);
    }
    return {
      success: true,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('phone/verify-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify phone login OTP and sign in user' })
  async verifyPhoneLogin(
    @Body() dto: VerifyPhoneLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.verifyPhoneLogin(dto, userAgent, ipAddress);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      success: true,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('phone/password-login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in user with phone number and password' })
  async phonePasswordLogin(
    @Body() dto: PhonePasswordLoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.phonePasswordLogin(dto, userAgent, ipAddress);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      success: true,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Confirm and activate user account via email token' })
  @ApiResponse({ status: 200, description: 'Account successfully activated' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification activation link' })
  @ApiResponse({ status: 200, description: 'Confirmation email resent' })
  async resendVerification(@Body('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset link via email' })
  @ApiResponse({ status: 200, description: 'Reset email dispatched if account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user with username/email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.login(dto, userAgent, ipAddress);
    this.setRefreshTokenCookie(res, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['varta_refresh_token'] || req.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.socket.remoteAddress;
    const result = await this.authService.refreshTokens(refreshToken, userAgent, ipAddress);
    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke active session' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['varta_refresh_token'] || req.body?.refreshToken;
    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }
    this.clearRefreshTokenCookie(res);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.id);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in or Sign up with Google Account' })
  async googleAuth(
    @Body() dto: GoogleAuthDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userAgent = req.headers['user-agent'];
    const ipAddress =
      (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    const result = await this.authService.googleAuth(dto, userAgent, ipAddress);

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      success: true,
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    };
  }

  @Get('google/login')
  @ApiOperation({ summary: 'Initiate Google OAuth 2.0 Login / Sign Up' })
  async googleLogin(@Res() res: Response) {
    const { url, isConfigured } = this.authService.getGoogleAuthUrl();
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (!isConfigured) {
      // If Google credentials are not set in .env yet, redirect to login with notification
      return res.redirect(`${frontendUrl}/login?google_oauth=not_configured`);
    }

    return res.redirect(url);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth 2.0 Authorization Callback' })
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

    if (error || !code) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(error || 'Google authorization cancelled')}`,
      );
    }

    try {
      const userAgent = req.headers['user-agent'];
      const ipAddress =
        (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
      const result = await this.authService.handleGoogleCallback(
        code,
        userAgent,
        ipAddress,
      );

      this.setRefreshTokenCookie(res, result.refreshToken);

      return res.redirect(
        `${frontendUrl}/auth/callback?token=${result.accessToken}`,
      );
    } catch (err: any) {
      return res.redirect(
        `${frontendUrl}/login?error=${encodeURIComponent(err.message || 'Google authentication failed')}`,
      );
    }
  }
}

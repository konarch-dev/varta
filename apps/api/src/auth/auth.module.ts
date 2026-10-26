import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

import { MailjetService } from './mailjet.service';
import { Msg91Service } from './msg91.service';
import { Fast2SmsService } from './fast2sms.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    RedisModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>(
          'JWT_ACCESS_SECRET',
          'varta_dev_access_secret_super_secure_key_change_in_prod_32chars',
        ),
        signOptions: {
          expiresIn: (config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m')) as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailjetService, Msg91Service, Fast2SmsService],
  exports: [AuthService, JwtModule, MailjetService, Msg91Service, Fast2SmsService],
})
export class AuthModule {}

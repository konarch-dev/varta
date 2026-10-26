import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendSignupOtpDto {
  @ApiProperty({ example: 'aarav@varta.in', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;

  @ApiPropertyOptional({ example: 'Aarav Sharma', description: 'Full name / display name' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;
}

export class VerifySignupOtpDto {
  @ApiProperty({ example: 'aarav@varta.in', description: 'User email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email!: string;

  @ApiProperty({ example: 'aarav_sharma', description: 'Unique username' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain alphanumeric characters and underscores',
  })
  username!: string;

  @ApiProperty({ example: 'Aarav Sharma', description: 'Full display name' })
  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  @MaxLength(50)
  displayName!: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Account password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

export class SendLoginOtpDto {
  @ApiProperty({ example: 'aarav@varta.in', description: 'Email address or username' })
  @IsString()
  @IsNotEmpty({ message: 'Email or username is required' })
  identifier!: string;
}

export class VerifyLoginOtpDto {
  @ApiProperty({ example: 'aarav@varta.in', description: 'Email address or username' })
  @IsString()
  @IsNotEmpty({ message: 'Email or username is required' })
  identifier!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

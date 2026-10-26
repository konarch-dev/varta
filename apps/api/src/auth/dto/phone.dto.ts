import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendPhoneOtpDto {
  @ApiProperty({ example: '+91', description: 'Country calling code with leading plus' })
  @IsString()
  @Matches(/^\+[0-9]{1,4}$/, { message: 'Country code must start with + followed by 1-4 digits (e.g. +91)' })
  countryCode!: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number without country code' })
  @IsString()
  @MinLength(6, { message: 'Phone number must be at least 6 digits' })
  @MaxLength(15, { message: 'Phone number cannot exceed 15 digits' })
  @Matches(/^[0-9\s-]+$/, { message: 'Phone number must contain only numbers' })
  phoneNumber!: string;

  @ApiProperty({ example: 'signup', enum: ['signup', 'login'], description: 'Purpose of OTP' })
  @IsIn(['signup', 'login'], { message: "Purpose must be either 'signup' or 'login'" })
  purpose!: 'signup' | 'login';
}

export class VerifyPhoneSignupDto {
  @ApiProperty({ example: '+91', description: 'Country calling code' })
  @IsString()
  @Matches(/^\+[0-9]{1,4}$/, { message: 'Country code must start with + (e.g. +91)' })
  countryCode!: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number' })
  @IsString()
  @MinLength(6, { message: 'Phone number must be at least 6 digits' })
  @MaxLength(15, { message: 'Phone number cannot exceed 15 digits' })
  phoneNumber!: string;

  @ApiProperty({ example: 'Aarav Sharma', description: 'Full display name' })
  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  @MaxLength(50)
  displayName!: string;

  @ApiProperty({ example: 'aarav_sharma', description: 'Unique username' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain alphanumeric characters and underscores',
  })
  username!: string;

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

export class VerifyPhoneLoginDto {
  @ApiProperty({ example: '+91', description: 'Country calling code' })
  @IsString()
  @Matches(/^\+[0-9]{1,4}$/, { message: 'Country code must start with + (e.g. +91)' })
  countryCode!: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number' })
  @IsString()
  @MinLength(6, { message: 'Phone number must be at least 6 digits' })
  @MaxLength(15, { message: 'Phone number cannot exceed 15 digits' })
  phoneNumber!: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}

export class PhonePasswordLoginDto {
  @ApiProperty({ example: '+91', description: 'Country calling code' })
  @IsString()
  @Matches(/^\+[0-9]{1,4}$/, { message: 'Country code must start with + (e.g. +91)' })
  countryCode!: string;

  @ApiProperty({ example: '9876543210', description: 'Phone number' })
  @IsString()
  @MinLength(6, { message: 'Phone number must be at least 6 digits' })
  @MaxLength(15, { message: 'Phone number cannot exceed 15 digits' })
  phoneNumber!: string;

  @ApiProperty({ example: 'SecureP@ss123', description: 'Account password' })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}

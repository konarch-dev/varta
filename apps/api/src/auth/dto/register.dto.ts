import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { USERNAME_REGEX } from '@varta/shared';

export class RegisterDto {
  @ApiProperty({ example: 'aarav@example.com' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  email!: string;

  @ApiProperty({ example: 'aarav_sharma' })
  @IsString()
  @Length(3, 30, { message: 'Username must be between 3 and 30 characters' })
  @Matches(USERNAME_REGEX, {
    message: 'Username can only contain alphanumeric characters and underscores',
  })
  username!: string;

  @ApiProperty({ example: 'Aarav Sharma' })
  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  @Length(1, 50)
  displayName!: string;

  @ApiProperty({ example: 'SecurePassword@123' })
  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  password!: string;
}

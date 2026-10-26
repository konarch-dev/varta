import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({
    example: 'priya.patel@gmail.com',
    description: 'Verified Google account email address',
  })
  @IsEmail({}, { message: 'Please provide a valid Google email address' })
  email!: string;

  @ApiProperty({
    example: 'Priya Patel',
    description: 'Full display name from Google profile',
  })
  @IsString()
  @IsNotEmpty({ message: 'Display name is required' })
  displayName!: string;

  @ApiPropertyOptional({
    example: 'https://lh3.googleusercontent.com/a/ACg8ocL...',
    description: 'Google profile picture URL',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: '1092837461928374',
    description: 'Unique Google subject/user ID',
  })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI...',
    description: 'Google OAuth ID Token if available',
  })
  @IsOptional()
  @IsString()
  idToken?: string;
}

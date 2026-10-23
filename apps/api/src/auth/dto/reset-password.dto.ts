import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'jwt_token_here', description: 'Reset token from email link' })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token!: string;

  @ApiProperty({ example: 'SecurePassword@123', description: 'New password (min 8 chars)' })
  @IsString()
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  newPassword!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'aarav_sharma', description: 'Username or email' })
  @IsString()
  @IsNotEmpty({ message: 'Username or email is required' })
  identifier!: string;

  @ApiProperty({ example: 'SecurePassword@123' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

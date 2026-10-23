import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from '@varta/shared';

const getUploadDir = () => {
  const envDir = process.env.MEDIA_UPLOAD_DIR || './uploads';
  return resolve(process.cwd(), envDir);
};

const createStorage = (subfolder: 'avatars' | 'covers') => {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = getUploadDir();
      const targetDir = join(uploadDir, subfolder);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir);
    },
    filename: (_req, file, cb) => {
      const fileExt = extname(file.originalname).toLowerCase() || '.jpg';
      const cleanExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExt)
        ? fileExt
        : '.jpg';
      const uniqueName = `${uuidv4()}${cleanExt}`;
      cb(null, uniqueName);
    },
  });
};

const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WEBP, and GIF images are supported.',
      ),
      false,
    );
  }
};

const getPublicUrl = (subfolder: string, filename: string) => {
  const baseUrl = process.env.MEDIA_PUBLIC_URL || 'http://localhost:3001/uploads';
  const cleanBase = baseUrl.replace(/\/+$/, '');
  return `${cleanBase}/${subfolder}/${filename}`;
};

@ApiTags('Users & Profiles')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get public user profile with viewer relationship status' })
  async getProfile(
    @Param('username') username: string,
    @CurrentUser() viewer: any,
  ) {
    return this.usersService.getProfileByUsername(username, viewer?.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile info' })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload new avatar image (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createStorage('avatars'),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: Number(process.env.MAX_IMAGE_SIZE_BYTES) || 5 * 1024 * 1024,
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required (form field: "file")');
    }
    const publicUrl = getPublicUrl('avatars', file.filename);
    const updated = await this.usersService.updateAvatar(user.id, publicUrl);
    return {
      avatarUrl: publicUrl,
      message: 'Avatar updated successfully',
      profile: updated,
    };
  }

  @Post('cover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload new header cover image (multipart/form-data)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createStorage('covers'),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: Number(process.env.MAX_IMAGE_SIZE_BYTES) || 5 * 1024 * 1024,
      },
    }),
  )
  async uploadCover(
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required (form field: "file")');
    }
    const publicUrl = getPublicUrl('covers', file.filename);
    const updated = await this.usersService.updateCover(user.id, publicUrl);
    return {
      coverUrl: publicUrl,
      message: 'Cover image updated successfully',
      profile: updated,
    };
  }

  @Patch('settings/privacy')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle account privacy (public / private)' })
  async updatePrivacy(
    @CurrentUser() user: any,
    @Body('isPrivate') isPrivate: boolean,
  ) {
    return this.usersService.updatePrivacy(user.id, Boolean(isPrivate));
  }

  @Get(':username/followers')
  @ApiOperation({ summary: 'Get paginated list of user followers' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowers(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getFollowers(username, cursor, limit ? Number(limit) : 20);
  }

  @Get(':username/following')
  @ApiOperation({ summary: 'Get paginated list of accounts user is following' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowing(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.usersService.getFollowing(username, cursor, limit ? Number(limit) : 20);
  }

  @Post('settings/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(
    @CurrentUser() user: any,
    @Body('currentPassword') currentPassword?: string,
    @Body('newPassword') newPassword?: string,
  ) {
    return this.usersService.changePassword(user.id, currentPassword || '', newPassword || '');
  }

  @Post('settings/premium')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle VARTA+ Premium subscription and verification' })
  async togglePremium(@CurrentUser() user: any) {
    return this.usersService.toggleVerified(user.id);
  }

  @Patch('settings/account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update account username or email' })
  async updateAccount(
    @CurrentUser() user: any,
    @Body() body: { username?: string; email?: string },
  ) {
    return this.usersService.updateAccount(user.id, body);
  }
}

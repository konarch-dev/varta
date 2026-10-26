import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
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
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReportDto, ReportStatus, ModerationActionType, Role } from '@varta/shared';

const getGroupUploadDir = () => {
  const envDir = process.env.MEDIA_UPLOAD_DIR || './uploads';
  return resolve(process.cwd(), envDir);
};

const createAvatarStorage = (folder: 'groups' | 'avatars' = 'avatars') => {
  return diskStorage({
    destination: (_req, _file, cb) => {
      const uploadDir = getGroupUploadDir();
      const targetDir = join(uploadDir, folder);
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
      const uniqueName = `${folder === 'groups' ? 'group' : 'user'}-avatar-${uuidv4()}${cleanExt}`;
      cb(null, uniqueName);
    },
  });
};

@ApiTags('Moderation & Admin')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('moderation/reports')
  @ApiOperation({ summary: 'Submit grievance report against post or user' })
  async createReport(
    @CurrentUser() user: any,
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.createReport(user.id, dto);
  }

  @Get('admin/reports')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Admin review queue for filed grievance reports' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReportsQueue(
    @Query('status') status?: ReportStatus,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.getReportsQueue(status, limit ? Number(limit) : 20);
  }

  @Patch('admin/reports/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Update status of reported incident' })
  async updateReportStatus(
    @Param('id') id: string,
    @Body('status') status: ReportStatus,
    @CurrentUser() user: any,
  ) {
    return this.moderationService.updateReportStatus(id, status, user.id);
  }

  @Post('admin/actions')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Apply moderation sanction (takedown, suspension, ban)' })
  async applyAction(
    @CurrentUser() user: any,
    @Body()
    body: {
      targetUserId: string;
      actionType: ModerationActionType;
      reason: string;
      postId?: string;
    },
  ) {
    return this.moderationService.applyModerationAction(
      user.id,
      body.targetUserId,
      body.actionType,
      body.reason,
      body.postId,
    );
  }

  @Get('admin/metrics')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Admin overview metrics (users, posts, groups, pending reports)' })
  async getMetrics() {
    return this.moderationService.getPlatformMetrics();
  }

  @Get('admin/audit-logs')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Fetch immutable administrator audit log trail' })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLogs(@Query('limit') limit?: number) {
    return this.moderationService.getAuditLogs(limit ? Number(limit) : 50);
  }

  // --- USER MANAGEMENT ENDPOINTS ---

  @Get('admin/users')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'List and filter users for administration' })
  async getUsers(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.getUsersList({ search, status, role, page, limit });
  }

  @Patch('admin/users/:id/toggle-block')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Toggle block / suspension status of a user' })
  async toggleBlockUser(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body('reason') reason?: string,
  ) {
    return this.moderationService.toggleBlockUser(id, admin.id, reason);
  }

  @Patch('admin/users/:id/role')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user role (USER, MODERATOR, ADMIN)' })
  async updateUserRole(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body('role') role: Role,
  ) {
    return this.moderationService.updateUserRole(id, role, admin.id);
  }

  @Patch('admin/users/:id/verify')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Toggle verified badge for user' })
  async toggleVerifyUser(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.moderationService.toggleVerifyUser(id, admin.id);
  }

  @Patch('admin/users/:id/avatar')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Update avatar of a user or admin via URL' })
  async updateUserAvatar(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    return this.moderationService.updateUserAvatar(id, admin.id, avatarUrl);
  }

  @Post('admin/users/:id/avatar/upload')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Upload an avatar image file for a user or admin' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createAvatarStorage('avatars'),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files (JPG, PNG, GIF, WEBP) are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadUserAvatar(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const baseUrl = (process.env.MEDIA_PUBLIC_URL || 'http://localhost:3001/uploads').replace(/\/+$/, '');
    const avatarUrl = `${baseUrl}/avatars/${file.filename}`;
    return this.moderationService.updateUserAvatar(id, admin.id, avatarUrl);
  }

  // --- POST MANAGEMENT ENDPOINTS ---

  @Get('admin/posts')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'List and filter posts across platform' })
  async getPosts(
    @Query('search') search?: string,
    @Query('groupId') groupId?: string,
    @Query('authorId') authorId?: string,
    @Query('isBlocked') isBlocked?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.getPostsList({
      search,
      groupId,
      authorId,
      isBlocked,
      page,
      limit,
    });
  }

  @Patch('admin/posts/:id/toggle-block')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Toggle takedown / block status of a post' })
  async toggleBlockPost(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body('reason') reason?: string,
  ) {
    return this.moderationService.toggleBlockPost(id, admin.id, reason);
  }

  @Delete('admin/posts/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Permanently delete a post' })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.moderationService.deletePost(id, admin.id);
  }

  // --- GROUP MANAGEMENT ENDPOINTS ---

  @Get('admin/groups')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'List and filter groups / communities' })
  async getGroups(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.getGroupsList({ search, category, page, limit });
  }

  @Post('admin/groups')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Create a new community group from admin panel' })
  async createGroup(
    @CurrentUser() admin: any,
    @Body()
    body: {
      name: string;
      description?: string;
      category?: string;
      avatarUrl?: string;
      coverUrl?: string;
      isPrivate?: boolean;
    },
  ) {
    return this.moderationService.createCommunityGroup(admin.id, body);
  }

  @Patch('admin/groups/:id/toggle-block')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Toggle block / private status of a group' })
  async toggleBlockGroup(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body('reason') reason?: string,
  ) {
    return this.moderationService.toggleBlockGroup(id, admin.id, reason);
  }

  @Post('admin/groups/:id/posts')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Create a new post in a group as admin' })
  async createPostInGroup(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body()
    body: {
      content: string;
      mediaUrl?: string;
      imageUrl?: string;
      videoUrl?: string;
      mediaType?: 'IMAGE' | 'VIDEO';
    },
  ) {
    return this.moderationService.createPostInGroup(id, admin.id, body);
  }

  @Get('admin/groups/:id/posts')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Get posts belonging to a specific group' })
  async getGroupPosts(
    @Param('id') id: string,
    @Query('search') search?: string,
    @Query('isBlocked') isBlocked?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.getPostsList({
      groupId: id,
      search,
      isBlocked,
      page,
      limit,
    });
  }

  @Delete('admin/groups/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Permanently delete a group' })
  async deleteGroup(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.moderationService.deleteGroup(id, admin.id);
  }

  @Post('admin/feed/fetch')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Fetch and parse news articles from newsapi or newsdata URL' })
  async fetchNewsFeed(
    @Body() body: { provider: 'newsapi' | 'newsdata'; url: string },
  ) {
    return this.moderationService.fetchNewsFeed(body.provider, body.url);
  }

  @Post('admin/groups/:id/feed-batch-posts')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Batch import feed articles as posts into group' })
  async createBatchPostsInGroup(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body()
    body: {
      posts: Array<{
        content: string;
        mediaUrl?: string;
        imageUrl?: string;
        videoUrl?: string;
        mediaType?: 'IMAGE' | 'VIDEO';
      }>;
    },
  ) {
    return this.moderationService.createBatchPostsInGroup(id, admin.id, body.posts);
  }

  @Patch('admin/groups/:id/avatar')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Update avatar / profile picture of a community group' })
  async updateGroupAvatar(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body('avatarUrl') avatarUrl: string,
  ) {
    return this.moderationService.updateGroupAvatar(id, admin.id, avatarUrl);
  }

  @Post('admin/groups/:id/avatar/upload')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Upload an avatar image file for a community group' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: createAvatarStorage('groups'),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files (JPG, PNG, GIF, WEBP) are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadGroupAvatar(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const baseUrl = (process.env.MEDIA_PUBLIC_URL || 'http://localhost:3001/uploads').replace(/\/+$/, '');
    const avatarUrl = `${baseUrl}/groups/${file.filename}`;
    return this.moderationService.updateGroupAvatar(id, admin.id, avatarUrl);
  }
}

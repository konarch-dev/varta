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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReportDto, ReportStatus, ModerationActionType, Role } from '@varta/shared';

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
    @Body() body: { content: string; mediaUrl?: string },
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
}

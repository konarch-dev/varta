import {
  Controller,
  Post,
  Get,
  Patch,
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
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin overview metrics (users, posts, pending reports)' })
  async getMetrics() {
    return this.moderationService.getPlatformMetrics();
  }

  @Get('admin/audit-logs')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Fetch immutable administrator audit log trail' })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLogs(@Query('limit') limit?: number) {
    return this.moderationService.getAuditLogs(limit ? Number(limit) : 50);
  }
}

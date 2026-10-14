import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Social Relationships')
@Controller('social')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow user or send follow request' })
  async follow(
    @CurrentUser() user: any,
    @Param('username') username: string,
  ) {
    return this.socialService.followUser(user.id, username);
  }

  @Delete('follow/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow user or cancel pending request' })
  async unfollow(
    @CurrentUser() user: any,
    @Param('username') username: string,
  ) {
    return this.socialService.unfollowUser(user.id, username);
  }

  @Get('follow-requests')
  @ApiOperation({ summary: 'List pending follow requests' })
  async getFollowRequests(@CurrentUser() user: any) {
    return this.socialService.getPendingFollowRequests(user.id);
  }

  @Post('follow-requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept follow request' })
  async acceptRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.socialService.acceptFollowRequest(id, user.id);
  }

  @Post('follow-requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject follow request' })
  async rejectRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.socialService.rejectFollowRequest(id, user.id);
  }

  @Post('block/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Block user' })
  async blockUser(
    @CurrentUser() user: any,
    @Param('username') username: string,
  ) {
    return this.socialService.blockUser(user.id, username);
  }

  @Delete('block/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unblock user' })
  async unblockUser(
    @CurrentUser() user: any,
    @Param('username') username: string,
  ) {
    return this.socialService.unblockUser(user.id, username);
  }

  @Post('mute/:username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle mute status on user' })
  async toggleMute(
    @CurrentUser() user: any,
    @Param('username') username: string,
  ) {
    return this.socialService.toggleMute(user.id, username);
  }
}

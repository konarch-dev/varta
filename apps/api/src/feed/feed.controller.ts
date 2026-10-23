import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Feeds')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('following')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chronological timeline of posts from followed users' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getFollowingFeed(
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.feedService.getFollowingFeed(user.id, cursor, limit ? Number(limit) : 20);
  }

  @Get('for-you')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Algorithmic discovery feed based on engagement and recency' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'category', required: false })
  async getForYouFeed(
    @CurrentUser() viewer: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
  ) {
    return this.feedService.getForYouFeed(viewer?.id, cursor, limit ? Number(limit) : 20, category);
  }

  @Get('user/:username')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Get a specific user's posts timeline" })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'tab', required: false })
  async getUserPosts(
    @Param('username') username: string,
    @CurrentUser() viewer: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @Query('tab') tab?: string,
  ) {
    return this.feedService.getUserPosts(
      username,
      viewer?.id,
      cursor,
      limit ? Number(limit) : 20,
      tab,
    );
  }

  @Get('bookmarks')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user private bookmarks timeline' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getBookmarks(
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.feedService.getBookmarks(user.id, cursor, limit ? Number(limit) : 20);
  }
}

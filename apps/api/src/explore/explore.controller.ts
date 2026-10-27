import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Explore & Search')
@Controller('explore')
export class ExploreController {
  constructor(private readonly exploreService: ExploreService) {}

  @Get('trending')
  @ApiOperation({ summary: 'Get trending hashtags' })
  @ApiQuery({ name: 'limit', required: false })
  async getTrending(@Query('limit') limit?: number) {
    return this.exploreService.getTrending(limit ? Number(limit) : 10);
  }

  @Get('search')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Search posts, users, and hashtags' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'type', required: false, enum: ['all', 'posts', 'users', 'tags'] })
  @ApiQuery({ name: 'limit', required: false })
  async search(
    @Query('q') q: string,
    @Query('type') type?: string,
    @Query('limit') limit?: number,
    @CurrentUser() viewer?: any,
  ) {
    return this.exploreService.search(
      q,
      type || 'all',
      viewer?.id,
      limit ? Number(limit) : 20,
    );
  }

  @Get('hashtag/:tag')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get posts tagged with specific hashtag' })
  @ApiQuery({ name: 'limit', required: false })
  async getPostsByHashtag(
    @Param('tag') tag: string,
    @Query('limit') limit?: number,
    @CurrentUser() viewer?: any,
  ) {
    return this.exploreService.getPostsByHashtag(
      tag,
      viewer?.id,
      limit ? Number(limit) : 20,
    );
  }

  @Get('who-to-follow')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Recommended creators and community accounts to follow' })
  @ApiQuery({ name: 'limit', required: false })
  async getWhoToFollow(
    @CurrentUser() user: any,
    @Query('limit') limit?: number,
  ) {
    return this.exploreService.getWhoToFollow(user?.id, limit ? Number(limit) : 5);
  }

  @Get('communities')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get groups/communities with category filter and search' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'joined', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  async getCommunities(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('joined') joined?: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: any,
  ) {
    return this.exploreService.getCommunities(
      category,
      search,
      joined === 'true',
      user?.id,
      limit ? Number(limit) : 50,
      cursor,
    );
  }

  @Post('communities')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new community group (admin or regular user)' })
  async createCommunity(
    @CurrentUser() user: any,
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
    return this.exploreService.createCommunity(user.id, body);
  }

  @Post('communities/:id/join')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle join/leave community' })
  async toggleJoinCommunity(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.exploreService.toggleJoinCommunity(id, user.id);
  }

  @Get('communities/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get community details by ID or slug' })
  async getCommunity(
    @Param('id') id: string,
    @CurrentUser() user?: any,
  ) {
    return this.exploreService.getCommunity(id, user?.id);
  }

  @Get('communities/:id/posts')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get community posts with media and videos' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  async getCommunityPosts(
    @Param('id') id: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @CurrentUser() user?: any,
  ) {
    return this.exploreService.getCommunityPosts(
      id,
      limit ? Number(limit) : 20,
      cursor,
      user?.id,
    );
  }
}

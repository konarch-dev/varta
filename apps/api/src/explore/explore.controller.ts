import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ExploreService } from './explore.service';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
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
}

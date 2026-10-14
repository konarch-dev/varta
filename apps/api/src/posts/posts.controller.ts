import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreatePostDto } from '@varta/shared';

@ApiTags('Posts & Interactions')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post, reply, quote, poll, or repost' })
  async createPost(
    @CurrentUser() user: any,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.createPost(user.id, dto);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get single post details with media and polls' })
  async getPostById(
    @Param('id') id: string,
    @CurrentUser() viewer: any,
  ) {
    return this.postsService.getPostById(id, viewer?.id);
  }

  @Get(':id/replies')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get replies to post' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReplies(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
    @CurrentUser() viewer?: any,
  ) {
    return this.postsService.getReplies(id, cursor, limit ? Number(limit) : 20, viewer?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a post' })
  async deletePost(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.deletePost(id, user.id, user.role);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle like on post' })
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.toggleLike(id, user.id);
  }

  @Post(':id/repost')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle repost on post' })
  async toggleRepost(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.toggleRepost(id, user.id);
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle private bookmark on post' })
  async toggleBookmark(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.toggleBookmark(id, user.id);
  }

  @Post('poll/:pollId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cast vote on a poll option' })
  async votePoll(
    @Param('pollId') pollId: string,
    @Body('optionId') optionId: string,
    @CurrentUser() user: any,
  ) {
    return this.postsService.votePoll(pollId, optionId, user.id);
  }
}

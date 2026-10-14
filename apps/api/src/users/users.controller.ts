import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from '@varta/shared';

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
}

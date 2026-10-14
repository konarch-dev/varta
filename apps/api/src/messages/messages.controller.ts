import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SendMessageDto } from '@varta/shared';

@ApiTags('Direct Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get current user active DM conversations' })
  async getConversations(@CurrentUser() user: any) {
    return this.messagesService.getConversations(user.id);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Find or start a DM conversation with a user' })
  async startConversation(
    @CurrentUser() user: any,
    @Body('username') targetUsername: string,
  ) {
    return this.messagesService.getOrCreateConversation(user.id, targetUsername);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMessages(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.getMessages(id, user.id, cursor, limit ? Number(limit) : 30);
  }

  @Post('conversations/:id')
  @ApiOperation({ summary: 'Send message to conversation' })
  async sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(id, user.id, dto);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read' })
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.messagesService.markAsRead(id, user.id);
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get(':application')
  async getMessages(
    @CurrentUser() user: any,
    @Param('application') applicationId: string,
  ) {
    return this.messagesService.getMessages(applicationId, user);
  }

  @Post(':application')
  async sendMessage(
    @CurrentUser() user: any,
    @Param('application') applicationId: string,
    @Body('body') bodyText: string,
  ) {
    return this.messagesService.sendMessage(applicationId, user, bodyText);
  }
}

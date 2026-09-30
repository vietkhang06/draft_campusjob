import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser('id') userId: string) {
    const notifications = await this.notificationsService.getUserNotifications(userId);
    return { notifications };
  }

  @Post()
  async markAllRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(userId);
  }

  @Post(':id')
  async markOneRead(
    @CurrentUser('id') userId: string,
    @Param('id') notificationId: string,
  ) {
    return this.notificationsService.markAsRead(userId, notificationId);
  }
}

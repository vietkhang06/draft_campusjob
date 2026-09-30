import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('moderator', 'admin')
@Controller('moderation')
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get()
  async getQueue() {
    return this.moderationService.getQueue();
  }

  @Post(':id/job')
  async moderateJob(
    @CurrentUser() user: any,
    @Param('id') jobId: string,
    @Body() body: any,
  ) {
    return this.moderationService.moderateJob(jobId, user, body);
  }

  @Post(':id/report')
  async moderateReport(
    @CurrentUser() user: any,
    @Param('id') reportId: string,
    @Body() body: any,
  ) {
    return this.moderationService.moderateReport(reportId, user, body);
  }

  @Post(':id/review')
  async moderateReview(
    @CurrentUser() user: any,
    @Param('id') reviewId: string,
    @Body() body: any,
  ) {
    return this.moderationService.moderateReview(reviewId, user, body);
  }
}

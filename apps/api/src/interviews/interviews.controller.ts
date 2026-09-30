import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('interviews')
export class InterviewsController {
  constructor(private interviewsService: InterviewsService) {}

  @Get()
  async getInterviews(@CurrentUser() user: any) {
    return this.interviewsService.getInterviews(user);
  }

  @Post(':application')
  async invite(
    @CurrentUser('id') userId: string,
    @Param('application') applicationId: string,
    @Body() body: any,
  ) {
    return this.interviewsService.invite(applicationId, userId, body);
  }

  @Post(':application/confirm')
  async confirm(
    @CurrentUser('id') userId: string,
    @Param('application') applicationId: string,
  ) {
    return this.interviewsService.confirm(applicationId, userId);
  }

  @Post(':application/reschedule')
  async reschedule(
    @CurrentUser('id') userId: string,
    @Param('application') applicationId: string,
    @Body() body: any,
  ) {
    return this.interviewsService.reschedule(applicationId, userId, body);
  }

  @Post(':application/resolve')
  async resolve(
    @CurrentUser('id') userId: string,
    @Param('application') applicationId: string,
    @Body() body: any,
  ) {
    return this.interviewsService.resolve(applicationId, userId, body);
  }
}

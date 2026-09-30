import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Roles('employer')
  @Get()
  async getMyCompanyReviews(@CurrentUser('id') userId: string) {
    return this.reviewsService.getCompanyReviews(userId);
  }

  @Roles('student')
  @Post()
  async createReview(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.reviewsService.createReview(userId, body);
  }

  @Roles('employer')
  @Post(':id')
  async replyReview(
    @CurrentUser('id') userId: string,
    @Param('id') reviewId: string,
    @Body('reply') replyText: string,
  ) {
    return this.reviewsService.replyReview(userId, reviewId, replyText);
  }
}

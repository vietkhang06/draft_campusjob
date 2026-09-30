import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  async getMyReports(@CurrentUser('id') userId: string) {
    return this.reportsService.getMyReports(userId);
  }

  @Post()
  async createReport(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.reportsService.createReport(user, body);
  }
}

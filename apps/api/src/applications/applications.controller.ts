import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Get()
  async getApplications(
    @CurrentUser() user: any,
    @Query('sort') sort?: string,
  ) {
    return this.applicationsService.getApplications(user, sort);
  }

  @Get(':id')
  async getApplication(
    @CurrentUser() user: any,
    @Param('id') applicationId: string,
  ) {
    return this.applicationsService.getApplicationDetail(applicationId, user);
  }

  @Post()
  async apply(
    @CurrentUser('id') userId: string,
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    return this.applicationsService.apply(userId, user, body);
  }

  @Post(':id')
  async updateStatus(
    @CurrentUser() user: any,
    @Param('id') applicationId: string,
    @Body() body: any,
  ) {
    return this.applicationsService.updateStatus(applicationId, user, body);
  }
}

import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Public()
  @Get('jobs')
  async listJobs(@Query() query: any) {
    return this.jobsService.listPublicJobs(query);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('jobs/:id')
  async getJob(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.getJobDetail(id, user?.id, user?.role);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employer')
  @Get('my-jobs')
  async getMyJobs(@CurrentUser('id') userId: string) {
    return this.jobsService.getEmployerJobs(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employer')
  @Post('jobs')
  async createJob(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.jobsService.saveJobPost(userId, null, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employer')
  @Post('jobs/:id')
  async updateJob(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
    @Body() body: any,
  ) {
    return this.jobsService.saveJobPost(userId, jobId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employer')
  @Post('jobs/:id/state')
  async changeState(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
    @Body('status') status: string,
  ) {
    return this.jobsService.changeState(userId, jobId, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @Get('saved')
  async getSavedJobs(@CurrentUser('id') userId: string) {
    return this.jobsService.getSavedJobs(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @Post('saved/:id')
  async saveJob(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
  ) {
    return this.jobsService.saveJob(userId, jobId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @Delete('saved/:id')
  async unsaveJob(
    @CurrentUser('id') userId: string,
    @Param('id') jobId: string,
  ) {
    return this.jobsService.unsaveJob(userId, jobId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  @Get('recommendations')
  async getRecommendations(@CurrentUser() user: any) {
    return this.jobsService.getRecommendations(user.id, user.profile);
  }
}

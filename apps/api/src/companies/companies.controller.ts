import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Public()
  @Get('companies')
  async getCompanies(@Query('q') q?: string) {
    const companies = await this.companiesService.getPublicCompanies(q);
    return { companies };
  }

  @Public()
  @Get('companies/:id')
  async getCompany(@Param('id') id: string) {
    const company = await this.companiesService.getPublicCompany(id);
    return { company };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employer')
  @Get('company')
  async getMyCompany(@CurrentUser('id') userId: string) {
    const company = await this.companiesService.getEmployerCompany(userId);
    return { company };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('employer')
  @Post('company')
  async saveMyCompany(
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.companiesService.createOrUpdateCompany(userId, body);
  }
}

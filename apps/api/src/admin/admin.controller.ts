import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private adminService: AdminService,
    private maintenanceService: MaintenanceService,
  ) {}

  @Get('overview')
  async getOverview() {
    return this.adminService.getOverview();
  }

  @Get('reports')
  async getAnalytics(@Query() query: any) {
    return this.adminService.getAnalytics(query);
  }

  @Post(':id/company')
  async decideCompany(
    @CurrentUser('id') adminId: string,
    @Param('id') companyId: string,
    @Body() body: any,
  ) {
    return this.adminService.decideCompany(companyId, adminId, body);
  }

  @Post(':id/clear_flag')
  async clearFlag(
    @CurrentUser('id') adminId: string,
    @Param('id') companyId: string,
    @Body() body: any,
  ) {
    return this.adminService.clearFlag(companyId, adminId, body);
  }

  @Post(':id/role')
  async changeRole(
    @CurrentUser('id') adminId: string,
    @Param('id') targetUserId: string,
    @Body('role') role: string,
  ) {
    return this.adminService.changeUserRole(targetUserId, adminId, role);
  }

  @Post(':id/report')
  async decideReport(
    @CurrentUser('id') adminId: string,
    @Param('id') reportId: string,
    @Body() body: any,
  ) {
    return this.adminService.decideReport(reportId, adminId, body);
  }

  @Post(':id/lock')
  async lockStudent(
    @CurrentUser('id') adminId: string,
    @Param('id') targetUserId: string,
    @Body() body: any,
  ) {
    return this.adminService.lockStudent(targetUserId, adminId, body);
  }

  @Post('maintenance')
  async runMaintenance() {
    return this.maintenanceService.runMaintenance();
  }
}

import {
  Controller,
  Post,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { MaintenanceService } from './maintenance.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('maintenance')
export class MaintenanceController {
  constructor(
    private maintenanceService: MaintenanceService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post()
  async handleCron(@Req() req: Request) {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      throw new ForbiddenException('Không được phép.');
    }

    return this.maintenanceService.runMaintenance();
  }
}

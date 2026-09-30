import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { MaintenanceService } from './maintenance.service';
export declare class MaintenanceController {
    private maintenanceService;
    private configService;
    constructor(maintenanceService: MaintenanceService, configService: ConfigService);
    handleCron(req: Request): Promise<{
        email: string;
        sent: number;
        ok: boolean;
    }>;
}

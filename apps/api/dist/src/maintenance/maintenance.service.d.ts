import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class MaintenanceService {
    private prisma;
    private mailService;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, mailService: MailService, notificationsService: NotificationsService);
    runMaintenance(): Promise<{
        email: string;
        sent: number;
        ok: boolean;
    }>;
    flushEmail(): Promise<{
        email: string;
        sent: number;
    }>;
}

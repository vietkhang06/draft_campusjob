import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ReportsService {
    private prisma;
    private filesService;
    private notificationsService;
    constructor(prisma: PrismaService, filesService: FilesService, notificationsService: NotificationsService);
    getMyReports(userId: string): Promise<{
        reports: {
            id: string;
            target: string;
            target_type: string;
            application: string;
            kind: string;
            description: string;
            evidence: string;
            status: string;
            recommendation: string;
            decision: string;
            resolved_by: string;
            created: string;
        }[];
        companies: {
            id: string;
            name: string;
        }[];
        users: {
            id: string;
            name: string;
        }[];
    }>;
    createReport(user: any, body: any): Promise<{
        id: string;
    }>;
}

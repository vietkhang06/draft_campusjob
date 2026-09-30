import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export declare class ModerationService {
    private prisma;
    private notificationsService;
    private auditService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, auditService: AuditService);
    getQueue(): Promise<{
        jobs: {
            id: string;
            title: string;
            type: string;
            industry: string;
            description: string;
            skills: string;
            schedule: string;
            benefits: string;
            salary_min: number;
            salary_max: number;
            salary_unit: string;
            deadline: string;
            company_name: string;
            company_status: string;
        }[];
        reports: {
            id: string;
            kind: string;
            status: string;
            description: string;
            evidence: string;
            application: string;
            recommendation: string;
            reporter_name: string;
            target_name: string;
        }[];
        reviews: {
            id: string;
            rating: number;
            comment: string;
            hidden: number;
            company_name: string;
        }[];
    }>;
    moderateJob(jobId: string, user: any, body: any): Promise<{
        ok: boolean;
    }>;
    moderateReport(reportId: string, user: any, body: any): Promise<{
        ok: boolean;
    }>;
    moderateReview(reviewId: string, user: any, body: any): Promise<{
        ok: boolean;
    }>;
}

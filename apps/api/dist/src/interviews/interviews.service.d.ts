import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export declare class InterviewsService {
    private prisma;
    private notificationsService;
    private auditService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, auditService: AuditService);
    getInterviews(user: any): Promise<{
        interviews: {
            id: string;
            application_id: string;
            title: string;
            company_name: string;
            student_name: string;
            time: string;
            mode: string;
            location: string;
            message: string;
            response: string;
            reschedule_used: number;
            proposed: string;
            request_reason: string;
            decision: string;
            created: string;
        }[];
    }>;
    invite(applicationId: string, employerId: string, body: any): Promise<{
        id: string;
    }>;
    confirm(applicationId: string, studentId: string): Promise<{
        ok: boolean;
    }>;
    reschedule(applicationId: string, studentId: string, body: any): Promise<{
        ok: boolean;
    }>;
    resolve(applicationId: string, employerId: string, body: any): Promise<{
        ok: boolean;
    }>;
}

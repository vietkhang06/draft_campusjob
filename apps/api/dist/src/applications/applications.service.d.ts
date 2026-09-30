import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export declare class ApplicationsService {
    private prisma;
    private notificationsService;
    private auditService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, auditService: AuditService);
    getApplications(user: any, sort?: string): Promise<{
        applications: {
            id: string;
            job: string;
            title: string;
            company_name: string;
            score: number;
            status: string;
            created: string;
        }[];
    } | {
        applications: {
            id: string;
            job: string;
            title: string;
            student_name: string;
            score: number;
            status: string;
            created: string;
        }[];
    }>;
    getApplicationDetail(applicationId: string, user: any): Promise<{
        application: {
            id: string;
            student: string;
            student_name: string;
            student_email: string;
            job: string;
            title: string;
            company: string;
            company_name: string;
            company_status: string;
            owner: string;
            snapshot: import("@prisma/client/runtime/library").JsonValue;
            letter: string;
            score: number;
            status: string;
            reason: string;
            created: string;
            updated: string;
        };
        interview: {
            id: string;
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
        };
        review: {
            id: string;
            rating: number;
            comment: string;
            reply: string;
            created: string;
        };
        history: {
            id: string;
            action: string;
            created: string;
            detail: import("@prisma/client/runtime/library").JsonValue;
        }[];
    }>;
    apply(studentId: string, user: any, body: any): Promise<{
        id: string;
    }>;
    updateStatus(applicationId: string, user: any, body: any): Promise<{
        ok: boolean;
        filled: boolean;
    }>;
}

import { ApplicationsService } from './applications.service';
export declare class ApplicationsController {
    private applicationsService;
    constructor(applicationsService: ApplicationsService);
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
    getApplication(user: any, applicationId: string): Promise<{
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
    apply(userId: string, user: any, body: any): Promise<{
        id: string;
    }>;
    updateStatus(user: any, applicationId: string, body: any): Promise<{
        ok: boolean;
        filled: boolean;
    }>;
}

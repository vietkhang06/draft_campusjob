import { InterviewsService } from './interviews.service';
export declare class InterviewsController {
    private interviewsService;
    constructor(interviewsService: InterviewsService);
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
    invite(userId: string, applicationId: string, body: any): Promise<{
        id: string;
    }>;
    confirm(userId: string, applicationId: string): Promise<{
        ok: boolean;
    }>;
    reschedule(userId: string, applicationId: string, body: any): Promise<{
        ok: boolean;
    }>;
    resolve(userId: string, applicationId: string, body: any): Promise<{
        ok: boolean;
    }>;
}

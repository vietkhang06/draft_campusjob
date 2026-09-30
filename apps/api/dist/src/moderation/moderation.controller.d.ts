import { ModerationService } from './moderation.service';
export declare class ModerationController {
    private moderationService;
    constructor(moderationService: ModerationService);
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
    moderateJob(user: any, jobId: string, body: any): Promise<{
        ok: boolean;
    }>;
    moderateReport(user: any, reportId: string, body: any): Promise<{
        ok: boolean;
    }>;
    moderateReview(user: any, reviewId: string, body: any): Promise<{
        ok: boolean;
    }>;
}

import { ReportsService } from './reports.service';
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
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

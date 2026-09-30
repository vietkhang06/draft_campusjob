import { JobsService } from './jobs.service';
export declare class JobsController {
    private jobsService;
    constructor(jobsService: JobsService);
    listJobs(query: any): Promise<{
        jobs: {
            id: string;
            company: string;
            company_name: string;
            branch: string;
            title: string;
            industry: string;
            type: string;
            description: string;
            skills: string;
            preferred: string;
            vacancies: number;
            salary_min: number;
            salary_max: number;
            salary_unit: string;
            schedule: string;
            benefits: string;
            deadline: string;
            featured_until: string;
            status: string;
            flag: number;
            city: string;
            address: string;
            lat: number;
            lng: number;
            rating: number;
            review_count: number;
            views: number;
            saves: number;
            reputation: number;
            isFeatured: boolean;
            distance: number;
            created: string;
        }[];
        facets: {
            cities: string[];
            industries: string[];
        };
    }>;
    getJob(id: string, user: any): Promise<{
        job: {
            id: string;
            company: string;
            company_name: string;
            company_status: string;
            owner: string;
            title: string;
            industry: string;
            type: string;
            description: string;
            skills: string;
            preferred: string;
            vacancies: number;
            salary_min: number;
            salary_max: number;
            salary_unit: string;
            schedule: string;
            benefits: string;
            deadline: string;
            featured_until: string;
            status: string;
            city: string;
            address: string;
            lat: number;
            lng: number;
        };
        company: {
            id: string;
            name: string;
            industry: string;
            size: string;
            description: string;
            website: string;
            flag: number;
        };
    }>;
    getMyJobs(userId: string): Promise<{
        jobs: {
            id: string;
            title: string;
            status: string;
            deadline: string;
            salary_min: number;
            salary_max: number;
            salary_unit: string;
            vacancies: number;
            reason: string;
            applications: number;
            hired: number;
            views: number;
            created: string;
        }[];
    }>;
    createJob(userId: string, body: any): Promise<{
        id: any;
    }>;
    updateJob(userId: string, jobId: string, body: any): Promise<{
        id: any;
    }>;
    changeState(userId: string, jobId: string, status: string): Promise<{
        ok: boolean;
    }>;
    getSavedJobs(userId: string): Promise<{
        jobs: {
            id: string;
            title: string;
            company: string;
            company_name: string;
            city: string;
            type: string;
            deadline: string;
            salary_min: number;
            salary_max: number;
            salary_unit: string;
            featured_until: string;
        }[];
    }>;
    saveJob(userId: string, jobId: string): Promise<{
        ok: boolean;
    }>;
    unsaveJob(userId: string, jobId: string): Promise<{
        ok: boolean;
    }>;
    getRecommendations(user: any): Promise<{
        jobs: any[];
    }>;
}

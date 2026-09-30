import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export declare class JobsService {
    private prisma;
    private notificationsService;
    private auditService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, auditService: AuditService);
    listPublicJobs(q?: any): Promise<{
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
    getJobDetail(jobId: string, currentUserId?: string, userRole?: string): Promise<{
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
    getEmployerJobs(userId: string): Promise<{
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
    saveJobPost(userId: string, jobId: string | null, data: any): Promise<{
        id: any;
    }>;
    changeState(userId: string, jobId: string, newStatus: string): Promise<{
        ok: boolean;
    }>;
    saveJob(studentId: string, jobId: string): Promise<{
        ok: boolean;
    }>;
    unsaveJob(studentId: string, jobId: string): Promise<{
        ok: boolean;
    }>;
    getSavedJobs(studentId: string): Promise<{
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
    getRecommendations(studentId: string, profile: any): Promise<{
        jobs: any[];
    }>;
}

import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export declare class CompaniesService {
    private prisma;
    private filesService;
    private notificationsService;
    private auditService;
    constructor(prisma: PrismaService, filesService: FilesService, notificationsService: NotificationsService, auditService: AuditService);
    getPublicCompanies(q?: string): Promise<{
        open_jobs: number;
        rating: number;
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        status: string;
        updatedAt: Date;
        ownerId: string;
        tax: string;
        address: string;
        phone: string;
        website: string | null;
        industry: string;
        size: string;
        hr: string;
        description: string;
        license: string | null;
        reason: string | null;
        flag: number;
    }[]>;
    getPublicCompany(id: string): Promise<{
        id: string;
        name: string;
        address: string;
        website: string;
        industry: string;
        size: string;
        description: string;
        status: string;
        flag: number;
        created: string;
        branches: {
            id: string;
            name: string;
            address: string;
            companyId: string;
            city: string;
            lat: number | null;
            lng: number | null;
        }[];
        reviews: {
            id: string;
            rating: number;
            comment: string;
            reply: string;
            created: string;
            student_name: string;
        }[];
        rating: number;
    }>;
    getEmployerCompany(userId: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        email: string;
        status: string;
        updatedAt: Date;
        ownerId: string;
        tax: string;
        address: string;
        phone: string;
        website: string | null;
        industry: string;
        size: string;
        hr: string;
        description: string;
        license: string | null;
        reason: string | null;
        flag: number;
    }>;
    createOrUpdateCompany(userId: string, data: any): Promise<{
        id: any;
    }>;
}

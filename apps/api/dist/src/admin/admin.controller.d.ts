import { AdminService } from './admin.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
export declare class AdminController {
    private adminService;
    private maintenanceService;
    constructor(adminService: AdminService, maintenanceService: MaintenanceService);
    getOverview(): Promise<{
        companies: {
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
        }[];
        users: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            role: import("@prisma/client").$Enums.UserRole;
            status: import("@prisma/client").$Enums.UserStatus;
            emailVerifiedAt: Date | null;
            failedLoginAttempts: number;
            lockedUntil: Date | null;
            lastLoginAt: Date | null;
            profile: import("@prisma/client/runtime/library").JsonValue;
            updatedAt: Date;
        }[];
        reports: {
            id: string;
            kind: string;
            createdAt: Date;
            status: string;
            updatedAt: Date;
            description: string;
            evidence: string | null;
            applicationId: string | null;
            reporterId: string;
            targetId: string;
            targetType: string;
            recommendation: string | null;
            decision: string | null;
            resolvedBy: string | null;
            occurred: Date | null;
        }[];
        sanctions: {
            id: string;
            kind: string;
            createdAt: Date;
            reason: string;
            targetId: string;
            until: Date | null;
            reportId: string | null;
            actorId: string;
        }[];
        audit: {
            actor_name: string;
            id: string;
            createdAt: Date;
            entity: string;
            entityId: string;
            action: string;
            actor: string;
            detail: import("@prisma/client/runtime/library").JsonValue;
        }[];
        mail: {
            status: string;
            total: number;
        }[];
        emailConfigured: boolean;
    }>;
    getAnalytics(query: any): Promise<{
        monthly: {
            month: string;
            industry: string;
            type: string;
            total: number;
        }[];
        pending: {
            kind: string;
            title: string;
            created: string;
        }[];
        sanctions: {
            id: string;
            name: string;
            kind: string;
            reason: string;
            created: string;
            until: string;
        }[];
        top: {
            name: string;
            views: number;
            applications: number;
        }[];
        hires: {
            industry: string;
            total: number;
        }[];
        funnel: {
            title: string;
            views: number;
            applications: number;
            interviews: number;
            hired: number;
        }[];
        ratings: {
            name: string;
            month: string;
            average: number;
            total: number;
        }[];
        students: {
            name: string;
            applications: number;
            skill_match: number;
            interviews: number;
            interview_rate: number;
        }[];
    }>;
    decideCompany(adminId: string, companyId: string, body: any): Promise<{
        ok: boolean;
    }>;
    clearFlag(adminId: string, companyId: string, body: any): Promise<{
        ok: boolean;
    }>;
    changeRole(adminId: string, targetUserId: string, role: string): Promise<{
        ok: boolean;
    }>;
    decideReport(adminId: string, reportId: string, body: any): Promise<{
        ok: boolean;
    }>;
    lockStudent(adminId: string, targetUserId: string, body: any): Promise<{
        ok: boolean;
    }>;
    runMaintenance(): Promise<{
        email: string;
        sent: number;
        ok: boolean;
    }>;
}

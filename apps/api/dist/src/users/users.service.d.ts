import { PrismaService } from '../prisma/prisma.service';
import { FilesService } from '../files/files.service';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
export declare class UsersService {
    private prisma;
    private filesService;
    private mailService;
    private auditService;
    constructor(prisma: PrismaService, filesService: FilesService, mailService: MailService, auditService: AuditService);
    private sha256;
    getProfile(userId: string): Promise<{
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
    }>;
    updateProfile(userId: string, data: any): Promise<{
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
    }>;
    getSchoolVerification(userId: string): Promise<{
        verification: {
            email: string;
            verified: Date;
            expires: Date;
            attempts: number;
        };
        available: boolean;
    }>;
    sendSchoolVerificationOtp(userId: string, emailInput: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    confirmSchoolVerificationOtp(userId: string, codeInput: string): Promise<{
        ok: boolean;
        message: string;
    }>;
}

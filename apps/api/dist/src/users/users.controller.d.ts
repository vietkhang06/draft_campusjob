import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getProfile(userId: string): Promise<{
        user: {
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
        };
    }>;
    updateProfile(userId: string, body: any): Promise<{
        ok: boolean;
        user: {
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
        };
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
    sendSchoolVerification(userId: string, email: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    confirmSchoolVerification(userId: string, code: string): Promise<{
        ok: boolean;
        message: string;
    }>;
}

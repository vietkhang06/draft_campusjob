export type UserRole = 'student' | 'employer' | 'moderator' | 'admin';
export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'locked';
export interface ApiErrorResponse {
    statusCode: number;
    code: string;
    message: string;
    details?: unknown;
}
export interface AuthUserDto {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    emailVerifiedAt: string | null;
    profile: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}
export interface LoginResponseDto {
    accessToken: string;
    user: AuthUserDto;
}
export declare const LABELS: Record<string, string>;
export declare const JOB_TYPES: readonly ["Thực tập", "Bán thời gian", "Toàn thời gian", "Làm việc từ xa"];
export declare const INDUSTRIES: readonly ["Công nghệ phần mềm", "Marketing", "Kế toán", "Thiết kế", "Ngoại ngữ – Biên phiên dịch", "Kinh doanh", "Giáo dục", "Nhà hàng – Khách sạn", "Hành chính – Nhân sự", "Khác"];
//# sourceMappingURL=index.d.ts.map
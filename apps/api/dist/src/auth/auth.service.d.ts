import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private mailService;
    private readonly logger;
    private readonly refreshTtlDays;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    private sha256;
    private sanitizeUser;
    register(dto: RegisterDto): Promise<{
        devTestCode?: string;
        devVerificationToken?: string;
        message: string;
        user: any;
    }>;
    login(dto: LoginDto, userAgent?: string, ipAddress?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    refresh(refreshToken: string, userAgent?: string, ipAddress?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    logout(refreshToken?: string): Promise<{
        ok: boolean;
    }>;
    logoutAll(userId: string): Promise<{
        ok: boolean;
    }>;
    verifyEmail(token: string, email?: string): Promise<{
        message: string;
        user: any;
    } | {
        message: string;
        user?: undefined;
    }>;
    resendVerification(email: string): Promise<{
        message: string;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
}

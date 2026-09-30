import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private authService;
    private configService;
    private readonly isCookieSecure;
    private readonly cookieDomain?;
    private readonly refreshTtlDays;
    constructor(authService: AuthService, configService: ConfigService);
    private setRefreshCookie;
    private clearRefreshCookie;
    register(dto: RegisterDto): Promise<{
        devTestCode?: string;
        devVerificationToken?: string;
        message: string;
        user: any;
    }>;
    login(dto: LoginDto, req: Request, res: Response): Promise<{
        accessToken: string;
        user: any;
    }>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
        user: any;
    }>;
    logout(req: Request, res: Response): Promise<{
        ok: boolean;
        message: string;
    }>;
    logoutAll(userId: string, res: Response): Promise<{
        ok: boolean;
        message: string;
    }>;
    me(user: any): Promise<{
        user: any;
    }>;
    verifyEmail(dto: VerifyEmailDto): Promise<{
        message: string;
        user: any;
    } | {
        message: string;
        user?: undefined;
    }>;
    resendVerification(dto: ResendVerificationDto): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(userId: string, dto: ChangePasswordDto, res: Response): Promise<{
        message: string;
    }>;
}

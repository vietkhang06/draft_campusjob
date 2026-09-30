"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const mail_service_1 = require("../mail/mail.service");
const audit_service_1 = require("../audit/audit.service");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const argon2 = __importStar(require("argon2"));
const register_dto_1 = require("./dto/register.dto");
describe('AuthService (Unit Tests)', () => {
    let service;
    let prisma;
    let jwtService;
    let mailService;
    let auditService;
    beforeEach(async () => {
        prisma = {
            user: {
                findUnique: jest.fn(),
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            authSession: {
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                updateMany: jest.fn(),
            },
            emailVerificationToken: {
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            passwordResetToken: {
                findFirst: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            $transaction: jest.fn(async (args) => Array.isArray(args) ? Promise.all(args) : typeof args === 'function' ? args(prisma) : args),
        };
        jwtService = {
            sign: jest.fn(() => 'mock_access_token'),
        };
        mailService = {
            sendVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
        };
        auditService = {
            log: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: prisma_service_1.PrismaService, useValue: prisma },
                { provide: jwt_1.JwtService, useValue: jwtService },
                { provide: mail_service_1.MailService, useValue: mailService },
                { provide: audit_service_1.AuditService, useValue: auditService },
                {
                    provide: config_1.ConfigService,
                    useValue: {
                        get: jest.fn((key, def) => {
                            if (key === 'refreshTokenTtlDays')
                                return 30;
                            return def;
                        }),
                    },
                },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    it('1. should register student successfully', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
            id: 'student-uuid',
            email: 'student@example.com',
            name: 'Nguyen Van A',
            role: 'student',
            status: 'pending_verification',
        });
        const result = await service.register({
            email: 'student@example.com',
            password: 'StrongPassword123!',
            name: 'Nguyen Van A',
            role: register_dto_1.AllowedRegisterRole.STUDENT,
        });
        expect(result.message).toContain('thành công');
        expect(prisma.user.create).toHaveBeenCalled();
        expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });
    it('2. should register employer successfully', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        prisma.user.create.mockResolvedValue({
            id: 'employer-uuid',
            email: 'employer@company.com',
            name: 'HR Manager',
            role: 'employer',
            status: 'pending_verification',
        });
        const result = await service.register({
            email: 'employer@company.com',
            password: 'StrongPassword123!',
            name: 'HR Manager',
            role: register_dto_1.AllowedRegisterRole.EMPLOYER,
        });
        expect(result.message).toContain('thành công');
        expect(prisma.user.create).toHaveBeenCalled();
    });
    it('3. should reject registration with role moderator or admin', async () => {
        await expect(service.register({
            email: 'hacker@example.com',
            password: 'StrongPassword123!',
            name: 'Hacker',
            role: 'admin',
        })).rejects.toThrow(common_1.BadRequestException);
        await expect(service.register({
            email: 'hacker2@example.com',
            password: 'StrongPassword123!',
            name: 'Hacker 2',
            role: 'moderator',
        })).rejects.toThrow(common_1.BadRequestException);
    });
    it('4. should reject registration if email already exists', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'duplicate@example.com' });
        await expect(service.register({
            email: 'duplicate@example.com',
            password: 'StrongPassword123!',
            name: 'Nguyen Van B',
            role: register_dto_1.AllowedRegisterRole.STUDENT,
        })).rejects.toThrow(common_1.ConflictException);
    });
    it('5. should reject weak passwords during registration', async () => {
        prisma.user.findUnique.mockResolvedValue(null);
        await expect(service.register({
            email: 'weak1@example.com',
            password: 'Abc1!',
            name: 'Weak Pass',
            role: register_dto_1.AllowedRegisterRole.STUDENT,
        })).rejects.toThrow(common_1.BadRequestException);
        await expect(service.register({
            email: 'weak2@example.com',
            password: 'StrongPassword123',
            name: 'Weak Pass',
            role: register_dto_1.AllowedRegisterRole.STUDENT,
        })).rejects.toThrow(common_1.BadRequestException);
        await expect(service.register({
            email: 'weak3@example.com',
            password: 'strongpassword123!',
            name: 'Weak Pass',
            role: register_dto_1.AllowedRegisterRole.STUDENT,
        })).rejects.toThrow(common_1.BadRequestException);
    });
    it('6. should login successfully with valid credentials', async () => {
        const passwordHash = await argon2.hash('StrongPassword123!', { type: argon2.argon2id });
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-uuid',
            email: 'user@example.com',
            passwordHash,
            name: 'Nguyen Van A',
            role: 'student',
            status: 'active',
            failedLoginAttempts: 0,
            lockedUntil: null,
        });
        prisma.authSession.create.mockResolvedValue({ id: 'session-id' });
        const result = await service.login({ email: 'user@example.com', password: 'StrongPassword123!' }, 'user-agent', '127.0.0.1');
        expect(result.accessToken).toBe('mock_access_token');
        expect(result.refreshToken).toBeDefined();
        expect(result.user.email).toBe('user@example.com');
    });
    it('7. should fail login with incorrect password and increment failed attempts', async () => {
        const passwordHash = await argon2.hash('CorrectPassword123!', { type: argon2.argon2id });
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-uuid',
            email: 'user@example.com',
            passwordHash,
            failedLoginAttempts: 0,
            lockedUntil: null,
            status: 'active',
        });
        await expect(service.login({ email: 'user@example.com', password: 'WrongPassword123!' }, 'user-agent', '127.0.0.1')).rejects.toThrow(common_1.UnauthorizedException);
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'user-uuid' },
            data: expect.objectContaining({ failedLoginAttempts: 1 }),
        }));
    });
    it('8. should reject login if account is pending verification', async () => {
        const passwordHash = await argon2.hash('CorrectPassword123!', { type: argon2.argon2id });
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-uuid',
            email: 'unverified@example.com',
            passwordHash,
            status: 'pending_verification',
            failedLoginAttempts: 0,
            lockedUntil: null,
        });
        await expect(service.login({ email: 'unverified@example.com', password: 'CorrectPassword123!' }, 'user-agent', '127.0.0.1')).rejects.toThrow(common_1.ForbiddenException);
    });
    it('9. should temporarily lock account after 5 consecutive failed logins', async () => {
        const passwordHash = await argon2.hash('CorrectPassword123!', { type: argon2.argon2id });
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-uuid',
            email: 'user@example.com',
            passwordHash,
            failedLoginAttempts: 4,
            lockedUntil: null,
            status: 'active',
        });
        await expect(service.login({ email: 'user@example.com', password: 'WrongPassword123!' }, 'user-agent', '127.0.0.1')).rejects.toThrow(common_1.ForbiddenException);
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                failedLoginAttempts: 5,
                lockedUntil: expect.any(Date),
            }),
        }));
    });
    it('10. should rotate refresh token and return new token pair', async () => {
        const session = {
            id: 'session-id',
            userId: 'user-uuid',
            tokenFamily: 'family-123',
            revokedAt: null,
            expiresAt: new Date(Date.now() + 1000000),
            user: {
                id: 'user-uuid',
                email: 'user@example.com',
                role: 'student',
                status: 'active',
                name: 'Nguyen Van A',
            },
        };
        prisma.authSession.findFirst.mockResolvedValue(session);
        prisma.user.findUnique.mockResolvedValue(session.user);
        prisma.authSession.create.mockResolvedValue({ id: 'new-session-id' });
        const result = await service.refresh('old_raw_refresh_token', 'agent', 'ip');
        expect(result.accessToken).toBe('mock_access_token');
        expect(result.refreshToken).toBeDefined();
        expect(prisma.authSession.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'session-id' },
            data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }));
        expect(prisma.authSession.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ tokenFamily: 'family-123' }),
        }));
    });
    it('11. should detect reused revoked token and revoke entire token family', async () => {
        const revokedSession = {
            id: 'revoked-session-id',
            userId: 'user-uuid',
            tokenFamily: 'family-hijacked',
            revokedAt: new Date(Date.now() - 5000),
            expiresAt: new Date(Date.now() + 1000000),
            user: { id: 'user-uuid' },
        };
        prisma.authSession.findFirst.mockResolvedValue(revokedSession);
        await expect(service.refresh('reused_revoked_token')).rejects.toThrow(common_1.UnauthorizedException);
        expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
            where: { tokenFamily: 'family-hijacked' },
            data: { revokedAt: expect.any(Date) },
        });
    });
    it('12. should logout current session by revoking it', async () => {
        prisma.authSession.findFirst.mockResolvedValue({ id: 'session-id' });
        await service.logout('current_refresh_token');
        expect(prisma.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }));
    });
    it('13. should logout all user sessions', async () => {
        await service.logoutAll('user-uuid');
        expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
            where: { userId: 'user-uuid', revokedAt: null },
            data: { revokedAt: expect.any(Date) },
        });
    });
    it('14. should handle forgot password without email enumeration and reset password successfully', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'user-uuid',
            email: 'user@example.com',
            status: 'active',
        });
        const forgotRes = await service.forgotPassword('user@example.com');
        expect(forgotRes.message).toContain('hộp thư');
        expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
        prisma.passwordResetToken.findFirst.mockResolvedValue({
            id: 'token-id',
            userId: 'user-uuid',
            expiresAt: new Date(Date.now() + 100000),
            usedAt: null,
        });
        const resetRes = await service.resetPassword({
            token: 'raw_valid_token',
            password: 'BrandNewPassword123!',
        });
        expect(resetRes.message).toContain('thành công');
        expect(prisma.user.update).toHaveBeenCalled();
        expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'token-id' },
            data: expect.objectContaining({ usedAt: expect.any(Date) }),
        }));
        expect(prisma.authSession.updateMany).toHaveBeenCalled();
    });
    it('15. should reject expired or already used password reset token', async () => {
        prisma.passwordResetToken.findFirst.mockResolvedValue(null);
        await expect(service.resetPassword({
            token: 'already_used_or_expired_token',
            password: 'BrandNewPassword123!',
        })).rejects.toThrow(common_1.BadRequestException);
    });
});
//# sourceMappingURL=auth.service.spec.js.map
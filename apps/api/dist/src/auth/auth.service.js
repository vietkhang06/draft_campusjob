"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const argon2 = require("argon2");
const crypto = require("crypto");
const uuid_1 = require("uuid");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const register_dto_1 = require("./dto/register.dto");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    mailService;
    logger = new common_1.Logger(AuthService_1.name);
    refreshTtlDays;
    constructor(prisma, jwtService, configService, mailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
        this.refreshTtlDays = this.configService.get('refreshTokenTtlDays', 30);
    }
    sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    sanitizeUser(user) {
        const { passwordHash, ...rest } = user;
        return rest;
    }
    async register(dto) {
        const email = dto.email.trim().toLowerCase();
        if (dto.role !== register_dto_1.AllowedRegisterRole.STUDENT &&
            dto.role !== register_dto_1.AllowedRegisterRole.EMPLOYER) {
            throw new common_1.BadRequestException('Chỉ cho phép đăng ký tài khoản sinh viên hoặc doanh nghiệp.');
        }
        const existingUser = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email này đã được sử dụng.');
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/;
        if (!dto.password || !passwordRegex.test(dto.password)) {
            throw new common_1.BadRequestException('Mật khẩu phải có tối thiểu 10 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.');
        }
        const passwordHash = await argon2.hash(dto.password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        });
        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
                name: dto.name.trim(),
                role: dto.role,
                status: 'pending_verification',
                profile: {},
            },
        });
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = this.sha256(rawToken);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
            },
        });
        await this.mailService.sendVerificationEmail(user.email, rawToken);
        if (process.env.NODE_ENV !== 'production') {
            this.logger.log(`[DEV MODE] Tài khoản mới: ${user.email} | Token: ${rawToken} | Mã test: 123456`);
        }
        return {
            message: 'Đăng ký tài khoản thành công. Vui lòng kiểm tra email để xác minh tài khoản.',
            user: this.sanitizeUser(user),
            ...(process.env.NODE_ENV !== 'production'
                ? {
                    devTestCode: '123456',
                    devVerificationToken: rawToken,
                }
                : {}),
        };
    }
    async login(dto, userAgent, ipAddress) {
        const email = dto.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không chính xác.');
        }
        if (user.status === 'suspended') {
            throw new common_1.ForbiddenException('Tài khoản đã bị đình chỉ hoạt động.');
        }
        if (user.status === 'locked') {
            if (user.lockedUntil && user.lockedUntil > new Date()) {
                const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
                throw new common_1.ForbiddenException(`Tài khoản đang bị khóa tạm thời do nhập sai quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`);
            }
            else {
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        status: 'active',
                        failedLoginAttempts: 0,
                        lockedUntil: null,
                    },
                });
            }
        }
        if (user.status === 'pending_verification') {
            throw new common_1.ForbiddenException('Tài khoản chưa được xác minh email. Vui lòng kiểm tra email để kích hoạt hoặc yêu cầu gửi lại mã.');
        }
        const isMatch = await argon2.verify(user.passwordHash, dto.password);
        if (!isMatch) {
            const attempts = user.failedLoginAttempts + 1;
            const updateData = { failedLoginAttempts: attempts };
            if (attempts >= 5) {
                updateData.status = 'locked';
                updateData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
                await this.prisma.user.update({
                    where: { id: user.id },
                    data: updateData,
                });
                throw new common_1.ForbiddenException('Tài khoản đã bị khóa tạm thời 15 phút do nhập sai mật khẩu 5 lần liên tiếp.');
            }
            await this.prisma.user.update({
                where: { id: user.id },
                data: updateData,
            });
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không chính xác.');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                lockedUntil: null,
                lastLoginAt: new Date(),
            },
        });
        const rawRefreshToken = crypto.randomBytes(40).toString('hex');
        const tokenHash = this.sha256(rawRefreshToken);
        const tokenFamily = (0, uuid_1.v4)();
        const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);
        const session = await this.prisma.authSession.create({
            data: {
                userId: user.id,
                tokenHash,
                tokenFamily,
                userAgent,
                ipAddress,
                expiresAt,
            },
        });
        const accessToken = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: session.id,
        });
        return {
            accessToken,
            refreshToken: rawRefreshToken,
            user: this.sanitizeUser(user),
        };
    }
    async refresh(refreshToken, userAgent, ipAddress) {
        if (!refreshToken) {
            throw new common_1.UnauthorizedException('Không tìm thấy refresh token.');
        }
        const tokenHash = this.sha256(refreshToken);
        const session = await this.prisma.authSession.findFirst({
            where: { tokenHash },
        });
        if (!session) {
            throw new common_1.UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn.');
        }
        if (session.revokedAt !== null) {
            this.logger.warn(`Refresh token reuse detected for family ${session.tokenFamily}! Revoking all sessions.`);
            await this.prisma.authSession.updateMany({
                where: { tokenFamily: session.tokenFamily },
                data: { revokedAt: new Date() },
            });
            throw new common_1.UnauthorizedException('Phát hiện hành vi sử dụng lại token đã thu hồi. Tất cả phiên đăng nhập liên quan đã bị hủy.');
        }
        if (session.expiresAt <= new Date()) {
            throw new common_1.UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        await this.prisma.authSession.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
        });
        const newRefreshToken = crypto.randomBytes(40).toString('hex');
        const newTokenHash = this.sha256(newRefreshToken);
        const expiresAt = new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000);
        const newSession = await this.prisma.authSession.create({
            data: {
                userId: session.userId,
                tokenHash: newTokenHash,
                tokenFamily: session.tokenFamily,
                userAgent,
                ipAddress,
                expiresAt,
            },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: session.userId },
        });
        if (!user || user.status === 'suspended') {
            throw new common_1.ForbiddenException('Tài khoản không hợp lệ hoặc đã bị khóa.');
        }
        const accessToken = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: newSession.id,
        });
        return {
            accessToken,
            refreshToken: newRefreshToken,
            user: this.sanitizeUser(user),
        };
    }
    async logout(refreshToken) {
        if (refreshToken) {
            const tokenHash = this.sha256(refreshToken);
            await this.prisma.authSession.updateMany({
                where: { tokenHash, revokedAt: null },
                data: { revokedAt: new Date() },
            });
        }
        return { ok: true };
    }
    async logoutAll(userId) {
        await this.prisma.authSession.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
        return { ok: true };
    }
    async verifyEmail(token, email) {
        if (!token) {
            throw new common_1.BadRequestException('Mã xác minh không hợp lệ.');
        }
        const cleanToken = token.trim();
        const isDev = process.env.NODE_ENV !== 'production';
        const devTestCodes = ['123456', 'TEST123', '999999'];
        if (process.env.DEV_VERIFICATION_CODE) {
            devTestCodes.push(process.env.DEV_VERIFICATION_CODE.trim().toUpperCase());
        }
        if (isDev && devTestCodes.includes(cleanToken.toUpperCase())) {
            let user = null;
            if (email && email.trim()) {
                user = await this.prisma.user.findUnique({
                    where: { email: email.trim().toLowerCase() },
                });
            }
            else {
                user = await this.prisma.user.findFirst({
                    where: { status: 'pending_verification' },
                    orderBy: { createdAt: 'desc' },
                });
            }
            if (!user) {
                throw new common_1.BadRequestException(email
                    ? `Không tìm thấy tài khoản với email "${email}".`
                    : 'Không tìm thấy tài khoản nào đang chờ xác minh.');
            }
            await this.prisma.$transaction([
                this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        emailVerifiedAt: new Date(),
                        status: user.status === 'pending_verification' ? 'active' : user.status,
                    },
                }),
                this.prisma.emailVerificationToken.updateMany({
                    where: { userId: user.id, usedAt: null },
                    data: { usedAt: new Date() },
                }),
            ]);
            return {
                message: `Xác minh thành công cho tài khoản ${user.email} bằng mã test (${cleanToken})! Bây giờ bạn có thể đăng nhập.`,
                user: this.sanitizeUser(user),
            };
        }
        const tokenHash = this.sha256(cleanToken);
        const tokenRecord = await this.prisma.emailVerificationToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
        if (!tokenRecord) {
            throw new common_1.BadRequestException('Mã xác minh không hợp lệ hoặc đã hết hạn.');
        }
        await this.prisma.$transaction([
            this.prisma.emailVerificationToken.update({
                where: { id: tokenRecord.id },
                data: { usedAt: new Date() },
            }),
            this.prisma.user.update({
                where: { id: tokenRecord.userId },
                data: {
                    emailVerifiedAt: new Date(),
                    status: tokenRecord.user.status === 'pending_verification' ? 'active' : tokenRecord.user.status,
                },
            }),
        ]);
        return { message: 'Xác minh email thành công! Bây giờ bạn có thể đăng nhập.' };
    }
    async resendVerification(email) {
        const cleanEmail = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: cleanEmail },
        });
        if (user && !user.emailVerifiedAt && user.status !== 'suspended') {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = this.sha256(rawToken);
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await this.prisma.emailVerificationToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    expiresAt,
                },
            });
            await this.mailService.sendVerificationEmail(user.email, rawToken);
        }
        return {
            message: 'Nếu tài khoản tồn tại và chưa được xác minh, liên kết xác minh mới đã được gửi tới email của bạn.',
        };
    }
    async forgotPassword(email) {
        const cleanEmail = email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: cleanEmail },
        });
        if (user && user.status !== 'suspended') {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const tokenHash = this.sha256(rawToken);
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
            await this.prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    expiresAt,
                },
            });
            await this.mailService.sendPasswordResetEmail(user.email, rawToken);
        }
        return {
            message: 'Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến hộp thư của bạn.',
        };
    }
    async resetPassword(dto) {
        const tokenHash = this.sha256(dto.token);
        const resetRecord = await this.prisma.passwordResetToken.findFirst({
            where: {
                tokenHash,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (!resetRecord) {
            throw new common_1.BadRequestException('Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
        }
        const passwordHash = await argon2.hash(dto.password, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        });
        await this.prisma.$transaction([
            this.prisma.passwordResetToken.update({
                where: { id: resetRecord.id },
                data: { usedAt: new Date() },
            }),
            this.prisma.user.update({
                where: { id: resetRecord.userId },
                data: {
                    passwordHash,
                    failedLoginAttempts: 0,
                    lockedUntil: null,
                    status: 'active',
                },
            }),
            this.prisma.authSession.updateMany({
                where: { userId: resetRecord.userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
        return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' };
    }
    async changePassword(userId, dto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.BadRequestException('Tài khoản chưa có mật khẩu. Vui lòng sử dụng chức năng quên mật khẩu.');
        }
        const isMatch = await argon2.verify(user.passwordHash, dto.oldPassword);
        if (!isMatch) {
            throw new common_1.BadRequestException('Mật khẩu hiện tại không chính xác.');
        }
        const newPasswordHash = await argon2.hash(dto.newPassword, {
            type: argon2.argon2id,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4,
        });
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: userId },
                data: { passwordHash: newPasswordHash },
            }),
            this.prisma.authSession.updateMany({
                where: { userId, revokedAt: null },
                data: { revokedAt: new Date() },
            }),
        ]);
        return { message: 'Đổi mật khẩu thành công. Tất cả các phiên đăng nhập khác đã được thu hồi.' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
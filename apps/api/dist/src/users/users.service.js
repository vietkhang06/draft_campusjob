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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../prisma/prisma.service");
const files_service_1 = require("../files/files.service");
const mail_service_1 = require("../mail/mail.service");
const audit_service_1 = require("../audit/audit.service");
let UsersService = class UsersService {
    prisma;
    filesService;
    mailService;
    auditService;
    constructor(prisma, filesService, mailService, auditService) {
        this.prisma = prisma;
        this.filesService = filesService;
        this.mailService = mailService;
        this.auditService = auditService;
    }
    sha256(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng.');
        }
        const { passwordHash, ...rest } = user;
        return rest;
    }
    async updateProfile(userId, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('Không tìm thấy người dùng.');
        }
        const currentProfile = user.profile || {};
        if (data.avatar) {
            await this.filesService.checkOwnership(data.avatar, userId, 'avatar');
        }
        const newProfile = {
            ...currentProfile,
            studentCode: typeof data.studentCode === 'string' ? data.studentCode.trim().slice(0, 50) : currentProfile.studentCode,
            school: typeof data.school === 'string' ? data.school.trim().slice(0, 200) : currentProfile.school,
            major: typeof data.major === 'string' ? data.major.trim().slice(0, 200) : currentProfile.major,
            graduation: data.graduation ? Number(data.graduation) : currentProfile.graduation,
            availability: ['looking', 'not_looking', 'employed'].includes(data.availability)
                ? data.availability
                : currentProfile.availability || 'looking',
            phone: typeof data.phone === 'string' ? data.phone.trim().slice(0, 30) : currentProfile.phone,
            about: typeof data.about === 'string' ? data.about.trim().slice(0, 2000) : currentProfile.about,
            avatar: data.avatar || currentProfile.avatar,
            emailPreferences: data.emailPreferences || currentProfile.emailPreferences || {},
        };
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                name: data.name ? data.name.trim().slice(0, 120) : user.name,
                profile: newProfile,
            },
        });
        await this.auditService.log('user', userId, 'update_profile', {}, userId);
        const { passwordHash, ...rest } = updatedUser;
        return rest;
    }
    async getSchoolVerification(userId) {
        const verification = await this.prisma.schoolVerification.findUnique({
            where: { userId },
        });
        return {
            verification: verification
                ? {
                    email: verification.email,
                    verified: verification.verifiedAt,
                    expires: verification.expiresAt,
                    attempts: verification.attempts,
                }
                : null,
            available: true,
        };
    }
    async sendSchoolVerificationOtp(userId, emailInput) {
        if (!emailInput || typeof emailInput !== 'string') {
            throw new common_1.BadRequestException('Vui lòng cung cấp email trường.');
        }
        const email = emailInput.trim().toLowerCase();
        if (!/^[^\s@]+@(?:[a-z0-9-]+\.)*edu\.vn$/.test(email)) {
            throw new common_1.BadRequestException('Hãy nhập email thuộc tên miền .edu.vn.');
        }
        const old = await this.prisma.schoolVerification.findUnique({
            where: { userId },
        });
        if (old && Date.now() - old.createdAt.getTime() < 60000) {
            throw new common_1.HttpException('Vui lòng đợi một phút trước khi yêu cầu mã mới.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const tokenHash = this.sha256(`${userId}:${email}:${code}`);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        const sent = await this.mailService.sendSchoolVerificationOtp(email, code);
        if (!sent) {
            throw new common_1.HttpException('Dịch vụ email chưa gửi được mã. Vui lòng thử lại sau.', common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
        await this.prisma.schoolVerification.upsert({
            where: { userId },
            create: {
                userId,
                email,
                hash: tokenHash,
                expiresAt,
                attempts: 0,
                verifiedAt: null,
            },
            update: {
                email,
                hash: tokenHash,
                expiresAt,
                attempts: 0,
                verifiedAt: null,
                createdAt: new Date(),
            },
        });
        return { ok: true, message: 'Đã gửi mã xác thực tới email trường.' };
    }
    async confirmSchoolVerificationOtp(userId, codeInput) {
        if (!codeInput || typeof codeInput !== 'string') {
            throw new common_1.BadRequestException('Vui lòng cung cấp mã xác thực.');
        }
        const code = codeInput.trim();
        const v = await this.prisma.schoolVerification.findUnique({
            where: { userId },
        });
        if (!v || v.expiresAt <= new Date() || v.attempts >= 5 || v.verifiedAt) {
            throw new common_1.HttpException('Mã hết hạn, đã sử dụng hoặc vượt quá 5 lần thử. Hãy yêu cầu mã mới.', common_1.HttpStatus.CONFLICT);
        }
        const h = this.sha256(`${userId}:${v.email}:${code}`);
        if (h !== v.hash) {
            await this.prisma.schoolVerification.update({
                where: { userId },
                data: { attempts: v.attempts + 1 },
            });
            throw new common_1.BadRequestException('Mã xác thực không chính xác.');
        }
        await this.prisma.schoolVerification.update({
            where: { userId },
            data: {
                verifiedAt: new Date(),
                attempts: v.attempts + 1,
            },
        });
        await this.auditService.log('user', userId, 'school_email_verified', { email: v.email }, userId);
        return { ok: true, message: 'Email trường đã được xác thực thành công.' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        files_service_1.FilesService,
        mail_service_1.MailService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map
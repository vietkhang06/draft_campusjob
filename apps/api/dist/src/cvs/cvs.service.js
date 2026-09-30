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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CvsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CvsService = class CvsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyCvs(studentId) {
        const cvs = await this.prisma.cV.findMany({
            where: { studentId },
            orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
        });
        return {
            cvs: cvs.map((c) => ({
                id: c.id,
                name: c.name,
                data: c.data,
                is_default: c.isDefault ? 1 : 0,
                created: c.createdAt.toISOString(),
                updated: c.updatedAt.toISOString(),
            })),
        };
    }
    async getCvById(studentId, cvId) {
        const cv = await this.prisma.cV.findFirst({
            where: { id: cvId, studentId },
        });
        if (!cv) {
            throw new common_1.NotFoundException('Không tìm thấy CV.');
        }
        return {
            id: cv.id,
            name: cv.name,
            data: cv.data,
            is_default: cv.isDefault ? 1 : 0,
            created: cv.createdAt.toISOString(),
            updated: cv.updatedAt.toISOString(),
        };
    }
    async saveCv(studentId, cvId, body) {
        const name = String(body.name || '').trim().slice(0, 150);
        if (!name) {
            throw new common_1.BadRequestException('Vui lòng nhập tên CV.');
        }
        const summary = String(body.summary || '').trim().slice(0, 3000);
        const education = String(body.education || '').trim().slice(0, 5000);
        const skills = String(body.skills || '').trim().slice(0, 2000);
        if (!summary || !education || !skills) {
            throw new common_1.BadRequestException('Vui lòng nhập đầy đủ mục tiêu, học vấn và kỹ năng.');
        }
        const portfolio = body.portfolio ? String(body.portfolio).trim().slice(0, 2000) : null;
        if (portfolio && !/^https?:\/\//i.test(portfolio)) {
            throw new common_1.BadRequestException('Liên kết portfolio phải bắt đầu bằng http:// hoặc https://.');
        }
        const cvData = {
            summary,
            skills,
            education,
            experience: typeof body.experience === 'string' ? body.experience.trim().slice(0, 10000) : '',
            projects: typeof body.projects === 'string' ? body.projects.trim().slice(0, 10000) : '',
            certificates: typeof body.certificates === 'string' ? body.certificates.trim().slice(0, 5000) : '',
            phone: typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : '',
            portfolio,
        };
        const isDefault = Boolean(body.is_default);
        if (cvId) {
            const existing = await this.prisma.cV.findFirst({
                where: { id: cvId, studentId },
            });
            if (!existing) {
                throw new common_1.ForbiddenException('CV không thuộc tài khoản của bạn.');
            }
            await this.prisma.$transaction(async (tx) => {
                if (isDefault) {
                    await tx.cV.updateMany({
                        where: { studentId },
                        data: { isDefault: false },
                    });
                }
                await tx.cV.update({
                    where: { id: cvId },
                    data: {
                        name,
                        data: cvData,
                        isDefault,
                    },
                });
            });
            return { id: cvId };
        }
        else {
            let createdId = '';
            await this.prisma.$transaction(async (tx) => {
                if (isDefault) {
                    await tx.cV.updateMany({
                        where: { studentId },
                        data: { isDefault: false },
                    });
                }
                const created = await tx.cV.create({
                    data: {
                        studentId,
                        name,
                        data: cvData,
                        isDefault,
                    },
                });
                createdId = created.id;
            });
            return { id: createdId };
        }
    }
    async deleteCv(studentId, cvId) {
        const cv = await this.prisma.cV.findFirst({
            where: { id: cvId, studentId },
        });
        if (!cv) {
            throw new common_1.NotFoundException('CV không tồn tại.');
        }
        const applicationCount = await this.prisma.application.count({
            where: { cvId },
        });
        if (applicationCount > 0) {
            throw new common_1.ConflictException('CV đã dùng ứng tuyển. Bạn có thể chỉnh sửa; bản đã nộp được giữ nguyên.');
        }
        await this.prisma.cV.delete({
            where: { id: cvId },
        });
        return { ok: true };
    }
};
exports.CvsService = CvsService;
exports.CvsService = CvsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CvsService);
//# sourceMappingURL=cvs.service.js.map
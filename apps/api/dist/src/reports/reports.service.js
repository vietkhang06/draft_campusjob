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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const files_service_1 = require("../files/files.service");
const notifications_service_1 = require("../notifications/notifications.service");
let ReportsService = class ReportsService {
    prisma;
    filesService;
    notificationsService;
    constructor(prisma, filesService, notificationsService) {
        this.prisma = prisma;
        this.filesService = filesService;
        this.notificationsService = notificationsService;
    }
    async getMyReports(userId) {
        const reports = await this.prisma.report.findMany({
            where: { reporterId: userId },
            orderBy: { createdAt: 'desc' },
        });
        const companies = await this.prisma.company.findMany({
            where: { id: { in: reports.map((r) => r.targetId) } },
            select: { id: true, name: true },
        });
        const users = await this.prisma.user.findMany({
            where: { id: { in: reports.map((r) => r.targetId) } },
            select: { id: true, name: true },
        });
        return {
            reports: reports.map((r) => ({
                id: r.id,
                target: r.targetId,
                target_type: r.targetType,
                application: r.applicationId,
                kind: r.kind,
                description: r.description,
                evidence: r.evidence,
                status: r.status,
                recommendation: r.recommendation,
                decision: r.decision,
                resolved_by: r.resolvedBy,
                created: r.createdAt.toISOString(),
            })),
            companies,
            users,
        };
    }
    async createReport(user, body) {
        if (!['student', 'employer'].includes(user.role)) {
            throw new common_1.ForbiddenException('Không có quyền gửi báo cáo.');
        }
        const evidence = body.evidence ? String(body.evidence).trim() : null;
        if (evidence) {
            await this.filesService.checkOwnership(evidence, user.id, 'evidence');
        }
        let targetId = '';
        let targetType = '';
        let applicationId = null;
        let kind = '';
        let occurred = new Date();
        if (user.role === 'employer') {
            const company = await this.prisma.company.findUnique({
                where: { ownerId: user.id },
            });
            if (!company || company.status !== 'active') {
                throw new common_1.ForbiddenException('Doanh nghiệp phải đang hoạt động.');
            }
            const app = await this.prisma.application.findUnique({
                where: { id: body.application },
                include: {
                    job: true,
                    interview: true,
                },
            });
            if (!app || app.job.companyId !== company.id) {
                throw new common_1.ForbiddenException('Không được báo cáo ứng viên ngoài quy trình của bạn.');
            }
            kind = body.kind;
            if (kind === 'no_show') {
                if (!app.interview ||
                    app.interview.response !== 'confirmed' ||
                    app.interview.time > new Date() ||
                    app.status === 'hired') {
                    throw new common_1.BadRequestException('Chỉ báo vắng sau lịch phỏng vấn đã được xác nhận.');
                }
                occurred = app.interview.time;
            }
            else if (kind === 'left_early') {
                if (app.status !== 'hired') {
                    throw new common_1.BadRequestException('Ứng viên chưa trúng tuyển.');
                }
                const startDate = new Date(body.start_date);
                const leftDate = new Date(body.left_date);
                if (isNaN(startDate.getTime()) ||
                    isNaN(leftDate.getTime()) ||
                    startDate < app.updatedAt ||
                    leftDate < startDate ||
                    leftDate.getTime() - startDate.getTime() > 7 * 86400000 ||
                    leftDate > new Date()) {
                    throw new common_1.BadRequestException('Ngày bỏ việc phải trong tuần đầu, sau ngày bắt đầu làm và không ở tương lai.');
                }
                occurred = leftDate;
            }
            else {
                throw new common_1.BadRequestException('Loại vi phạm không hợp lệ.');
            }
            if (!evidence) {
                throw new common_1.BadRequestException('Báo cáo sinh viên phải có minh chứng đính kèm.');
            }
            targetId = app.studentId;
            targetType = 'student';
            applicationId = app.id;
        }
        else {
            targetId = String(body.company || '').trim();
            const targetCompany = await this.prisma.company.findUnique({
                where: { id: targetId },
            });
            if (!targetCompany) {
                throw new common_1.NotFoundException('Doanh nghiệp không tồn tại.');
            }
            kind = 'fraud';
            targetType = 'company';
            occurred = new Date();
        }
        const existing = await this.prisma.report.findFirst({
            where: {
                reporterId: user.id,
                targetId,
                kind,
                status: { in: ['pending', 'reviewed'] },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Bạn đã có báo cáo cùng loại đang được xử lý.');
        }
        const description = String(body.description || '').trim().slice(0, 10000);
        if (!description) {
            throw new common_1.BadRequestException('Vui lòng nhập nội dung báo cáo.');
        }
        const report = await this.prisma.report.create({
            data: {
                reporterId: user.id,
                targetId,
                targetType,
                applicationId,
                kind,
                description,
                evidence,
                occurred,
                status: 'pending',
            },
        });
        if (kind === 'fraud') {
            await this.prisma.company.update({
                where: { id: targetId },
                data: { flag: 1 },
            });
        }
        await this.notificationsService.notifyStaff('report', 'Có báo cáo cần xem xét', description.slice(0, 150));
        return { id: report.id };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        files_service_1.FilesService,
        notifications_service_1.NotificationsService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map
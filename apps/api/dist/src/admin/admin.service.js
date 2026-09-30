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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
let AdminService = class AdminService {
    prisma;
    notificationsService;
    auditService;
    constructor(prisma, notificationsService, auditService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
    }
    async getOverview() {
        const companies = await this.prisma.company.findMany({
            orderBy: { updatedAt: 'desc' },
        });
        const users = await this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const reports = await this.prisma.report.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const sanctions = await this.prisma.sanction.findMany({
            orderBy: { createdAt: 'desc' },
        });
        const audit = await this.prisma.history.findMany({
            orderBy: { createdAt: 'desc' },
            take: 300,
        });
        const actorIds = [...new Set(audit.map((a) => a.actor))];
        const actorUsers = await this.prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, name: true },
        });
        const actorMap = new Map(actorUsers.map((u) => [u.id, u.name]));
        const mailGroups = await this.prisma.emailQueue.groupBy({
            by: ['status'],
            _count: { id: true },
        });
        return {
            companies,
            users: users.map((u) => {
                const { passwordHash, ...rest } = u;
                return rest;
            }),
            reports,
            sanctions,
            audit: audit.map((a) => ({
                ...a,
                actor_name: actorMap.get(a.actor) || (a.actor === 'system' ? 'Hệ thống' : a.actor),
            })),
            mail: mailGroups.map((g) => ({
                status: g.status,
                total: g._count.id,
            })),
            emailConfigured: true,
        };
    }
    async getAnalytics(q = {}) {
        const fromDate = q.from ? new Date(q.from) : new Date(0);
        const toDate = q.to ? new Date(q.to) : new Date();
        if (fromDate > toDate) {
            throw new common_1.BadRequestException('Ngày bắt đầu phải trước ngày kết thúc.');
        }
        const jobs = await this.prisma.job.findMany({
            where: { createdAt: { gte: fromDate, lte: toDate } },
            select: { createdAt: true, industry: true, type: true },
        });
        const monthlyMap = new Map();
        for (const j of jobs) {
            const month = j.createdAt.toISOString().slice(0, 7);
            const key = `${month}|${j.industry}|${j.type}`;
            monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
        }
        const monthly = Array.from(monthlyMap.entries()).map(([key, total]) => {
            const [month, industry, type] = key.split('|');
            return { month, industry, type, total };
        }).sort((a, b) => a.month.localeCompare(b.month));
        const pendingCompanies = await this.prisma.company.findMany({
            where: { status: 'pending' },
            select: { name: true, createdAt: true },
        });
        const pendingJobs = await this.prisma.job.findMany({
            where: { status: 'pending' },
            select: { title: true, createdAt: true },
        });
        const pending = [
            ...pendingCompanies.map((c) => ({
                kind: 'Doanh nghiệp',
                title: c.name,
                created: c.createdAt.toISOString(),
            })),
            ...pendingJobs.map((j) => ({
                kind: 'Tin tuyển dụng',
                title: j.title,
                created: j.createdAt.toISOString(),
            })),
        ].sort((a, b) => a.created.localeCompare(b.created));
        const sanctionsList = await this.prisma.sanction.findMany({
            where: { createdAt: { gte: fromDate, lte: toDate } },
            include: {
                target: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const sanctions = sanctionsList.map((s) => ({
            id: s.id,
            name: s.target.name,
            kind: s.kind,
            reason: s.reason,
            created: s.createdAt.toISOString(),
            until: s.until?.toISOString() || null,
        }));
        const activeCompanies = await this.prisma.company.findMany({
            select: {
                id: true,
                name: true,
                jobs: {
                    select: {
                        views: {
                            where: { createdAt: { gte: fromDate, lte: toDate } },
                            select: { id: true },
                        },
                        applications: {
                            where: { createdAt: { gte: fromDate, lte: toDate } },
                            select: { id: true },
                        },
                    },
                },
            },
        });
        const top = activeCompanies
            .map((c) => {
            let views = 0;
            let applications = 0;
            for (const j of c.jobs) {
                views += j.views.length;
                applications += j.applications.length;
            }
            return { name: c.name, views, applications };
        })
            .sort((a, b) => b.views - a.views || b.applications - a.applications)
            .slice(0, 10);
        const hiredApps = await this.prisma.application.findMany({
            where: {
                status: 'hired',
                updatedAt: { gte: fromDate, lte: toDate },
            },
            include: { job: { select: { industry: true } } },
        });
        const hiresMap = new Map();
        for (const a of hiredApps) {
            const ind = a.job.industry;
            hiresMap.set(ind, (hiresMap.get(ind) || 0) + 1);
        }
        const hires = Array.from(hiresMap.entries()).map(([industry, total]) => ({
            industry,
            total,
        }));
        const funnelJobs = await this.prisma.job.findMany({
            select: {
                id: true,
                title: true,
                views: {
                    where: { createdAt: { gte: fromDate, lte: toDate } },
                    select: { id: true },
                },
                applications: {
                    select: {
                        id: true,
                        status: true,
                        createdAt: true,
                        updatedAt: true,
                        interview: { select: { id: true, createdAt: true } },
                    },
                },
            },
        });
        const funnel = funnelJobs.map((j) => {
            const apps = j.applications.filter((a) => a.createdAt >= fromDate && a.createdAt <= toDate);
            const interviews = j.applications.filter((a) => a.interview && a.interview.createdAt >= fromDate && a.interview.createdAt <= toDate);
            const hired = j.applications.filter((a) => a.status === 'hired' && a.updatedAt >= fromDate && a.updatedAt <= toDate);
            return {
                title: j.title,
                views: j.views.length,
                applications: apps.length,
                interviews: interviews.length,
                hired: hired.length,
            };
        });
        const reviewList = await this.prisma.review.findMany({
            where: {
                hidden: false,
                createdAt: { gte: fromDate, lte: toDate },
            },
            include: { company: { select: { id: true, name: true } } },
        });
        const ratingMap = new Map();
        for (const r of reviewList) {
            const month = r.createdAt.toISOString().slice(0, 7);
            const key = `${r.company.id}|${month}`;
            const entry = ratingMap.get(key) || { total: 0, sum: 0, name: r.company.name };
            entry.total++;
            entry.sum += r.rating;
            entry.name = r.company.name;
            ratingMap.set(key, entry);
        }
        const ratings = Array.from(ratingMap.entries()).map(([key, data]) => {
            const [, month] = key.split('|');
            return {
                name: data.name,
                month,
                average: Math.round((data.sum / data.total) * 100) / 100,
                total: data.total,
            };
        }).sort((a, b) => a.month.localeCompare(b.month));
        const studentUsers = await this.prisma.user.findMany({
            where: {
                role: 'student',
                applications: {
                    some: { createdAt: { gte: fromDate, lte: toDate } },
                },
            },
            include: {
                applications: {
                    where: { createdAt: { gte: fromDate, lte: toDate } },
                    include: { interview: { select: { id: true } } },
                },
            },
        });
        const students = studentUsers.map((u) => {
            const apps = u.applications;
            const count = apps.length;
            const totalScore = apps.reduce((acc, a) => acc + a.score, 0);
            const interviewCount = apps.filter((a) => a.interview !== null).length;
            const interviewRate = count > 0 ? Math.round((1000.0 * interviewCount) / count) / 10 : 0;
            return {
                name: u.name,
                applications: count,
                skill_match: count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0,
                interviews: interviewCount,
                interview_rate: interviewRate,
            };
        }).sort((a, b) => b.interview_rate - a.interview_rate || b.applications - a.applications).slice(0, 50);
        return {
            monthly,
            pending,
            sanctions,
            top,
            hires,
            funnel,
            ratings,
            students,
        };
    }
    async decideCompany(companyId, adminId, body) {
        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Không tìm thấy doanh nghiệp.');
        }
        if (company.ownerId === adminId) {
            throw new common_1.ForbiddenException('Không được tự xét duyệt doanh nghiệp của mình.');
        }
        const reason = String(body.reason || '').trim().slice(0, 3000);
        if (!reason) {
            throw new common_1.BadRequestException('Vui lòng nhập lý do quyết định.');
        }
        const decision = body.decision;
        if (!['approve', 'reject', 'suspend'].includes(decision)) {
            throw new common_1.BadRequestException('Quyết định không hợp lệ.');
        }
        if (decision === 'suspend') {
            const confirmedReport = await this.prisma.report.findFirst({
                where: { targetId: companyId, targetType: 'company', status: 'confirmed' },
            });
            if (!confirmedReport) {
                throw new common_1.ConflictException('Cần xác nhận báo cáo vi phạm trước khi đình chỉ.');
            }
            await this.prisma.$transaction([
                this.prisma.company.update({
                    where: { id: companyId },
                    data: { status: 'suspended', reason },
                }),
                this.prisma.job.updateMany({
                    where: { companyId, status: { in: ['open', 'paused', 'pending'] } },
                    data: { status: 'closed' },
                }),
                this.prisma.sanction.create({
                    data: {
                        targetId: companyId,
                        kind: 'company_suspension',
                        reason,
                        actorId: adminId,
                    },
                }),
            ]);
        }
        else {
            if (company.status !== 'pending') {
                throw new common_1.ConflictException('Chỉ xử lý hồ sơ doanh nghiệp đang chờ xác thực.');
            }
            const newStatus = decision === 'approve' ? 'active' : 'rejected';
            await this.prisma.company.update({
                where: { id: companyId },
                data: { status: newStatus, reason },
            });
        }
        await this.auditService.log('company', companyId, decision, { reason }, adminId);
        await this.notificationsService.notify(company.ownerId, 'moderation', 'Kết quả hồ sơ doanh nghiệp', reason, '/workspace/company');
        return { ok: true };
    }
    async clearFlag(companyId, adminId, body) {
        const reason = String(body.reason || '').trim().slice(0, 2000);
        if (!reason) {
            throw new common_1.BadRequestException('Vui lòng nhập lý do gỡ cờ.');
        }
        const pendingReport = await this.prisma.report.findFirst({
            where: { targetId: companyId, targetType: 'company', status: { in: ['pending', 'reviewed'] } },
        });
        if (pendingReport) {
            throw new common_1.ConflictException('Vẫn còn báo cáo vi phạm chưa có kết luận xử lý.');
        }
        const reviews = await this.prisma.review.findMany({
            where: { companyId, hidden: false },
            select: { rating: true },
        });
        if (reviews.length >= 10) {
            const oneStarCount = reviews.filter((r) => r.rating === 1).length;
            if (oneStarCount / reviews.length > 0.3) {
                throw new common_1.ConflictException('Tỷ lệ đánh giá một sao vẫn vượt ngưỡng cảnh báo 30%.');
            }
        }
        await this.prisma.company.update({
            where: { id: companyId },
            data: { flag: 0 },
        });
        await this.auditService.log('company', companyId, 'clear_flag', { reason }, adminId);
        return { ok: true };
    }
    async changeUserRole(targetUserId, adminId, newRole) {
        if (targetUserId === adminId) {
            throw new common_1.BadRequestException('Không tự thay đổi quyền của chính mình.');
        }
        if (!['moderator', 'student'].includes(newRole)) {
            throw new common_1.BadRequestException('Chỉ cấp hoặc thu hồi quyền kiểm duyệt viên.');
        }
        const target = await this.prisma.user.findUnique({
            where: { id: targetUserId },
        });
        if (!target || !['student', 'moderator'].includes(target.role)) {
            throw new common_1.ConflictException('Chỉ cấp quyền cho tài khoản sinh viên hoặc kiểm duyệt viên.');
        }
        await this.prisma.user.update({
            where: { id: targetUserId },
            data: { role: newRole },
        });
        await this.auditService.log('user', targetUserId, 'role', { role: newRole }, adminId);
        return { ok: true };
    }
    async decideReport(reportId, adminId, body) {
        const report = await this.prisma.report.findUnique({
            where: { id: reportId },
        });
        if (!report || !['pending', 'reviewed'].includes(report.status)) {
            throw new common_1.ConflictException('Báo cáo đã có kết luận hoặc không tồn tại.');
        }
        const decision = String(body.decision || '').trim().slice(0, 4000);
        if (!decision) {
            throw new common_1.BadRequestException('Vui lòng nhập kết luận và căn cứ xử lý.');
        }
        const confirm = Boolean(body.confirm);
        const newStatus = confirm ? 'confirmed' : 'dismissed';
        await this.prisma.report.update({
            where: { id: reportId },
            data: {
                status: newStatus,
                decision,
                resolvedBy: adminId,
            },
        });
        if (confirm && report.targetType === 'student') {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            const confirmedViolationsCount = await this.prisma.report.count({
                where: {
                    targetId: report.targetId,
                    targetType: 'student',
                    status: 'confirmed',
                    createdAt: { gte: sixMonthsAgo },
                },
            });
            if (confirmedViolationsCount >= 2) {
                await this.prisma.sanction.create({
                    data: {
                        targetId: report.targetId,
                        kind: 'warning',
                        reason: decision,
                        reportId: report.id,
                        actorId: adminId,
                    },
                });
                await this.notificationsService.notify(report.targetId, 'sanction', 'Cảnh cáo vi phạm', `Bạn có ${confirmedViolationsCount} vi phạm đã xác nhận trong 6 tháng. Từ lần thứ ba, quản trị viên có thể khóa quyền ứng tuyển 30–90 ngày.`);
            }
        }
        await this.auditService.log('report', reportId, newStatus, { decision }, adminId);
        await this.notificationsService.notify(report.reporterId, 'report', 'Báo cáo đã được xử lý', decision, '/workspace/reports');
        return { ok: true };
    }
    async lockStudent(targetUserId, adminId, body) {
        const days = Math.trunc(Number(body.days));
        if (isNaN(days) || days < 30 || days > 90) {
            throw new common_1.BadRequestException('Số ngày khóa phải từ 30 đến 90 ngày.');
        }
        const reason = String(body.reason || '').trim().slice(0, 3000);
        if (!reason) {
            throw new common_1.BadRequestException('Vui lòng nhập lý do và căn cứ khóa ứng tuyển.');
        }
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const violationsCount = await this.prisma.report.count({
            where: {
                targetId: targetUserId,
                targetType: 'student',
                status: 'confirmed',
                createdAt: { gte: sixMonthsAgo },
            },
        });
        if (violationsCount < 3) {
            throw new common_1.ConflictException('Chưa đủ 3 vi phạm được xác nhận trong 6 tháng.');
        }
        const until = new Date(Date.now() + days * 86400000);
        await this.prisma.sanction.create({
            data: {
                targetId: targetUserId,
                kind: 'application_lock',
                reason,
                until,
                actorId: adminId,
            },
        });
        await this.auditService.log('user', targetUserId, 'application_lock', { days, reason }, adminId);
        await this.notificationsService.notify(targetUserId, 'sanction', 'Quyền ứng tuyển bị tạm khóa', `Tài khoản bị khóa ứng tuyển ${days} ngày. Căn cứ: ${reason}`);
        return { ok: true };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], AdminService);
//# sourceMappingURL=admin.service.js.map
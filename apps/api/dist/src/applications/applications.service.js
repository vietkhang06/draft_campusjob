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
exports.ApplicationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
function words(v) {
    return (v || '')
        .split(/[,;\n]/)
        .map((s) => s.trim().toLocaleLowerCase('vi'))
        .filter(Boolean);
}
function matchSkills(cvSkills, requiredSkills) {
    if (!requiredSkills.length)
        return 0;
    const matches = requiredSkills.filter((req) => cvSkills.includes(req));
    return Math.round((100 * matches.length) / requiredSkills.length);
}
let ApplicationsService = class ApplicationsService {
    prisma;
    notificationsService;
    auditService;
    constructor(prisma, notificationsService, auditService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
    }
    async getApplications(user, sort) {
        if (user.role === 'student') {
            const apps = await this.prisma.application.findMany({
                where: { studentId: user.id },
                include: {
                    job: {
                        include: {
                            company: { select: { name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            return {
                applications: apps.map((a) => ({
                    id: a.id,
                    job: a.jobId,
                    title: a.job.title,
                    company_name: a.job.company.name,
                    score: a.score,
                    status: a.status,
                    created: a.createdAt.toISOString(),
                })),
            };
        }
        if (user.role === 'employer') {
            const company = await this.prisma.company.findUnique({
                where: { ownerId: user.id },
            });
            if (!company) {
                throw new common_1.NotFoundException('Chưa có hồ sơ doanh nghiệp.');
            }
            const apps = await this.prisma.application.findMany({
                where: {
                    job: { companyId: company.id },
                },
                include: {
                    job: { select: { title: true } },
                    student: { select: { name: true } },
                },
                orderBy: sort === 'match'
                    ? [{ score: 'desc' }, { createdAt: 'asc' }]
                    : [{ createdAt: 'asc' }],
            });
            return {
                applications: apps.map((a) => ({
                    id: a.id,
                    job: a.jobId,
                    title: a.job.title,
                    student_name: a.student.name,
                    score: a.score,
                    status: a.status,
                    created: a.createdAt.toISOString(),
                })),
            };
        }
        throw new common_1.ForbiddenException('Bạn không có quyền xem danh sách ứng tuyển.');
    }
    async getApplicationDetail(applicationId, user) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: {
                    include: {
                        company: true,
                    },
                },
                student: { select: { id: true, name: true, email: true } },
                cv: true,
                interview: true,
                review: true,
            },
        });
        if (!app) {
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ ứng tuyển.');
        }
        const isStudent = app.studentId === user.id;
        const isEmployer = app.job.company.ownerId === user.id;
        const isStaff = ['admin', 'moderator'].includes(user.role);
        if (!isStudent && !isEmployer && !isStaff) {
            throw new common_1.ForbiddenException('Không được truy cập hồ sơ ứng tuyển này.');
        }
        if (isEmployer && app.job.company.status === 'suspended') {
            throw new common_1.ForbiddenException('Doanh nghiệp đã bị đình chỉ.');
        }
        const history = await this.prisma.history.findMany({
            where: {
                entity: 'application',
                entityId: applicationId,
            },
            orderBy: { createdAt: 'asc' },
        });
        return {
            application: {
                id: app.id,
                student: app.studentId,
                student_name: app.student.name,
                student_email: app.student.email,
                job: app.jobId,
                title: app.job.title,
                company: app.job.companyId,
                company_name: app.job.company.name,
                company_status: app.job.company.status,
                owner: app.job.company.ownerId,
                snapshot: app.snapshot,
                letter: app.letter,
                score: app.score,
                status: app.status,
                reason: app.reason,
                created: app.createdAt.toISOString(),
                updated: app.updatedAt.toISOString(),
            },
            interview: app.interview
                ? {
                    id: app.interview.id,
                    time: app.interview.time.toISOString(),
                    mode: app.interview.mode,
                    location: app.interview.location,
                    message: app.interview.message,
                    response: app.interview.response,
                    reschedule_used: app.interview.rescheduleUsed ? 1 : 0,
                    proposed: app.interview.proposed?.toISOString() || null,
                    request_reason: app.interview.requestReason,
                    decision: app.interview.decision,
                    created: app.interview.createdAt.toISOString(),
                }
                : null,
            review: app.review
                ? {
                    id: app.review.id,
                    rating: app.review.rating,
                    comment: app.review.comment,
                    reply: app.review.reply,
                    created: app.review.createdAt.toISOString(),
                }
                : null,
            history: history.map((h) => ({
                id: h.id,
                action: h.action,
                created: h.createdAt.toISOString(),
                detail: h.detail,
            })),
        };
    }
    async apply(studentId, user, body) {
        const profile = user.profile || {};
        if (!profile.school || !profile.major) {
            throw new common_1.BadRequestException('Vui lòng hoàn tất trường và chuyên ngành trong hồ sơ.');
        }
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
        });
        if (student?.status === 'locked' || (student?.lockedUntil && student.lockedUntil > new Date())) {
            throw new common_1.ForbiddenException('Tài khoản của bạn đang bị tạm khóa.');
        }
        const cv = await this.prisma.cV.findFirst({
            where: { id: body.cv, studentId },
        });
        if (!cv) {
            throw new common_1.BadRequestException('Hãy chọn CV của bạn.');
        }
        const job = await this.prisma.job.findUnique({
            where: { id: body.job },
            include: { company: true },
        });
        if (!job) {
            throw new common_1.NotFoundException('Tin tuyển dụng không tồn tại.');
        }
        const now = new Date();
        if (job.status !== 'open' || job.deadline <= now || job.company.status !== 'active') {
            throw new common_1.ConflictException('Tin tuyển dụng không còn mở nhận hồ sơ.');
        }
        const existing = await this.prisma.application.findUnique({
            where: {
                studentId_jobId: {
                    studentId,
                    jobId: body.job,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Bạn đã nộp hồ sơ ứng tuyển vào công việc này rồi.');
        }
        const activeCount = await this.prisma.application.count({
            where: {
                studentId,
                status: { in: ['pending', 'viewed', 'interview'] },
            },
        });
        if (activeCount >= 5) {
            throw new common_1.ConflictException('Bạn đã đạt tối đa 5 hồ sơ đang trong quá trình xử lý.');
        }
        const activeSanction = await this.prisma.sanction.findFirst({
            where: {
                targetId: studentId,
                kind: 'application_lock',
                until: { gt: now },
            },
        });
        if (activeSanction) {
            throw new common_1.ConflictException('Tài khoản của bạn đang bị khóa quyền ứng tuyển.');
        }
        const cvData = cv.data || {};
        const snapshot = {
            name: user.name,
            email: user.email,
            school: profile.school,
            major: profile.major,
            cvName: cv.name,
            ...cvData,
        };
        const score = matchSkills(words(cvData.skills || ''), words(job.skills));
        const application = await this.prisma.application.create({
            data: {
                studentId,
                jobId: job.id,
                cvId: cv.id,
                snapshot,
                letter: typeof body.letter === 'string' ? body.letter.trim().slice(0, 5000) : '',
                score,
                status: 'pending',
            },
        });
        await this.auditService.log('application', application.id, 'pending', {}, studentId);
        await this.notificationsService.notify(job.company.ownerId, 'application', 'Có ứng viên mới', `${user.name} ứng tuyển ${job.title}.`, `/workspace/applications/${application.id}`);
        return { id: application.id };
    }
    async updateStatus(applicationId, user, body) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: { include: { company: true } },
                interview: true,
            },
        });
        if (!app) {
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ ứng tuyển.');
        }
        const isStudent = app.studentId === user.id;
        const isEmployer = app.job.company.ownerId === user.id;
        const newStatus = body.status;
        const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 2000) : '';
        if (newStatus === 'withdrawn') {
            if (!isStudent) {
                throw new common_1.ForbiddenException('Chỉ sinh viên được rút hồ sơ của mình.');
            }
            if (!['pending', 'viewed'].includes(app.status)) {
                throw new common_1.ConflictException('Chỉ có thể rút hồ sơ đang ở trạng thái chờ xử lý hoặc đã xem.');
            }
        }
        else {
            if (!isEmployer) {
                throw new common_1.ForbiddenException('Chỉ nhà tuyển dụng phụ trách được cập nhật hồ sơ.');
            }
            if (app.job.company.status !== 'active') {
                throw new common_1.ForbiddenException('Doanh nghiệp phải đang hoạt động.');
            }
            if (['hired', 'not_hired'].includes(newStatus)) {
                if (app.status !== 'interview' || !app.interview || app.interview.time > new Date()) {
                    throw new common_1.ConflictException('Chỉ ghi nhận kết quả sau thời gian phỏng vấn.');
                }
            }
            else {
                const allowedTransitions = {
                    pending: ['viewed'],
                    viewed: ['rejected'],
                };
                if (!allowedTransitions[app.status]?.includes(newStatus)) {
                    throw new common_1.ConflictException('Chuyển trạng thái hồ sơ không hợp lệ.');
                }
            }
            if (['rejected', 'not_hired'].includes(newStatus) && !reason) {
                throw new common_1.BadRequestException('Vui lòng nhập lý do từ chối.');
            }
        }
        await this.prisma.application.update({
            where: { id: applicationId },
            data: {
                status: newStatus,
                reason: reason || null,
            },
        });
        await this.auditService.log('application', applicationId, newStatus, { reason }, user.id);
        const recipient = newStatus === 'withdrawn' ? app.job.company.ownerId : app.studentId;
        await this.notificationsService.notify(recipient, 'application', 'Hồ sơ ứng tuyển được cập nhật', `${app.job.title}: ${newStatus}.`, `/workspace/applications/${applicationId}`);
        let filled = false;
        if (newStatus === 'hired') {
            const hiredCount = await this.prisma.application.count({
                where: { jobId: app.jobId, status: 'hired' },
            });
            filled = hiredCount >= app.job.vacancies;
        }
        return { ok: true, filled };
    }
};
exports.ApplicationsService = ApplicationsService;
exports.ApplicationsService = ApplicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], ApplicationsService);
//# sourceMappingURL=applications.service.js.map
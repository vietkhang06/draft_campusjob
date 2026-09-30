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
exports.InterviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
let InterviewsService = class InterviewsService {
    prisma;
    notificationsService;
    auditService;
    constructor(prisma, notificationsService, auditService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
    }
    async getInterviews(user) {
        let whereCondition;
        if (user.role === 'student') {
            whereCondition = { application: { studentId: user.id } };
        }
        else if (user.role === 'employer') {
            whereCondition = { application: { job: { company: { ownerId: user.id } } } };
        }
        else {
            throw new common_1.ForbiddenException('Bạn không có quyền xem lịch phỏng vấn.');
        }
        const interviews = await this.prisma.interview.findMany({
            where: whereCondition,
            include: {
                application: {
                    include: {
                        job: {
                            include: {
                                company: { select: { name: true } },
                            },
                        },
                        student: { select: { name: true } },
                    },
                },
            },
            orderBy: { time: 'desc' },
        });
        return {
            interviews: interviews.map((i) => ({
                id: i.id,
                application_id: i.applicationId,
                title: i.application.job.title,
                company_name: i.application.job.company.name,
                student_name: i.application.student.name,
                time: i.time.toISOString(),
                mode: i.mode,
                location: i.location,
                message: i.message,
                response: i.response,
                reschedule_used: i.rescheduleUsed ? 1 : 0,
                proposed: i.proposed?.toISOString() || null,
                request_reason: i.requestReason,
                decision: i.decision,
                created: i.createdAt.toISOString(),
            })),
        };
    }
    async invite(applicationId, employerId, body) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: { include: { company: true } },
                student: { select: { name: true } },
            },
        });
        if (!app) {
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ ứng tuyển.');
        }
        if (app.job.company.ownerId !== employerId) {
            throw new common_1.ForbiddenException('Bạn không có quyền mời phỏng vấn hồ sơ này.');
        }
        if (app.job.company.status !== 'active') {
            throw new common_1.ForbiddenException('Doanh nghiệp phải đang hoạt động.');
        }
        if (app.status !== 'viewed') {
            throw new common_1.ConflictException('Hãy đánh dấu đã xem trước khi mời phỏng vấn.');
        }
        const time = new Date(body.time);
        if (isNaN(time.getTime()) || time <= new Date()) {
            throw new common_1.BadRequestException('Thời gian phỏng vấn không hợp lệ hoặc đã qua.');
        }
        const mode = body.mode === 'online' ? 'online' : 'onsite';
        const location = String(body.location || '').trim();
        if (!location) {
            throw new common_1.BadRequestException('Vui lòng nhập địa điểm hoặc liên kết phỏng vấn.');
        }
        if (mode === 'online' && !/^https?:\/\//i.test(location)) {
            throw new common_1.BadRequestException('Liên kết phỏng vấn trực tuyến phải bắt đầu bằng https:// hoặc http://.');
        }
        const message = String(body.message || '').trim().slice(0, 3000);
        if (!message) {
            throw new common_1.BadRequestException('Vui lòng nhập lời nhắn phỏng vấn.');
        }
        const interview = await this.prisma.$transaction(async (tx) => {
            const created = await tx.interview.create({
                data: {
                    applicationId,
                    time,
                    mode,
                    location,
                    message,
                    response: 'invited',
                },
            });
            await tx.application.update({
                where: { id: applicationId },
                data: { status: 'interview' },
            });
            return created;
        });
        await this.auditService.log('application', applicationId, 'interview', { time: time.toISOString() }, employerId);
        await this.notificationsService.notify(app.studentId, 'interview', 'Bạn nhận được lời mời phỏng vấn', `${app.job.company.name} mời phỏng vấn vị trí ${app.job.title}.`, `/workspace/applications/${applicationId}`);
        return { id: interview.id };
    }
    async confirm(applicationId, studentId) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: { include: { company: true } },
                student: { select: { name: true } },
                interview: true,
            },
        });
        if (!app || !app.interview) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
        }
        if (app.studentId !== studentId) {
            throw new common_1.ForbiddenException('Chỉ ứng viên được xác nhận phỏng vấn.');
        }
        if (app.interview.response !== 'invited' || app.interview.time <= new Date()) {
            throw new common_1.ConflictException('Lời mời đã được xử lý hoặc đã quá giờ hẹn.');
        }
        await this.prisma.interview.update({
            where: { id: app.interview.id },
            data: { response: 'confirmed' },
        });
        await this.auditService.log('application', applicationId, 'interview_confirm', {}, studentId);
        await this.notificationsService.notify(app.job.company.ownerId, 'interview', 'Ứng viên xác nhận phỏng vấn', `${app.student.name} đã xác nhận tham gia phỏng vấn vị trí ${app.job.title}.`, `/workspace/applications/${applicationId}`);
        return { ok: true };
    }
    async reschedule(applicationId, studentId, body) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: { include: { company: true } },
                student: { select: { name: true } },
                interview: true,
            },
        });
        if (!app || !app.interview) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
        }
        if (app.studentId !== studentId) {
            throw new common_1.ForbiddenException('Chỉ ứng viên được đề nghị đổi lịch.');
        }
        if (app.interview.rescheduleUsed) {
            throw new common_1.ConflictException('Mỗi buổi phỏng vấn chỉ được đề nghị đổi lịch một lần.');
        }
        if (!['invited', 'confirmed'].includes(app.interview.response) || app.interview.time <= new Date()) {
            throw new common_1.ConflictException('Không thể đề nghị đổi lịch cho buổi phỏng vấn này.');
        }
        const proposed = new Date(body.time);
        if (isNaN(proposed.getTime()) || proposed <= new Date()) {
            throw new common_1.BadRequestException('Thời gian đề nghị phải ở tương lai.');
        }
        const reason = String(body.reason || '').trim().slice(0, 2000);
        if (!reason) {
            throw new common_1.BadRequestException('Vui lòng nhập lý do đổi lịch.');
        }
        await this.prisma.interview.update({
            where: { id: app.interview.id },
            data: {
                response: 'reschedule_requested',
                rescheduleUsed: true,
                proposed,
                requestReason: reason,
            },
        });
        await this.auditService.log('application', applicationId, 'interview_reschedule', { proposed: proposed.toISOString(), reason }, studentId);
        await this.notificationsService.notify(app.job.company.ownerId, 'interview', 'Ứng viên đề nghị đổi lịch phỏng vấn', `${app.student.name} đề nghị đổi lịch: ${reason}`, `/workspace/applications/${applicationId}`);
        return { ok: true };
    }
    async resolve(applicationId, employerId, body) {
        const app = await this.prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                job: { include: { company: true } },
                interview: true,
            },
        });
        if (!app || !app.interview) {
            throw new common_1.NotFoundException('Không tìm thấy lịch phỏng vấn.');
        }
        if (app.job.company.ownerId !== employerId) {
            throw new common_1.ForbiddenException('Chỉ nhà tuyển dụng được xử lý đề nghị đổi lịch.');
        }
        if (app.interview.response !== 'reschedule_requested') {
            throw new common_1.ConflictException('Không có đề nghị đổi lịch chờ xử lý.');
        }
        const accept = Boolean(body.accept);
        let newTime = app.interview.time;
        if (accept) {
            if (!app.interview.proposed || app.interview.proposed <= new Date()) {
                throw new common_1.BadRequestException('Thời gian đề nghị đã qua.');
            }
            newTime = app.interview.proposed;
        }
        else {
            if (app.interview.time <= new Date()) {
                throw new common_1.BadRequestException('Lịch cũ đã qua. Cần chấp nhận thời gian mới.');
            }
        }
        const reason = String(body.reason || '').trim().slice(0, 2000);
        if (!reason) {
            throw new common_1.BadRequestException('Vui lòng nhập phản hồi cho ứng viên.');
        }
        await this.prisma.interview.update({
            where: { id: app.interview.id },
            data: {
                time: newTime,
                response: 'invited',
                decision: reason,
            },
        });
        await this.auditService.log('application', applicationId, 'interview_resolve', { accept, reason }, employerId);
        await this.notificationsService.notify(app.studentId, 'interview', 'Đề nghị đổi lịch đã được xử lý', reason, `/workspace/applications/${applicationId}`);
        return { ok: true };
    }
};
exports.InterviewsService = InterviewsService;
exports.InterviewsService = InterviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], InterviewsService);
//# sourceMappingURL=interviews.service.js.map
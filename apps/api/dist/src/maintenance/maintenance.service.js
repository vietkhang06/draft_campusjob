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
var MaintenanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mail_service_1 = require("../mail/mail.service");
const notifications_service_1 = require("../notifications/notifications.service");
let MaintenanceService = MaintenanceService_1 = class MaintenanceService {
    prisma;
    mailService;
    notificationsService;
    logger = new common_1.Logger(MaintenanceService_1.name);
    constructor(prisma, mailService, notificationsService) {
        this.prisma = prisma;
        this.mailService = mailService;
        this.notificationsService = notificationsService;
    }
    async runMaintenance() {
        const now = new Date();
        await this.prisma.job.updateMany({
            where: {
                status: { in: ['open', 'paused'] },
                deadline: { lte: now },
            },
            data: {
                status: 'closed',
            },
        });
        const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        const expiringSoon = await this.prisma.job.findMany({
            where: {
                status: { in: ['open', 'paused'] },
                deadline: {
                    gt: now,
                    lte: threeDaysFromNow,
                },
            },
            include: {
                company: { select: { ownerId: true } },
            },
            take: 100,
        });
        for (const j of expiringSoon) {
            const dedupe = `deadline:${j.id}:${j.deadline.toISOString()}`;
            await this.notificationsService.notify(j.company.ownerId, 'deadline', 'Tin tuyển dụng sắp hết hạn', `${j.title} hết hạn vào ngày ${j.deadline.toLocaleDateString('vi-VN')}.`, '/workspace/jobs', dedupe);
        }
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        await this.prisma.rateLimit.deleteMany({
            where: {
                window: { lt: yesterday },
            },
        });
        const flushResult = await this.flushEmail();
        return {
            ok: true,
            ...flushResult,
        };
    }
    async flushEmail() {
        const pendingEmails = await this.prisma.emailQueue.findMany({
            where: {
                status: { in: ['queued', 'failed'] },
                attempts: { lt: 5 },
            },
            orderBy: { createdAt: 'asc' },
            take: 25,
        });
        let sent = 0;
        for (const m of pendingEmails) {
            try {
                const success = await this.mailService.sendEmail(m.recipient, m.subject, m.body);
                if (success) {
                    await this.prisma.emailQueue.update({
                        where: { id: m.id },
                        data: {
                            status: 'sent',
                            attempts: m.attempts + 1,
                            sentAt: new Date(),
                            error: null,
                        },
                    });
                    sent++;
                }
                else {
                    await this.prisma.emailQueue.update({
                        where: { id: m.id },
                        data: {
                            status: 'failed',
                            attempts: m.attempts + 1,
                            error: 'Không thể kết nối dịch vụ email',
                        },
                    });
                }
            }
            catch (err) {
                await this.prisma.emailQueue.update({
                    where: { id: m.id },
                    data: {
                        status: 'failed',
                        attempts: m.attempts + 1,
                        error: String(err?.message || err).slice(0, 300),
                    },
                });
            }
        }
        return { email: 'processed', sent };
    }
};
exports.MaintenanceService = MaintenanceService;
exports.MaintenanceService = MaintenanceService = MaintenanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService,
        notifications_service_1.NotificationsService])
], MaintenanceService);
//# sourceMappingURL=maintenance.service.js.map
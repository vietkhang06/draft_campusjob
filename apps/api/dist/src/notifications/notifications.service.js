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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async notify(recipientId, kind, title, body, url = '/workspace', dedupe = null) {
        try {
            if (dedupe) {
                const existing = await this.prisma.notification.findUnique({
                    where: { dedupe },
                });
                if (existing) {
                    return existing;
                }
            }
            const notif = await this.prisma.notification.create({
                data: {
                    recipientId,
                    kind,
                    title,
                    body,
                    url,
                    dedupe: dedupe || undefined,
                },
            });
            const user = await this.prisma.user.findUnique({
                where: { id: recipientId },
            });
            if (user) {
                const profile = user.profile || {};
                const emailPrefs = profile.emailPreferences || {};
                if (emailPrefs[kind] !== false) {
                    await this.prisma.emailQueue.create({
                        data: {
                            notificationId: notif.id,
                            recipient: user.email,
                            subject: title,
                            body,
                        },
                    });
                }
            }
            return notif;
        }
        catch (err) {
            this.logger.error(`Failed to create notification: ${err.message}`);
        }
    }
    async notifyStaff(kind, title, body, url = '/workspace/moderation') {
        const staff = await this.prisma.user.findMany({
            where: {
                role: { in: ['admin', 'moderator'] },
            },
        });
        for (const u of staff) {
            await this.notify(u.id, kind, title, body, url);
        }
    }
    async getUserNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
    async markAsRead(userId, notificationId) {
        if (notificationId) {
            await this.prisma.notification.updateMany({
                where: { id: notificationId, recipientId: userId },
                data: { read: true },
            });
        }
        else {
            await this.prisma.notification.updateMany({
                where: { recipientId: userId },
                data: { read: true },
            });
        }
        return { ok: true };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map
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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
let MessagesService = class MessagesService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async checkAccess(applicationId, user) {
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
        if (!isStudent && !isEmployer) {
            throw new common_1.ForbiddenException('Chỉ hai bên tuyển dụng được đọc hoặc gửi tin nhắn.');
        }
        if (app.job.company.status !== 'active') {
            throw new common_1.ForbiddenException('Doanh nghiệp không hoạt động.');
        }
        if (!app.interview) {
            throw new common_1.ForbiddenException('Trao đổi mở sau lời mời phỏng vấn.');
        }
        return app;
    }
    async getMessages(applicationId, user) {
        await this.checkAccess(applicationId, user);
        const messages = await this.prisma.message.findMany({
            where: { applicationId },
            include: {
                sender: { select: { name: true } },
            },
            orderBy: { createdAt: 'asc' },
            take: 500,
        });
        return {
            messages: messages.map((m) => ({
                id: m.id,
                application: m.applicationId,
                sender: m.senderId,
                name: m.sender.name,
                body: m.body,
                created: m.createdAt.toISOString(),
            })),
        };
    }
    async sendMessage(applicationId, user, bodyText) {
        const app = await this.checkAccess(applicationId, user);
        const body = String(bodyText || '').trim().slice(0, 4000);
        if (!body) {
            throw new common_1.BadRequestException('Vui lòng nhập nội dung tin nhắn.');
        }
        const message = await this.prisma.message.create({
            data: {
                applicationId,
                senderId: user.id,
                body,
            },
        });
        const recipientId = app.studentId === user.id ? app.job.company.ownerId : app.studentId;
        await this.notificationsService.notify(recipientId, 'message', 'Bạn có tin nhắn mới', body.slice(0, 150), `/workspace/applications/${applicationId}`);
        return { id: message.id };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map
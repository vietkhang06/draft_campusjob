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
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const TERMINAL_STATUSES = ['hired', 'not_hired', 'rejected'];
let ReviewsService = class ReviewsService {
    prisma;
    notificationsService;
    constructor(prisma, notificationsService) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
    }
    async getCompanyReviews(userId) {
        const company = await this.prisma.company.findUnique({
            where: { ownerId: userId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Chưa có hồ sơ doanh nghiệp.');
        }
        const reviews = await this.prisma.review.findMany({
            where: { companyId: company.id },
            include: {
                student: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            reviews: reviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                reply: r.reply,
                hidden: r.hidden ? 1 : 0,
                student_name: r.student.name,
                created: r.createdAt.toISOString(),
            })),
        };
    }
    async createReview(studentId, body) {
        const app = await this.prisma.application.findUnique({
            where: { id: body.application },
            include: {
                job: { include: { company: true } },
            },
        });
        if (!app) {
            throw new common_1.NotFoundException('Không tìm thấy hồ sơ ứng tuyển.');
        }
        if (app.studentId !== studentId) {
            throw new common_1.ForbiddenException('Chỉ ứng viên của hồ sơ mới có quyền đánh giá.');
        }
        if (!TERMINAL_STATUSES.includes(app.status)) {
            throw new common_1.ForbiddenException('Chỉ được đánh giá sau khi có kết quả tuyển dụng cuối cùng.');
        }
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            throw new common_1.BadRequestException('Số sao đánh giá phải là số nguyên từ 1 đến 5.');
        }
        const comment = String(body.comment || '').trim().slice(0, 4000);
        if (!comment) {
            throw new common_1.BadRequestException('Vui lòng nhập nhận xét đánh giá.');
        }
        const existing = await this.prisma.review.findUnique({
            where: { applicationId: app.id },
        });
        if (existing) {
            throw new common_1.ConflictException('Hồ sơ ứng tuyển này đã được đánh giá rồi.');
        }
        const review = await this.prisma.review.create({
            data: {
                applicationId: app.id,
                studentId,
                companyId: app.job.companyId,
                rating,
                comment,
            },
        });
        const allReviews = await this.prisma.review.findMany({
            where: { companyId: app.job.companyId, hidden: false },
            select: { rating: true },
        });
        if (allReviews.length >= 10) {
            const oneStarCount = allReviews.filter((r) => r.rating === 1).length;
            if (oneStarCount / allReviews.length > 0.3) {
                await this.prisma.company.update({
                    where: { id: app.job.companyId },
                    data: { flag: 1 },
                });
            }
        }
        await this.notificationsService.notify(app.job.company.ownerId, 'review', 'Doanh nghiệp nhận được đánh giá', `${rating}/5 sao: ${comment.slice(0, 100)}`, '/workspace/reviews');
        return { id: review.id };
    }
    async replyReview(employerId, reviewId, replyText) {
        const company = await this.prisma.company.findUnique({
            where: { ownerId: employerId },
        });
        if (!company) {
            throw new common_1.ForbiddenException('Chưa có hồ sơ doanh nghiệp.');
        }
        const review = await this.prisma.review.findFirst({
            where: { id: reviewId, companyId: company.id },
        });
        if (!review) {
            throw new common_1.NotFoundException('Không tìm thấy đánh giá.');
        }
        if (review.reply !== null) {
            throw new common_1.ConflictException('Đánh giá này đã được phản hồi.');
        }
        const reply = String(replyText || '').trim().slice(0, 4000);
        if (!reply) {
            throw new common_1.BadRequestException('Vui lòng nhập nội dung phản hồi.');
        }
        await this.prisma.review.update({
            where: { id: reviewId },
            data: { reply },
        });
        return { ok: true };
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map
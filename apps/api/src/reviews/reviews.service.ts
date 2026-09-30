import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const TERMINAL_STATUSES = ['hired', 'not_hired', 'rejected'];

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getCompanyReviews(userId: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: userId },
    });
    if (!company) {
      throw new NotFoundException('Chưa có hồ sơ doanh nghiệp.');
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

  async createReview(studentId: string, body: any) {
    const app = await this.prisma.application.findUnique({
      where: { id: body.application },
      include: {
        job: { include: { company: true } },
      },
    });

    if (!app) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng tuyển.');
    }

    if (app.studentId !== studentId) {
      throw new ForbiddenException('Chỉ ứng viên của hồ sơ mới có quyền đánh giá.');
    }

    if (!TERMINAL_STATUSES.includes(app.status)) {
      throw new ForbiddenException('Chỉ được đánh giá sau khi có kết quả tuyển dụng cuối cùng.');
    }

    const rating = Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new BadRequestException('Số sao đánh giá phải là số nguyên từ 1 đến 5.');
    }

    const comment = String(body.comment || '').trim().slice(0, 4000);
    if (!comment) {
      throw new BadRequestException('Vui lòng nhập nhận xét đánh giá.');
    }

    const existing = await this.prisma.review.findUnique({
      where: { applicationId: app.id },
    });
    if (existing) {
      throw new ConflictException('Hồ sơ ứng tuyển này đã được đánh giá rồi.');
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

    // Check warning flag: > 30% 1-star reviews among >= 10 reviews
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

    await this.notificationsService.notify(
      app.job.company.ownerId,
      'review',
      'Doanh nghiệp nhận được đánh giá',
      `${rating}/5 sao: ${comment.slice(0, 100)}`,
      '/workspace/reviews',
    );

    return { id: review.id };
  }

  async replyReview(employerId: string, reviewId: string, replyText: string) {
    const company = await this.prisma.company.findUnique({
      where: { ownerId: employerId },
    });
    if (!company) {
      throw new ForbiddenException('Chưa có hồ sơ doanh nghiệp.');
    }

    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, companyId: company.id },
    });
    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    if (review.reply !== null) {
      throw new ConflictException('Đánh giá này đã được phản hồi.');
    }

    const reply = String(replyText || '').trim().slice(0, 4000);
    if (!reply) {
      throw new BadRequestException('Vui lòng nhập nội dung phản hồi.');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { reply },
    });

    return { ok: true };
  }
}

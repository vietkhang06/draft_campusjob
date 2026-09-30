import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ModerationService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
  ) {}

  async getQueue() {
    const jobs = await this.prisma.job.findMany({
      where: { status: 'pending' },
      include: {
        company: { select: { name: true, status: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const reports = await this.prisma.report.findMany({
      where: { status: { in: ['pending', 'reviewed'] } },
      include: {
        reporter: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Lookup target names for reports
    const targetUserIds = reports
      .filter((r) => r.targetType === 'student')
      .map((r) => r.targetId);
    const targetCompanyIds = reports
      .filter((r) => r.targetType === 'company')
      .map((r) => r.targetId);

    const users = await this.prisma.user.findMany({
      where: { id: { in: targetUserIds } },
      select: { id: true, name: true },
    });
    const companies = await this.prisma.company.findMany({
      where: { id: { in: targetCompanyIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const companyMap = new Map(companies.map((c) => [c.id, c.name]));

    const reviews = await this.prisma.review.findMany({
      include: {
        company: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        type: j.type,
        industry: j.industry,
        description: j.description,
        skills: j.skills,
        schedule: j.schedule,
        benefits: j.benefits,
        salary_min: j.salaryMin,
        salary_max: j.salaryMax,
        salary_unit: j.salaryUnit,
        deadline: j.deadline.toISOString(),
        company_name: j.company.name,
        company_status: j.company.status,
      })),
      reports: reports.map((r) => ({
        id: r.id,
        kind: r.kind,
        status: r.status,
        description: r.description,
        evidence: r.evidence,
        application: r.applicationId,
        recommendation: r.recommendation,
        reporter_name: r.reporter.name,
        target_name:
          r.targetType === 'student'
            ? userMap.get(r.targetId) || 'Sinh viên'
            : companyMap.get(r.targetId) || 'Doanh nghiệp',
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        hidden: r.hidden ? 1 : 0,
        company_name: r.company.name,
      })),
    };
  }

  async moderateJob(jobId: string, user: any, body: any) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng.');
    }

    if (job.company.ownerId === user.id) {
      throw new ForbiddenException('Không được tự duyệt tin của mình.');
    }

    const reason = String(body.reason || '').trim().slice(0, 2000);
    if (!reason) {
      throw new BadRequestException('Vui lòng nhập nhận xét kiểm duyệt.');
    }

    let status = '';
    if (body.decision === 'approve') {
      if (
        job.company.status !== 'active' ||
        job.deadline <= new Date() ||
        job.status !== 'pending'
      ) {
        throw new ConflictException('Tin chưa đủ điều kiện duyệt.');
      }
      status = 'open';
    } else if (body.decision === 'reject') {
      if (job.status !== 'pending') {
        throw new ConflictException('Tin đã được xử lý.');
      }
      status = 'rejected';
    } else if (body.decision === 'hide') {
      status = 'pending';
    } else {
      throw new BadRequestException('Quyết định kiểm duyệt không hợp lệ.');
    }

    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status,
        reason,
      },
    });

    await this.auditService.log('job', jobId, body.decision, { reason }, user.id);
    await this.notificationsService.notify(
      job.company.ownerId,
      'moderation',
      'Kết quả kiểm duyệt tin',
      `${job.title}: ${status}. ${reason}`,
      '/workspace/jobs',
    );

    return { ok: true };
  }

  async moderateReport(reportId: string, user: any, body: any) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report || report.status !== 'pending') {
      throw new ConflictException('Báo cáo đã được xử lý hoặc không tồn tại.');
    }

    const recommendation = String(body.recommendation || '').trim().slice(0, 4000);
    if (!recommendation) {
      throw new BadRequestException('Vui lòng nhập kết luận sơ bộ và đề xuất.');
    }

    await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: 'reviewed',
        recommendation,
      },
    });

    await this.auditService.log('report', reportId, 'reviewed', { recommendation }, user.id);
    return { ok: true };
  }

  async moderateReview(reviewId: string, user: any, body: any) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Không tìm thấy đánh giá.');
    }

    const reason = String(body.reason || '').trim().slice(0, 2000);
    const hidden = Boolean(body.hidden);

    await this.prisma.review.update({
      where: { id: reviewId },
      data: { hidden },
    });

    await this.auditService.log(
      'review',
      reviewId,
      hidden ? 'hidden' : 'restored',
      { reason },
      user.id,
    );

    return { ok: true };
  }
}

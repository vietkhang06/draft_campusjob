import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private notificationsService: NotificationsService,
  ) {}

  async runMaintenance() {
    const now = new Date();

    // 1. Close expired jobs
    await this.prisma.job.updateMany({
      where: {
        status: { in: ['open', 'paused'] },
        deadline: { lte: now },
      },
      data: {
        status: 'closed',
      },
    });

    // 2. Notify jobs expiring in next 3 days
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
      await this.notificationsService.notify(
        j.company.ownerId,
        'deadline',
        'Tin tuyển dụng sắp hết hạn',
        `${j.title} hết hạn vào ngày ${j.deadline.toLocaleDateString('vi-VN')}.`,
        '/workspace/jobs',
        dedupe,
      );
    }

    // 3. Clean up rate limits older than 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
    await this.prisma.rateLimit.deleteMany({
      where: {
        window: { lt: yesterday },
      },
    });

    // 4. Flush email queue
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
        const success = await this.mailService.sendEmail(
          m.recipient,
          m.subject,
          m.body,
        );

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
        } else {
          await this.prisma.emailQueue.update({
            where: { id: m.id },
            data: {
              status: 'failed',
              attempts: m.attempts + 1,
              error: 'Không thể kết nối dịch vụ email',
            },
          });
        }
      } catch (err: any) {
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
}

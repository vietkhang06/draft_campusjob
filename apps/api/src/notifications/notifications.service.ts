import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  async notify(
    recipientId: string,
    kind: string,
    title: string,
    body: string,
    url = '/workspace',
    dedupe: string | null = null,
  ) {
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
        const profile = (user.profile as Record<string, any>) || {};
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
    } catch (err: any) {
      this.logger.error(`Failed to create notification: ${err.message}`);
    }
  }

  async notifyStaff(kind: string, title: string, body: string, url = '/workspace/moderation') {
    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: ['admin', 'moderator'] },
      },
    });

    for (const u of staff) {
      await this.notify(u.id, kind, title, body, url);
    }
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async markAsRead(userId: string, notificationId?: string) {
    if (notificationId) {
      await this.prisma.notification.updateMany({
        where: { id: notificationId, recipientId: userId },
        data: { read: true },
      });
    } else {
      await this.prisma.notification.updateMany({
        where: { recipientId: userId },
        data: { read: true },
      });
    }
    return { ok: true };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  private async checkAccess(applicationId: string, user: any) {
    const app = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: { include: { company: true } },
        interview: true,
      },
    });

    if (!app) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng tuyển.');
    }

    const isStudent = app.studentId === user.id;
    const isEmployer = app.job.company.ownerId === user.id;

    if (!isStudent && !isEmployer) {
      throw new ForbiddenException('Chỉ hai bên tuyển dụng được đọc hoặc gửi tin nhắn.');
    }

    if (app.job.company.status !== 'active') {
      throw new ForbiddenException('Doanh nghiệp không hoạt động.');
    }

    if (!app.interview) {
      throw new ForbiddenException('Trao đổi mở sau lời mời phỏng vấn.');
    }

    return app;
  }

  async getMessages(applicationId: string, user: any) {
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

  async sendMessage(applicationId: string, user: any, bodyText: string) {
    const app = await this.checkAccess(applicationId, user);

    const body = String(bodyText || '').trim().slice(0, 4000);
    if (!body) {
      throw new BadRequestException('Vui lòng nhập nội dung tin nhắn.');
    }

    const message = await this.prisma.message.create({
      data: {
        applicationId,
        senderId: user.id,
        body,
      },
    });

    const recipientId = app.studentId === user.id ? app.job.company.ownerId : app.studentId;
    await this.notificationsService.notify(
      recipientId,
      'message',
      'Bạn có tin nhắn mới',
      body.slice(0, 150),
      `/workspace/applications/${applicationId}`,
    );

    return { id: message.id };
  }
}

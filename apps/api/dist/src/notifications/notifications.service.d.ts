import { PrismaService } from '../prisma/prisma.service';
export declare class NotificationsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    notify(recipientId: string, kind: string, title: string, body: string, url?: string, dedupe?: string | null): Promise<{
        id: string;
        dedupe: string | null;
        recipientId: string;
        kind: string;
        title: string;
        body: string;
        url: string;
        read: boolean;
        createdAt: Date;
    }>;
    notifyStaff(kind: string, title: string, body: string, url?: string): Promise<void>;
    getUserNotifications(userId: string): Promise<{
        id: string;
        dedupe: string | null;
        recipientId: string;
        kind: string;
        title: string;
        body: string;
        url: string;
        read: boolean;
        createdAt: Date;
    }[]>;
    markAsRead(userId: string, notificationId?: string): Promise<{
        ok: boolean;
    }>;
}

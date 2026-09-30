import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(userId: string): Promise<{
        notifications: {
            id: string;
            dedupe: string | null;
            recipientId: string;
            kind: string;
            title: string;
            body: string;
            url: string;
            read: boolean;
            createdAt: Date;
        }[];
    }>;
    markAllRead(userId: string): Promise<{
        ok: boolean;
    }>;
    markOneRead(userId: string, notificationId: string): Promise<{
        ok: boolean;
    }>;
}

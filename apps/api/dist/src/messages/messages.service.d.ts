import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class MessagesService {
    private prisma;
    private notificationsService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    private checkAccess;
    getMessages(applicationId: string, user: any): Promise<{
        messages: {
            id: string;
            application: string;
            sender: string;
            name: string;
            body: string;
            created: string;
        }[];
    }>;
    sendMessage(applicationId: string, user: any, bodyText: string): Promise<{
        id: string;
    }>;
}

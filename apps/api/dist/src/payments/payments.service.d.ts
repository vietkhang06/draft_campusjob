import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
export declare class PaymentsService {
    private prisma;
    private configService;
    private notificationsService;
    private auditService;
    private readonly logger;
    private stripe;
    private readonly webhookSecret?;
    private readonly webOrigin;
    constructor(prisma: PrismaService, configService: ConfigService, notificationsService: NotificationsService, auditService: AuditService);
    isConfigured(): boolean;
    getPlans(userRole?: string): Promise<{
        plans: {
            id: string;
            name: string;
            amount: number;
            days: number;
            active: number;
        }[];
        available: boolean;
    }>;
    createPlan(adminId: string, body: any): Promise<{
        id: string;
    }>;
    togglePlan(adminId: string, planId: string, active: boolean): Promise<{
        ok: boolean;
    }>;
    getOrders(employerId: string): Promise<{
        orders: {
            id: string;
            name: string;
            title: string;
            amount: number;
            status: string;
            created: string;
        }[];
    }>;
    createOrder(employerId: string, userEmail: string, body: any): Promise<{
        url: string;
        id: string;
    }>;
    handleWebhook(rawBody: Buffer | string, signature: string): Promise<{
        received: boolean;
    }>;
}

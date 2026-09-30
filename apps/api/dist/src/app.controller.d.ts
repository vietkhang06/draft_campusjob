import { PrismaService } from './prisma/prisma.service';
import { PaymentsService } from './payments/payments.service';
export declare class AppController {
    private prisma;
    private paymentsService;
    constructor(prisma: PrismaService, paymentsService: PaymentsService);
    getSession(user: any): Promise<{
        user: any;
        setupRequired: boolean;
        emailConfigured: boolean;
        paymentConfigured: boolean;
    }>;
    healthCheck(): {
        status: string;
        timestamp: string;
    };
}

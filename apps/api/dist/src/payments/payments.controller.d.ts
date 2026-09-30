import { Request } from 'express';
import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    getPlans(user: any): Promise<{
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
    getOrders(userId: string): Promise<{
        orders: {
            id: string;
            name: string;
            title: string;
            amount: number;
            status: string;
            created: string;
        }[];
    }>;
    createOrder(userId: string, userEmail: string, body: any): Promise<{
        url: string;
        id: string;
    }>;
    paymentWebhook(req: Request, signature: string): Promise<{
        received: boolean;
    }>;
}

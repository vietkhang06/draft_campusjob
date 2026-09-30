"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    prisma;
    configService;
    notificationsService;
    auditService;
    logger = new common_1.Logger(PaymentsService_1.name);
    stripe = null;
    webhookSecret;
    webOrigin;
    constructor(prisma, configService, notificationsService, auditService) {
        this.prisma = prisma;
        this.configService = configService;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
        const stripeKey = this.configService.get('stripeSecretKey');
        this.webhookSecret = this.configService.get('stripeWebhookSecret');
        const origins = this.configService.get('webOrigin', ['http://localhost:3000']);
        this.webOrigin = origins[0] || 'http://localhost:3000';
        if (stripeKey) {
            this.stripe = new stripe_1.default(stripeKey);
        }
    }
    isConfigured() {
        return Boolean(this.stripe && this.webhookSecret);
    }
    async getPlans(userRole) {
        const plans = await this.prisma.plan.findMany({
            where: userRole === 'admin' ? {} : { active: true },
            orderBy: { amount: 'asc' },
        });
        return {
            plans: plans.map((p) => ({
                id: p.id,
                name: p.name,
                amount: p.amount,
                days: p.days,
                active: p.active ? 1 : 0,
            })),
            available: this.isConfigured(),
        };
    }
    async createPlan(adminId, body) {
        const name = String(body.name || '').trim().slice(0, 120);
        const amount = Number(body.amount);
        const days = Number(body.days);
        if (!name) {
            throw new common_1.BadRequestException('Vui lòng nhập tên gói.');
        }
        if (!Number.isInteger(amount) || amount < 10000 || amount > 100000000) {
            throw new common_1.BadRequestException('Số tiền phải từ 10.000 đến 100.000.000 đ.');
        }
        if (!Number.isInteger(days) || days < 1 || days > 365) {
            throw new common_1.BadRequestException('Số ngày phải từ 1 đến 365 ngày.');
        }
        const plan = await this.prisma.plan.create({
            data: { name, amount, days },
        });
        await this.auditService.log('plan', plan.id, 'created', { name, amount, days }, adminId);
        return { id: plan.id };
    }
    async togglePlan(adminId, planId, active) {
        const plan = await this.prisma.plan.findUnique({
            where: { id: planId },
        });
        if (!plan) {
            throw new common_1.NotFoundException('Không tìm thấy gói.');
        }
        await this.prisma.plan.update({
            where: { id: planId },
            data: { active: Boolean(active) },
        });
        await this.auditService.log('plan', planId, 'availability', { active: Boolean(active) }, adminId);
        return { ok: true };
    }
    async getOrders(employerId) {
        const company = await this.prisma.company.findUnique({
            where: { ownerId: employerId },
        });
        if (!company) {
            throw new common_1.NotFoundException('Chưa có hồ sơ doanh nghiệp.');
        }
        const orders = await this.prisma.order.findMany({
            where: { companyId: company.id },
            include: {
                plan: { select: { name: true } },
                job: { select: { title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return {
            orders: orders.map((o) => ({
                id: o.id,
                name: o.plan.name,
                title: o.job.title,
                amount: o.amount,
                status: o.status,
                created: o.createdAt.toISOString(),
            })),
        };
    }
    async createOrder(employerId, userEmail, body) {
        if (!this.stripe || !this.webhookSecret) {
            throw new common_1.ServiceUnavailableException('Thanh toán chưa được cấu hình. Không có giao dịch nào được tạo.');
        }
        const company = await this.prisma.company.findUnique({
            where: { ownerId: employerId },
        });
        if (!company || company.status !== 'active') {
            throw new common_1.ForbiddenException('Doanh nghiệp phải đang hoạt động.');
        }
        const plan = await this.prisma.plan.findFirst({
            where: { id: body.plan, active: true },
        });
        if (!plan) {
            throw new common_1.BadRequestException('Gói dịch vụ không tồn tại hoặc đã ngừng bán.');
        }
        const job = await this.prisma.job.findFirst({
            where: { id: body.job, companyId: company.id },
        });
        if (!job || job.status !== 'open' || job.deadline <= new Date()) {
            throw new common_1.BadRequestException('Tin tuyển dụng phải đang mở và còn hạn.');
        }
        const order = await this.prisma.order.create({
            data: {
                companyId: company.id,
                jobId: job.id,
                planId: plan.id,
                amount: plan.amount,
                days: plan.days,
                status: 'pending',
            },
        });
        try {
            const session = await this.stripe.checkout.sessions.create({
                mode: 'payment',
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: 'vnd',
                            unit_amount: plan.amount,
                            product_data: {
                                name: `${plan.name} · ${job.title}`,
                            },
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    order_id: order.id,
                },
                client_reference_id: order.id,
                customer_email: userEmail,
                success_url: `${this.webOrigin}/workspace/services?payment=complete`,
                cancel_url: `${this.webOrigin}/workspace/services?payment=cancelled`,
            });
            await this.prisma.order.update({
                where: { id: order.id },
                data: { session: session.id },
            });
            return { url: session.url, id: order.id };
        }
        catch (err) {
            this.logger.error(`Stripe checkout session error: ${err.message}`);
            await this.prisma.order.update({
                where: { id: order.id },
                data: { status: 'failed' },
            });
            throw new common_1.ServiceUnavailableException('Chưa thể mở cổng thanh toán. Không cấp quyền tin nổi bật.');
        }
    }
    async handleWebhook(rawBody, signature) {
        if (!this.stripe || !this.webhookSecret) {
            throw new common_1.ServiceUnavailableException('Thanh toán chưa được cấu hình.');
        }
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
        }
        catch (err) {
            this.logger.warn(`Stripe webhook signature failed: ${err.message}`);
            throw new common_1.BadRequestException('Chữ ký không hợp lệ.');
        }
        if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.expired'].includes(event.type)) {
            return { received: true };
        }
        const session = event.data.object;
        const orderId = session.metadata?.order_id || '';
        const order = await this.prisma.order.findFirst({
            where: {
                OR: [{ id: orderId }, { session: session.id }],
            },
            include: {
                company: true,
                job: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Không tìm thấy đơn thanh toán.');
        }
        if (event.type === 'checkout.session.expired') {
            await this.prisma.order.updateMany({
                where: { id: order.id, status: 'pending' },
                data: { status: 'expired' },
            });
            return { received: true };
        }
        if (session.payment_status !== 'paid') {
            return { received: true };
        }
        if (session.amount_total !== order.amount || session.currency !== 'vnd') {
            throw new common_1.BadRequestException('Thông tin thanh toán không khớp đơn hàng.');
        }
        if (order.status === 'paid') {
            return { received: true };
        }
        const existingEvent = await this.prisma.paymentEvent.findUnique({
            where: { id: event.id },
        });
        if (existingEvent) {
            return { received: true };
        }
        const now = new Date();
        const currentFeatured = order.job.featuredUntil && order.job.featuredUntil > now
            ? order.job.featuredUntil
            : now;
        const newFeaturedUntil = new Date(currentFeatured.getTime() + order.days * 24 * 60 * 60 * 1000);
        await this.prisma.$transaction([
            this.prisma.paymentEvent.create({
                data: {
                    id: event.id,
                    orderId: order.id,
                },
            }),
            this.prisma.order.update({
                where: { id: order.id },
                data: {
                    status: 'paid',
                    paidAt: now,
                },
            }),
            this.prisma.job.update({
                where: { id: order.jobId },
                data: {
                    featuredUntil: newFeaturedUntil,
                },
            }),
        ]);
        await this.notificationsService.notify(order.company.ownerId, 'payment', 'Gói tin nổi bật đã được kích hoạt', 'Xem chi tiết trong mục Dịch vụ tuyển dụng.', '/workspace/services', `payment:${order.id}`);
        return { received: true };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map
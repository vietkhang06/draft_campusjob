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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const files_service_1 = require("../files/files.service");
const notifications_service_1 = require("../notifications/notifications.service");
const audit_service_1 = require("../audit/audit.service");
let CompaniesService = class CompaniesService {
    prisma;
    filesService;
    notificationsService;
    auditService;
    constructor(prisma, filesService, notificationsService, auditService) {
        this.prisma = prisma;
        this.filesService = filesService;
        this.notificationsService = notificationsService;
        this.auditService = auditService;
    }
    async getPublicCompanies(q) {
        const search = q ? q.trim() : '';
        const companies = await this.prisma.company.findMany({
            where: {
                status: 'active',
                ...(search
                    ? {
                        OR: [
                            { name: { contains: search, mode: 'insensitive' } },
                            { industry: { contains: search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
            },
            include: {
                jobs: {
                    where: {
                        status: 'open',
                        deadline: { gt: new Date() },
                    },
                    select: { id: true },
                },
                reviews: {
                    where: { hidden: false },
                    select: { rating: true },
                },
            },
            orderBy: { name: 'asc' },
            take: 500,
        });
        return companies.map((c) => {
            const openJobs = c.jobs.length;
            const rating = c.reviews.length > 0
                ? c.reviews.reduce((acc, r) => acc + r.rating, 0) / c.reviews.length
                : null;
            const { jobs, reviews, ...rest } = c;
            return {
                ...rest,
                open_jobs: openJobs,
                rating,
            };
        });
    }
    async getPublicCompany(id) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                branches: true,
                reviews: {
                    where: { hidden: false },
                    include: {
                        student: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 100,
                },
            },
        });
        if (!company || company.status !== 'active') {
            throw new common_1.NotFoundException('Doanh nghiệp chưa công khai hoặc đã bị đình chỉ.');
        }
        const reviews = company.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            reply: r.reply,
            created: r.createdAt.toISOString(),
            student_name: r.student.name,
        }));
        const rating = reviews.length > 0
            ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
            : null;
        return {
            id: company.id,
            name: company.name,
            address: company.address,
            website: company.website,
            industry: company.industry,
            size: company.size,
            description: company.description,
            status: company.status,
            flag: company.flag,
            created: company.createdAt.toISOString(),
            branches: company.branches,
            reviews,
            rating,
        };
    }
    async getEmployerCompany(userId) {
        return this.prisma.company.findUnique({
            where: { ownerId: userId },
        });
    }
    async createOrUpdateCompany(userId, data) {
        const existing = await this.prisma.company.findUnique({
            where: { ownerId: userId },
        });
        if (existing?.status === 'suspended') {
            throw new common_1.ForbiddenException('Doanh nghiệp đã bị đình chỉ hoạt động.');
        }
        const tax = String(data.tax || '').trim();
        if (!/^\d{10}(-?\d{3})?$/.test(tax)) {
            throw new common_1.BadRequestException('Mã số thuế gồm 10 hoặc 13 chữ số.');
        }
        if (data.license) {
            await this.filesService.checkOwnership(data.license, userId, 'license');
        }
        const companyData = {
            name: String(data.name || '').trim().slice(0, 200),
            tax,
            address: String(data.address || '').trim().slice(0, 500),
            phone: String(data.phone || '').trim().slice(0, 30),
            email: String(data.email || '').trim().toLowerCase().slice(0, 254),
            website: data.website ? String(data.website).trim().slice(0, 2000) : null,
            industry: String(data.industry || '').trim().slice(0, 100),
            size: String(data.size || '').trim().slice(0, 100),
            hr: String(data.hr || '').trim().slice(0, 120),
            description: typeof data.description === 'string' ? data.description.trim().slice(0, 5000) : '',
            license: data.license || null,
            status: 'pending',
            reason: null,
        };
        let company;
        if (existing) {
            company = await this.prisma.company.update({
                where: { id: existing.id },
                data: companyData,
            });
        }
        else {
            company = await this.prisma.company.create({
                data: {
                    ...companyData,
                    ownerId: userId,
                },
            });
        }
        await this.auditService.log('company', company.id, 'submit_verification', {}, userId);
        await this.notificationsService.notifyStaff('moderation', 'Doanh nghiệp chờ xác thực', company.name);
        return { id: company.id };
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        files_service_1.FilesService,
        notifications_service_1.NotificationsService,
        audit_service_1.AuditService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const admin_service_1 = require("./admin.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const common_1 = require("@nestjs/common");
describe('AdminService & Role Elevation (Unit Tests)', () => {
    let service;
    let prisma;
    let auditService;
    beforeEach(async () => {
        prisma = {
            user: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            company: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            report: {
                findUnique: jest.fn(),
                update: jest.fn(),
            },
            sanction: {
                create: jest.fn(),
            },
            $transaction: jest.fn(async (cb) => cb(prisma)),
        };
        auditService = {
            log: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                admin_service_1.AdminService,
                { provide: prisma_service_1.PrismaService, useValue: prisma },
                { provide: audit_service_1.AuditService, useValue: auditService },
                { provide: notifications_service_1.NotificationsService, useValue: { create: jest.fn() } },
            ],
        }).compile();
        service = module.get(admin_service_1.AdminService);
    });
    it('18. should reject elevating user to admin or invalid role', async () => {
        prisma.user.findUnique.mockResolvedValue({ id: 'target-id', role: 'student', email: 's@campus.vn' });
        await expect(service.changeUserRole('target-id', 'admin-id', 'admin')).rejects.toThrow(common_1.BadRequestException);
    });
    it('19. should allow Admin to grant and revoke moderator role with audit logging', async () => {
        prisma.user.findUnique.mockResolvedValue({
            id: 'target-id',
            role: 'student',
            name: 'Nguyen Van A',
            email: 'student@campus.vn',
        });
        prisma.user.update.mockResolvedValue({
            id: 'target-id',
            role: 'moderator',
        });
        const grantRes = await service.changeUserRole('target-id', 'admin-id', 'moderator');
        expect(grantRes.ok).toBe(true);
        expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'target-id' },
            data: expect.objectContaining({ role: 'moderator' }),
        }));
        expect(auditService.log).toHaveBeenCalledWith('user', 'target-id', 'role', expect.objectContaining({ role: 'moderator' }), 'admin-id');
        prisma.user.findUnique.mockResolvedValue({
            id: 'target-id',
            role: 'moderator',
            name: 'Nguyen Van A',
            email: 'student@campus.vn',
        });
        prisma.user.update.mockResolvedValue({
            id: 'target-id',
            role: 'student',
        });
        const revokeRes = await service.changeUserRole('target-id', 'admin-id', 'student');
        expect(revokeRes.ok).toBe(true);
    });
});
//# sourceMappingURL=admin.service.spec.js.map
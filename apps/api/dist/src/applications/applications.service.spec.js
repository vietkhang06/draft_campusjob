"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const applications_service_1 = require("./applications.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const notifications_service_1 = require("../notifications/notifications.service");
const common_1 = require("@nestjs/common");
describe('ApplicationsService & Business Workflow Rules (Unit Tests)', () => {
    let service;
    let prisma;
    let auditService;
    let notificationsService;
    const validStudentUser = {
        id: 'student-id',
        role: 'student',
        profile: {
            school: 'Đại học Quốc Gia',
            major: 'Công nghệ thông tin',
        },
    };
    beforeEach(async () => {
        prisma = {
            job: {
                findUnique: jest.fn(),
            },
            user: {
                findUnique: jest.fn(),
            },
            cv: {
                findUnique: jest.fn(),
            },
            cV: {
                findFirst: jest.fn(),
                findUnique: jest.fn(),
            },
            application: {
                count: jest.fn(),
                findFirst: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
            },
            applicationHistory: {
                create: jest.fn(),
            },
            $transaction: jest.fn(async (cb) => cb(prisma)),
        };
        auditService = {
            log: jest.fn(),
        };
        notificationsService = {
            create: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                applications_service_1.ApplicationsService,
                { provide: prisma_service_1.PrismaService, useValue: prisma },
                { provide: audit_service_1.AuditService, useValue: auditService },
                { provide: notifications_service_1.NotificationsService, useValue: notificationsService },
            ],
        }).compile();
        service = module.get(applications_service_1.ApplicationsService);
    });
    it('20. should enforce that student can only apply using their OWN CV', async () => {
        prisma.job.findUnique.mockResolvedValue({
            id: 'job-1',
            status: 'open',
            deadline: new Date(Date.now() + 1000000),
            company: { ownerId: 'employer-owner-id', name: 'Tech Corp' },
        });
        prisma.user.findUnique.mockResolvedValue({ id: 'student-id', lockedUntil: null });
        prisma.application.count.mockResolvedValue(2);
        prisma.application.findFirst.mockResolvedValue(null);
        prisma.cV.findFirst.mockResolvedValue(null);
        await expect(service.apply('student-id', validStudentUser, { job: 'job-1', cv: 'cv-someone-else' })).rejects.toThrow(common_1.BadRequestException);
    });
    it('21. should reject application if student has reached active quota of 5', async () => {
        prisma.job.findUnique.mockResolvedValue({
            id: 'job-1',
            status: 'open',
            deadline: new Date(Date.now() + 1000000),
            company: { ownerId: 'employer-id', name: 'Tech Corp' },
        });
        prisma.user.findUnique.mockResolvedValue({ id: 'student-id', lockedUntil: null });
        prisma.application.count.mockResolvedValue(5);
        await expect(service.apply('student-id', validStudentUser, { job: 'job-1', cv: 'my-cv' })).rejects.toThrow(common_1.BadRequestException);
    });
    it('21b. should reject application if student account is locked by admin', async () => {
        prisma.job.findUnique.mockResolvedValue({
            id: 'job-1',
            status: 'open',
            deadline: new Date(Date.now() + 1000000),
            company: { ownerId: 'employer-id', name: 'Tech Corp', status: 'active' },
        });
        prisma.user.findUnique.mockResolvedValue({
            id: 'student-id',
            lockedUntil: new Date(Date.now() + 86400000),
        });
        prisma.cV.findFirst.mockResolvedValue({
            id: 'my-cv',
            studentId: 'student-id',
            name: 'My CV',
            data: {},
        });
        await expect(service.apply('student-id', validStudentUser, { job: 'job-1', cv: 'my-cv' })).rejects.toThrow(common_1.ForbiddenException);
    });
    it('21c. should reject application if job deadline has passed', async () => {
        prisma.job.findUnique.mockResolvedValue({
            id: 'expired-job',
            status: 'open',
            deadline: new Date(Date.now() - 10000),
            company: { ownerId: 'employer-id', name: 'Tech Corp' },
        });
        prisma.user.findUnique.mockResolvedValue({ id: 'student-id', lockedUntil: null });
        prisma.cV.findFirst.mockResolvedValue({
            id: 'my-cv',
            studentId: 'student-id',
            name: 'My CV',
            data: {},
        });
        await expect(service.apply('student-id', validStudentUser, { job: 'expired-job', cv: 'my-cv' })).rejects.toThrow(common_1.ConflictException);
    });
});
//# sourceMappingURL=applications.service.spec.js.map
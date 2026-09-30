import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('ApplicationsService & Business Workflow Rules (Unit Tests)', () => {
  let service: ApplicationsService;
  let prisma: any;
  let auditService: any;
  let notificationsService: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
  });

  // 20. Ownership của CV & Job khi nộp đơn
  it('20. should enforce that student can only apply using their OWN CV', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'open',
      deadline: new Date(Date.now() + 1000000),
      company: { ownerId: 'employer-owner-id', name: 'Tech Corp' },
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'student-id', lockedUntil: null });
    prisma.application.count.mockResolvedValue(2); // < 5
    prisma.application.findFirst.mockResolvedValue(null);

    // CV belongs to someone else (not found for student-id)
    prisma.cV.findFirst.mockResolvedValue(null);

    await expect(
      service.apply(
        'student-id',
        validStudentUser,
        { job: 'job-1', cv: 'cv-someone-else' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  // 21. Luồng nghiệp vụ: Sinh viên tối đa 5 hồ sơ đang xử lý (pending, viewed, interview)
  it('21. should reject application if student has reached active quota of 5', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'open',
      deadline: new Date(Date.now() + 1000000),
      company: { ownerId: 'employer-id', name: 'Tech Corp' },
    });
    prisma.user.findUnique.mockResolvedValue({ id: 'student-id', lockedUntil: null });
    // Active count = 5
    prisma.application.count.mockResolvedValue(5);

    await expect(
      service.apply(
        'student-id',
        validStudentUser,
        { job: 'job-1', cv: 'my-cv' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('21b. should reject application if student account is locked by admin', async () => {
    prisma.job.findUnique.mockResolvedValue({
      id: 'job-1',
      status: 'open',
      deadline: new Date(Date.now() + 1000000),
      company: { ownerId: 'employer-id', name: 'Tech Corp', status: 'active' },
    });
    // User is locked until tomorrow
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

    await expect(
      service.apply(
        'student-id',
        validStudentUser,
        { job: 'job-1', cv: 'my-cv' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('21c. should reject application if job deadline has passed', async () => {
    // Deadline in the past
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

    await expect(
      service.apply(
        'student-id',
        validStudentUser,
        { job: 'expired-job', cv: 'my-cv' },
      ),
    ).rejects.toThrow(ConflictException);
  });
});

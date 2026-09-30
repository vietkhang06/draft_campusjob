import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

describe('AdminService & Role Elevation (Unit Tests)', () => {
  let service: AdminService;
  let prisma: any;
  let auditService: any;

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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  // 18. Moderator không cấp role admin
  it('18. should reject elevating user to admin or invalid role', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'target-id', role: 'student', email: 's@campus.vn' });

    await expect(
      service.changeUserRole('target-id', 'admin-id', 'admin'),
    ).rejects.toThrow(BadRequestException);
  });

  // 19. Admin cấp/thu hồi moderator
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

    // Grant moderator
    const grantRes = await service.changeUserRole('target-id', 'admin-id', 'moderator');

    expect(grantRes.ok).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'target-id' },
        data: expect.objectContaining({ role: 'moderator' }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      'user',
      'target-id',
      'role',
      expect.objectContaining({ role: 'moderator' }),
      'admin-id',
    );

    // Revoke moderator (switch back to student)
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

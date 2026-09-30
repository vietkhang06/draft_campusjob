import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { AuditService } from '../audit/audit.service';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AllowedRegisterRole } from './dto/register.dto';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let mailService: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      authSession: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      emailVerificationToken: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      passwordResetToken: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(async (args) =>
        Array.isArray(args) ? Promise.all(args) : typeof args === 'function' ? args(prisma) : args,
      ),
    };

    jwtService = {
      sign: jest.fn(() => 'mock_access_token'),
    };

    mailService = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    auditService = {
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: MailService, useValue: mailService },
        { provide: AuditService, useValue: auditService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def: any) => {
              if (key === 'refreshTokenTtlDays') return 30;
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // 1. Đăng ký student thành công
  it('1. should register student successfully', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'student-uuid',
      email: 'student@example.com',
      name: 'Nguyen Van A',
      role: 'student',
      status: 'pending_verification',
    });

    const result = await service.register({
      email: 'student@example.com',
      password: 'StrongPassword123!',
      name: 'Nguyen Van A',
      role: AllowedRegisterRole.STUDENT,
    });

    expect(result.message).toContain('thành công');
    expect(prisma.user.create).toHaveBeenCalled();
    expect(mailService.sendVerificationEmail).toHaveBeenCalled();
  });

  // 2. Đăng ký employer thành công
  it('2. should register employer successfully', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'employer-uuid',
      email: 'employer@company.com',
      name: 'HR Manager',
      role: 'employer',
      status: 'pending_verification',
    });

    const result = await service.register({
      email: 'employer@company.com',
      password: 'StrongPassword123!',
      name: 'HR Manager',
      role: AllowedRegisterRole.EMPLOYER,
    });

    expect(result.message).toContain('thành công');
    expect(prisma.user.create).toHaveBeenCalled();
  });

  // 3. Từ chối đăng ký moderator/admin
  it('3. should reject registration with role moderator or admin', async () => {
    await expect(
      service.register({
        email: 'hacker@example.com',
        password: 'StrongPassword123!',
        name: 'Hacker',
        role: 'admin' as any,
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.register({
        email: 'hacker2@example.com',
        password: 'StrongPassword123!',
        name: 'Hacker 2',
        role: 'moderator' as any,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 4. Từ chối email trùng
  it('4. should reject registration if email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing-id', email: 'duplicate@example.com' });

    await expect(
      service.register({
        email: 'duplicate@example.com',
        password: 'StrongPassword123!',
        name: 'Nguyen Van B',
        role: AllowedRegisterRole.STUDENT,
      }),
    ).rejects.toThrow(ConflictException);
  });

  // 5. Từ chối mật khẩu yếu
  it('5. should reject weak passwords during registration', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    // Too short
    await expect(
      service.register({
        email: 'weak1@example.com',
        password: 'Abc1!',
        name: 'Weak Pass',
        role: AllowedRegisterRole.STUDENT,
      }),
    ).rejects.toThrow(BadRequestException);

    // Missing special character
    await expect(
      service.register({
        email: 'weak2@example.com',
        password: 'StrongPassword123',
        name: 'Weak Pass',
        role: AllowedRegisterRole.STUDENT,
      }),
    ).rejects.toThrow(BadRequestException);

    // Missing uppercase
    await expect(
      service.register({
        email: 'weak3@example.com',
        password: 'strongpassword123!',
        name: 'Weak Pass',
        role: AllowedRegisterRole.STUDENT,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  // 6. Đăng nhập đúng
  it('6. should login successfully with valid credentials', async () => {
    const passwordHash = await argon2.hash('StrongPassword123!', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-uuid',
      email: 'user@example.com',
      passwordHash,
      name: 'Nguyen Van A',
      role: 'student',
      status: 'active',
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    prisma.authSession.create.mockResolvedValue({ id: 'session-id' });

    const result = await service.login(
      { email: 'user@example.com', password: 'StrongPassword123!' },
      'user-agent',
      '127.0.0.1',
    );

    expect(result.accessToken).toBe('mock_access_token');
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('user@example.com');
  });

  // 7. Đăng nhập sai mật khẩu
  it('7. should fail login with incorrect password and increment failed attempts', async () => {
    const passwordHash = await argon2.hash('CorrectPassword123!', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-uuid',
      email: 'user@example.com',
      passwordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
      status: 'active',
    });

    await expect(
      service.login(
        { email: 'user@example.com', password: 'WrongPassword123!' },
        'user-agent',
        '127.0.0.1',
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-uuid' },
        data: expect.objectContaining({ failedLoginAttempts: 1 }),
      }),
    );
  });

  // 8. Tài khoản chưa xác minh
  it('8. should reject login if account is pending verification', async () => {
    const passwordHash = await argon2.hash('CorrectPassword123!', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-uuid',
      email: 'unverified@example.com',
      passwordHash,
      status: 'pending_verification',
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await expect(
      service.login(
        { email: 'unverified@example.com', password: 'CorrectPassword123!' },
        'user-agent',
        '127.0.0.1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  // 9. Khóa tạm sau 5 lần thất bại
  it('9. should temporarily lock account after 5 consecutive failed logins', async () => {
    const passwordHash = await argon2.hash('CorrectPassword123!', { type: argon2.argon2id });
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-uuid',
      email: 'user@example.com',
      passwordHash,
      failedLoginAttempts: 4, // 5th attempt
      lockedUntil: null,
      status: 'active',
    });

    await expect(
      service.login(
        { email: 'user@example.com', password: 'WrongPassword123!' },
        'user-agent',
        '127.0.0.1',
      ),
    ).rejects.toThrow(ForbiddenException);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedLoginAttempts: 5,
          lockedUntil: expect.any(Date),
        }),
      }),
    );
  });

  // 10. Refresh token rotation
  it('10. should rotate refresh token and return new token pair', async () => {
    const session = {
      id: 'session-id',
      userId: 'user-uuid',
      tokenFamily: 'family-123',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 1000000),
      user: {
        id: 'user-uuid',
        email: 'user@example.com',
        role: 'student',
        status: 'active',
        name: 'Nguyen Van A',
      },
    };
    prisma.authSession.findFirst.mockResolvedValue(session);
    prisma.user.findUnique.mockResolvedValue(session.user);
    prisma.authSession.create.mockResolvedValue({ id: 'new-session-id' });

    const result = await service.refresh('old_raw_refresh_token', 'agent', 'ip');

    expect(result.accessToken).toBe('mock_access_token');
    expect(result.refreshToken).toBeDefined();
    // Old session revoked
    expect(prisma.authSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'session-id' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
    // New session created in same family
    expect(prisma.authSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ tokenFamily: 'family-123' }),
      }),
    );
  });

  // 11. Từ chối refresh token đã thu hồi và thu hồi token family
  it('11. should detect reused revoked token and revoke entire token family', async () => {
    const revokedSession = {
      id: 'revoked-session-id',
      userId: 'user-uuid',
      tokenFamily: 'family-hijacked',
      revokedAt: new Date(Date.now() - 5000), // already revoked!
      expiresAt: new Date(Date.now() + 1000000),
      user: { id: 'user-uuid' },
    };
    prisma.authSession.findFirst.mockResolvedValue(revokedSession);

    await expect(service.refresh('reused_revoked_token')).rejects.toThrow(UnauthorizedException);

    // Entire token family should be revoked
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { tokenFamily: 'family-hijacked' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  // 12. Logout
  it('12. should logout current session by revoking it', async () => {
    prisma.authSession.findFirst.mockResolvedValue({ id: 'session-id' });

    await service.logout('current_refresh_token');

    expect(prisma.authSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  // 13. Logout-all
  it('13. should logout all user sessions', async () => {
    await service.logoutAll('user-uuid');

    expect(prisma.authSession.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-uuid', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  // 14. Quên và đặt lại mật khẩu
  it('14. should handle forgot password without email enumeration and reset password successfully', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-uuid',
      email: 'user@example.com',
      status: 'active',
    });

    const forgotRes = await service.forgotPassword('user@example.com');
    expect(forgotRes.message).toContain('hộp thư');
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();

    // Now reset password
    prisma.passwordResetToken.findFirst.mockResolvedValue({
      id: 'token-id',
      userId: 'user-uuid',
      expiresAt: new Date(Date.now() + 100000),
      usedAt: null,
    });

    const resetRes = await service.resetPassword({
      token: 'raw_valid_token',
      password: 'BrandNewPassword123!',
    });

    expect(resetRes.message).toContain('thành công');
    expect(prisma.user.update).toHaveBeenCalled();
    // Tokens used
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'token-id' },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      }),
    );
    // Old sessions revoked
    expect(prisma.authSession.updateMany).toHaveBeenCalled();
  });

  // 15. Token reset hết hạn hoặc dùng lại
  it('15. should reject expired or already used password reset token', async () => {
    // Already used token
    prisma.passwordResetToken.findFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'already_used_or_expired_token',
        password: 'BrandNewPassword123!',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

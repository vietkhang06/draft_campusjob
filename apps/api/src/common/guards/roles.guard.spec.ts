import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@campusjob/contracts';

describe('RolesGuard & Access Control Matrix (Unit Tests)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const mockExecutionContext = (user: any): ExecutionContext => {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  // 16. Student không truy cập endpoint employer
  it('16. should forbid student from accessing employer-only endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['employer']);

    const studentCtx = mockExecutionContext({ id: 's1', role: 'student' });
    expect(() => guard.canActivate(studentCtx)).toThrow(ForbiddenException);

    const employerCtx = mockExecutionContext({ id: 'e1', role: 'employer' });
    expect(guard.canActivate(employerCtx)).toBe(true);
  });

  // 17. Employer không truy cập endpoint moderator
  it('17. should forbid employer from accessing moderator endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['moderator', 'admin']);

    const employerCtx = mockExecutionContext({ id: 'e1', role: 'employer' });
    expect(() => guard.canActivate(employerCtx)).toThrow(ForbiddenException);

    const modCtx = mockExecutionContext({ id: 'm1', role: 'moderator' });
    expect(guard.canActivate(modCtx)).toBe(true);

    const adminCtx = mockExecutionContext({ id: 'a1', role: 'admin' });
    expect(guard.canActivate(adminCtx)).toBe(true);
  });
});

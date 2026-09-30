"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const core_1 = require("@nestjs/core");
const roles_guard_1 = require("./roles.guard");
const common_1 = require("@nestjs/common");
describe('RolesGuard & Access Control Matrix (Unit Tests)', () => {
    let guard;
    let reflector;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                roles_guard_1.RolesGuard,
                {
                    provide: core_1.Reflector,
                    useValue: {
                        getAllAndOverride: jest.fn(),
                    },
                },
            ],
        }).compile();
        guard = module.get(roles_guard_1.RolesGuard);
        reflector = module.get(core_1.Reflector);
    });
    const mockExecutionContext = (user) => {
        return {
            getHandler: () => ({}),
            getClass: () => ({}),
            switchToHttp: () => ({
                getRequest: () => ({ user }),
            }),
        };
    };
    it('16. should forbid student from accessing employer-only endpoints', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['employer']);
        const studentCtx = mockExecutionContext({ id: 's1', role: 'student' });
        expect(() => guard.canActivate(studentCtx)).toThrow(common_1.ForbiddenException);
        const employerCtx = mockExecutionContext({ id: 'e1', role: 'employer' });
        expect(guard.canActivate(employerCtx)).toBe(true);
    });
    it('17. should forbid employer from accessing moderator endpoints', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['moderator', 'admin']);
        const employerCtx = mockExecutionContext({ id: 'e1', role: 'employer' });
        expect(() => guard.canActivate(employerCtx)).toThrow(common_1.ForbiddenException);
        const modCtx = mockExecutionContext({ id: 'm1', role: 'moderator' });
        expect(guard.canActivate(modCtx)).toBe(true);
        const adminCtx = mockExecutionContext({ id: 'a1', role: 'admin' });
        expect(guard.canActivate(adminCtx)).toBe(true);
    });
});
//# sourceMappingURL=roles.guard.spec.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://campusjob:campusjob@localhost:5432/campusjob';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_jwt_access_secret_1234567890';
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require('supertest');
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
const http_exception_filter_1 = require("../src/common/filters/http-exception.filter");
const cookieParser = require('cookie-parser');
describe('CampusJob API (e2e)', () => {
    let app;
    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://campusjob:campusjob@localhost:5432/campusjob';
        process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_jwt_secret_key_1234567890';
        const mockPrisma = {
            $connect: jest.fn().mockResolvedValue(undefined),
            $disconnect: jest.fn().mockResolvedValue(undefined),
            user: {
                findFirst: jest.fn().mockResolvedValue(null),
                findUnique: jest.fn().mockResolvedValue(null),
            },
            auditLog: {
                create: jest.fn().mockResolvedValue({}),
            },
        };
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrisma)
            .compile();
        app = moduleFixture.createNestApplication({ rawBody: true });
        app.setGlobalPrefix('api/v1');
        app.use(cookieParser());
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            transform: true,
        }));
        app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
        await app.init();
    });
    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });
    it('GET /api/v1/health should return ok status', async () => {
        const res = await request(app.getHttpServer()).get('/api/v1/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.timestamp).toBeDefined();
    });
    it('GET /api/v1/session should return system flags', async () => {
        const res = await request(app.getHttpServer()).get('/api/v1/session');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body).toHaveProperty('setupRequired');
        expect(res.body).toHaveProperty('emailConfigured');
        expect(res.body).toHaveProperty('paymentConfigured');
    });
    it('should return unified error format on invalid request', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({ email: 'not-an-email', password: '123' });
        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('statusCode', 400);
        expect(res.body).toHaveProperty('code');
        expect(res.body).toHaveProperty('message');
    });
    it('GET /api/v1/admin/overview should reject unauthenticated request with 401', async () => {
        const res = await request(app.getHttpServer()).get('/api/v1/admin/overview');
        expect(res.status).toBe(401);
        expect(res.body.statusCode).toBe(401);
    });
});
//# sourceMappingURL=app.e2e-spec.js.map
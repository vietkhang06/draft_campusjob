import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://campusjob:campusjob@localhost:5432/campusjob';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_jwt_access_secret_1234567890';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cookieParser = require('cookie-parser');

describe('CampusJob API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Set test env
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication({ rawBody: true });
    app.setGlobalPrefix('api/v1');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // Health check
  it('GET /api/v1/health should return ok status', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  // Public Session
  it('GET /api/v1/session should return system flags', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/session');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('setupRequired');
    expect(res.body).toHaveProperty('emailConfigured');
    expect(res.body).toHaveProperty('paymentConfigured');
  });

  // Error format structure verification: { statusCode, code, message, details? }
  it('should return unified error format on invalid request', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('statusCode', 400);
    expect(res.body).toHaveProperty('code');
    expect(res.body).toHaveProperty('message');
  });

  // Role Guard rejection (401 unauthenticated on protected routes)
  it('GET /api/v1/admin/overview should reject unauthenticated request with 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/admin/overview');
    expect(res.status).toBe(401);
    expect(res.body.statusCode).toBe(401);
  });
});

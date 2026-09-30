import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('--- Đang khởi tạo dữ liệu mẫu (Database Seeding) ---');

  // 1. Tạo tài khoản Admin mặc định cố định
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@campusjob.vn';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@12345678';
  const adminName = process.env.ADMIN_DEFAULT_NAME || 'System Admin';

  const passwordHash = await argon2.hash(adminPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const now = new Date();

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: 'admin' as UserRole,
      status: 'active' as UserStatus,
      emailVerifiedAt: now,
      profile: {
        title: 'Quản trị viên hệ thống',
        department: 'Ban Quản trị CampusJob',
      },
    },
    update: {
      name: adminName,
      passwordHash,
      role: 'admin' as UserRole,
      status: 'active' as UserStatus,
      emailVerifiedAt: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  console.log(`[Seed] Tài khoản Admin mặc định:`);
  console.log(`       - Email   : ${admin.email}`);
  console.log(`       - Mật khẩu: ${adminPassword}`);
  console.log(`       - Vai trò : ${admin.role}`);
  console.log(`       - Tên     : ${admin.name}`);

  console.log('--- Hoàn tất Seeding thành công! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

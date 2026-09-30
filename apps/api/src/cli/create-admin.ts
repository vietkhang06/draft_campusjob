import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const prisma = new PrismaClient();

function getArg(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && index + 1 < process.argv.length) {
    return process.argv[index + 1];
  }
  return null;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function promptHidden(query: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const onData = (char: any) => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.pause();
          break;
        default:
          process.stdout.write('\x1B[2K\x1B[200D' + query + Array(rl.line.length + 1).join('*'));
          break;
      }
    };

    process.stdin.on('data', onData);

    rl.question(query, (value) => {
      process.stdin.removeListener('data', onData);
      rl.close();
      console.log('');
      resolve(value.trim());
    });
  });
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    console.log(`
Cách sử dụng: pnpm admin:create --email <email> [--name <name>] [--password <password>] [--force]

Tham số:
  --email <email>         Địa chỉ email của Quản trị viên (bắt buộc)
  --name <name>           Họ tên hiển thị (mặc định: System Admin)
  --password <password>   Mật khẩu (nếu bỏ trống sẽ prompt bảo mật từ terminal hoặc đọc ADMIN_BOOTSTRAP_PASSWORD)
  --force                 Cho phép tạo thêm/ghi đè nếu hệ thống đã có admin
  --help, -h              Hiển thị hướng dẫn sử dụng
    `);
    process.exit(0);
  }

  const email = (getArg('--email') || '').trim().toLowerCase();
  const name = (getArg('--name') || 'System Admin').trim();
  const force = hasFlag('--force');

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('Lỗi: Vui lòng cung cấp email hợp lệ bằng tham số --email <email>.');
    process.exit(1);
  }

  // Check existing admin
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (existingAdmin && !force) {
    console.error('Lỗi: Hệ thống đã có Quản trị viên tồn tại.');
    console.error('Sử dụng thêm cờ --force nếu bạn muốn ghi đè hoặc tạo thêm tài khoản quản trị.');
    process.exit(1);
  }

  let password = getArg('--password') || process.env.ADMIN_BOOTSTRAP_PASSWORD || '';
  if (!password) {
    password = await promptHidden('Nhập mật khẩu cho Quản trị viên (tối thiểu 10 ký tự): ');
  }

  if (
    password.length < 10 ||
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/.test(password)
  ) {
    console.error('Lỗi: Mật khẩu phải có tối thiểu 10 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.');
    process.exit(1);
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const now = new Date();

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name,
      passwordHash,
      role: 'admin' as UserRole,
      status: 'active' as UserStatus,
      emailVerifiedAt: now,
      profile: {},
    },
    update: {
      name,
      passwordHash,
      role: 'admin' as UserRole,
      status: 'active' as UserStatus,
      emailVerifiedAt: now,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.history.create({
    data: {
      entity: 'user',
      entityId: user.id,
      action: 'bootstrap_admin',
      actor: 'cli',
      detail: { email: user.email, name: user.name, forced: force },
    },
  });

  console.log(`Thành công: Quản trị viên "${user.name}" (${user.email}) đã được thiết lập thành công.`);
}

main()
  .catch((err) => {
    console.error('Lỗi khi thiết lập Quản trị viên:', err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

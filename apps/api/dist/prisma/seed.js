"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const argon2 = __importStar(require("argon2"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('--- Đang khởi tạo dữ liệu mẫu (Database Seeding) ---');
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
            role: 'admin',
            status: 'active',
            emailVerifiedAt: now,
            profile: {
                title: 'Quản trị viên hệ thống',
                department: 'Ban Quản trị CampusJob',
            },
        },
        update: {
            name: adminName,
            passwordHash,
            role: 'admin',
            status: 'active',
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
//# sourceMappingURL=seed.js.map
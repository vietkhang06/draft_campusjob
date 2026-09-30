# Tài liệu Di chuyển Cơ sở dữ liệu: Cloudflare D1 / SQLite sang PostgreSQL

Tài liệu này mô tả chi tiết chiến lược, cấu trúc schema và quy trình di chuyển dữ liệu từ hệ thống Cloudflare D1 (SQLite) cũ sang cơ sở dữ liệu PostgreSQL mới sử dụng Prisma ORM cho CampusJob.

---

## 1. Mục tiêu và Nguyên tắc

1. **Bảo toàn dữ liệu nghiệp vụ:** Bảo đảm toàn bộ 23 thực thể nghiệp vụ (users, companies, branches, jobs, cvs, applications, interviews, messages, reviews, reports, sanctions, subscriptions, orders, audit/history, v.v.) được chuyển đổi nguyên vẹn cấu trúc và quan hệ.
2. **Tương thích người dùng cũ:**
   - Người dùng cũ được xác thực thông qua ChatGPT SSO không có mật khẩu nội bộ.
   - Cột `passwordHash` trong bảng `users` cho phép `nullable` trong giai đoạn chuyển đổi.
   - Hệ thống **không gán mật khẩu mặc định** ngẫu nhiên hoặc hard-code.
   - Tài khoản người dùng cũ bắt buộc phải sử dụng luồng **"Quên mật khẩu / Thiết lập mật khẩu"** (`POST /api/v1/auth/forgot-password` -> email xác minh -> `POST /api/v1/auth/reset-password`) để tạo mật khẩu trước khi đăng nhập bằng email & password.
   - Sau khi hoàn thành toàn bộ chuyển đổi tài khoản, trường `passwordHash` sẽ được chuyển sang `NOT NULL`.
3. **Mã hóa và An toàn:**
   - Mật khẩu mới được băm bằng thuật toán **Argon2id**.
   - Token xác minh email, token đặt lại mật khẩu và refresh token chỉ được lưu trữ dưới dạng băm SHA-256 (`tokenHash`).
4. **Định dạng UUID & UTC:**
   - Toàn bộ khóa chính ID chuyển sang UUID v4.
   - Toàn bộ dấu thời gian (`createdAt`, `updatedAt`, `deadline`, v.v.) chuẩn hóa lưu theo múi giờ UTC.
5. **Thực thi script độc lập:**
   - Script import chạy thủ công bằng CLI qua lệnh chuyên biệt, có cơ chế Transaction và Rollback khi có lỗi.
   - **Tuyệt đối không chạy tự động khi khởi động server.**

---

## 2. Bảng đối chiếu kiểu dữ liệu (SQLite D1 -> PostgreSQL)

| Đặc tả | SQLite D1 (Cũ) | PostgreSQL Prisma (Mới) | Ghi chú |
|---|---|---|---|
| Khóa chính ID | `TEXT PRIMARY KEY` | `String @id @default(uuid())` | UUID chuẩn |
| Chuỗi văn bản ngắn | `TEXT` | `String` / `VarChar` | |
| Văn bản dài / Nội dung | `TEXT` | `String @db.Text` | Mô tả, thư xin việc, log |
| Dữ liệu JSON | `TEXT` (JSON string) | `Json` | Postgres Native JSONB |
| Số nguyên | `INTEGER` | `Int` | |
| Số thực / Điểm / Khoảng cách | `REAL` | `Float` | Tọa độ GPS, điểm rating |
| Boolean | `INTEGER` (0 / 1) | `Boolean` | |
| Ngày giờ | `TEXT` / `INTEGER` (ms) | `DateTime @default(now())` | Chuẩn hóa UTC ISO 8601 |
| Vai trò người dùng | `TEXT` | `Enum UserRole` | `student`, `employer`, `moderator`, `admin` |
| Trạng thái người dùng | `TEXT` | `Enum UserStatus` | `pending_verification`, `active`, `suspended`, `locked` |

---

## 3. Cấu trúc Schema Mới trên PostgreSQL

### 3.1. Các bảng xác thực & bảo mật mở rộng:
- `users`: Bổ sung `passwordHash` (nullable), `status`, `emailVerifiedAt`, `failedLoginAttempts`, `lockedUntil`, `lastLoginAt`, `updatedAt`.
- `auth_sessions`: Quản lý phiên đăng nhập, rotation refresh token theo `tokenFamily`, phát hiện reuse attack.
- `email_verification_tokens`: Lưu hash token xác minh email một lần có hạn dùng.
- `password_reset_tokens`: Lưu hash token đặt lại mật khẩu một lần có hạn dùng.

### 3.2. Toàn bộ 23 bảng nghiệp vụ:
- `companies`, `branches`
- `jobs`, `saved_jobs`
- `cvs`
- `applications`, `application_history`
- `interviews`
- `messages`
- `reviews`
- `reports`
- `sanctions`
- `mail_queue`
- `rate_limits`
- `subscription_plans`, `subscription_orders`
- `school_verifications`
- `audit` / `history`

---

## 4. Kịch bản Di chuyển (Migration Script)

Script di chuyển được cung cấp tại `scripts/migrate-d1-to-postgres.ts`.

### Quy trình chạy:
1. Export dữ liệu từ Cloudflare D1 thành file JSON hoặc SQL dump:
   ```bash
   wrangler d1 export campusjob-db --output ./dump-d1.sql
   ```
2. Chạy script import với transaction:
   ```bash
   pnpm --filter @campusjob/api run migrate:import --file ./dump-d1.json
   ```
3. Báo cáo bản ghi:
   - Script tự động validate schema từng dòng.
   - Báo cáo số lượng bản ghi thành công, trùng lặp hoặc bản ghi bị lỗi (nếu có).
   - Nếu xảy ra lỗi nghiêm trọng, transaction tự động `ROLLBACK` để tránh làm sai lệch dữ liệu.

---

## 5. Hướng dẫn Khởi tạo Database Trống

Khi triển khai trên môi trường mới (local hoặc production):
```bash
# 1. Khởi động hạ tầng PostgreSQL bằng Docker Compose
docker compose -f infra/docker-compose.yml up -d postgres

# 2. Chạy migration Prisma tạo bảng từ database trống
pnpm db:migrate

# 3. Tạo tài khoản Quản trị viên đầu tiên
pnpm admin:create --email admin@campusjob.vn --name "System Admin"
```

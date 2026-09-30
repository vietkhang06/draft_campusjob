# Báo Cáo Chẩn Đoán Hạ Tầng Local CampusJob (Local Infra Diagnosis)

Tài liệu này ghi nhận chi tiết quá trình chẩn đoán, nguyên nhân gốc rễ và giải pháp khắc phục sự cố khởi động hạ tầng local của CampusJob.

---

## Kiểm tra: Phiên bản Docker và Docker Compose

- Thời gian: 2026-09-27 12:39:53 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `docker version`, `docker compose version`, `docker context show`
- Exit code: 0
- Kết quả rút gọn: Docker Desktop 4.79.0 (Server version 29.5.3, Linux/amd64). Docker Compose v5.1.4. Context: desktop-linux.
- Kết luận: Docker engine và Docker Compose đang hoạt động bình thường trên máy chủ Windows.
- File liên quan: `infra/docker-compose.yml`
- Hành động đề xuất: Tiếp tục kiểm tra tính hợp lệ của cú pháp file docker-compose.

---

## Kiểm tra: Cú pháp và dịch vụ trong docker-compose.yml

- Thời gian: 2026-09-27 12:39:58 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `docker compose -f infra/docker-compose.yml config --quiet`, `config --services`, `config --images`
- Exit code: 0
- Kết quả rút gọn: Services: `postgres`, `minio`, `minio-init`, `mailpit`. Images: `postgres:16-alpine`, `quay.io/minio/minio:RELEASE.2024-12-18T13-15-44Z`, `quay.io/minio/mc:RELEASE.2024-11-21T17-21-54Z`, `axllent/mailpit:v1.18`.
- Kết luận: Cú pháp Compose file hợp lệ.
- File liên quan: `infra/docker-compose.yml`
- Hành động đề xuất: Kiểm tra khả năng kết nối mạng và pull từng image độc lập.

---

## Kiểm tra: Kết nối mạng tới Registry (Docker Hub & Quay.io)

- Thời gian: 2026-09-27 12:40:14 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `Test-NetConnection quay.io -Port 443`, `Test-NetConnection registry-1.docker.io -Port 443`
- Exit code: 0
- Kết quả rút gọn: `quay.io:443` -> `TcpTestSucceeded: True`; `registry-1.docker.io:443` -> `TcpTestSucceeded: True`.
- Kết luận: Kết nối TCP port 443 tới cả hai registry công khai đều thông suốt, không có lỗi DNS hay chặn tường lửa mạng cơ bản.
- File liên quan: Cấu hình mạng hệ thống
- Hành động đề xuất: Thực hiện pull từng image để kiểm tra quyền truy cập repository và xác thực Bearer token.

---

## Kiểm tra: Kéo các image cơ sở (hello-world, mailpit, postgres)

- Thời gian: 2026-09-27 12:40:34 UTC+7 đến 12:42:58 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh:
  * `docker pull hello-world` (Exit code: 0)
  * `docker pull axllent/mailpit:v1.18` (Exit code: 0)
  * `docker pull postgres:16-alpine` (Exit code: 0)
- Exit code: 0
- Kết quả rút gọn: Cả 3 images đều tải về thành công và lưu vào local Docker cache.
- Kết luận: Docker Hub hoạt động bình thường đối với các public images chuẩn (`postgres`, `mailpit`, `hello-world`).
- File liên quan: `infra/docker-compose.yml`
- Hành động đề xuất: Kiểm tra kéo các image của MinIO.

---

## Kiểm tra: Kéo MinIO images từ Quay.io và Docker Hub

- Thời gian: 2026-09-27 12:43:03 UTC+7 đến 12:43:45 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh:
  * `docker pull quay.io/minio/minio:RELEASE.2024-12-18T13-15-44Z` (Exit code: 1, `401 Unauthorized`)
  * `docker pull quay.io/minio/mc:RELEASE.2024-11-21T17-21-54Z` (Exit code: 1, `401 UNAUTHORIZED`)
  * `docker pull quay.io/minio/minio:RELEASE.2024-05-10T01-41-38Z` (Exit code: 1, `401 UNAUTHORIZED`)
  * `docker pull minio/minio:RELEASE.2024-05-10T01-41-38Z` (Exit code: 1, `pull access denied`)
- Exit code: 1
- Kết quả rút gọn:
  * Trên `quay.io`: Trả về `401 Unauthorized` do quá trình thương lượng Bearer authentication qua Docker Desktop internal proxy (`http.docker.internal:3128`) thất bại đối với namespace `minio`.
  * Trên `docker.io`: Trả về `pull access denied for minio/minio, repository does not exist or may require 'docker login'` do MinIO đã dừng phân phối công khai tự do trên Docker Hub.
  * Khi chạy `docker compose up`, lỗi tải MinIO khiến Docker Compose hủy ngang các pull đồng thời khác, sinh lỗi thứ cấp `Interrupted`.
- Kết luận: MinIO container không ổn định cho môi trường local development không có tài khoản registry riêng.
- File liên quan: `infra/docker-compose.yml`
- Hành động đề xuất: Thay thế MinIO bằng `LocalStorageAdapter` trong development theo kiến trúc Storage abstraction.

---

## Kiểm tra: Xung đột cổng PostgreSQL (5432) và Process lắng nghe

- Thời gian: 2026-09-27 12:43:58 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `Get-NetTCPConnection -LocalPort 5432, 5433`, `Get-Process`, `docker ps -a`
- Exit code: 0
- Kết quả rút gọn:
  * Cổng 5432 đang bị chiếm bởi `com.docker.backend.exe` / `wslrelay.exe`, map trực tiếp tới container `airecruit-postgres-pgvector` (ID: `495bc3bfef42`) của dự án khác (`ai-recruitment-platform`).
  * Cổng 5433 đang bị chiếm bởi `midcv-postgres` (ID: `1f7a0aa1300e`).
  * Cổng 9000/9001 đang bị chiếm bởi `cho2nd-minio` (ID: `d7b5612f7ef0`).
  * Dịch vụ PostgreSQL trên Windows (`postgresql-x64-17`) đang ở trạng thái `Stopped`.
- Kết luận: Cổng 5432 bị xung đột nghiêm trọng do một container PostgreSQL khác trên máy chủ đang chạy. Khi CampusJob kết nối tới `localhost:5432`, request bị chuyển tới `airecruit-postgres-pgvector` (sở hữu user `postgres`, db `airecruit_db`), dẫn tới lỗi `Authentication failed against database server`. Volume `postgres_data` của CampusJob chưa từng được tạo nên không có chuyện giữ credential cũ.
- File liên quan: `infra/docker-compose.yml`, `.env`, `.env.example`
- Hành động đề xuất: Điều chỉnh cổng host của `campusjob-postgres` sang cổng `5434:5432` (cổng 5434 hoàn toàn rảnh rỗi), cập nhật `DATABASE_URL` trong `.env` tương ứng, không can thiệp hoặc tắt container của dự án khác để đảm bảo an toàn tuyệt đối.

---

## Kiểm tra: Đọc DATABASE_URL từ Prisma CLI trong Monorepo

- Thời gian: 2026-09-27 12:44:43 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `pnpm --filter @campusjob/api exec prisma migrate status`
- Exit code: 1
- Kết quả rút gọn: `Error: Environment variable not found: DATABASE_URL. --> prisma\schema.prisma:3`.
- Kết luận: Khi chạy Prisma CLI bên trong `apps/api`, Prisma chỉ tìm file `.env` cục bộ tại `apps/api/.env` hoặc `apps/api/prisma/.env`, không tự động dò ngược lên thư mục gốc của monorepo.
- File liên quan: `apps/api/package.json`, `package.json`
- Hành động đề xuất: Sử dụng `dotenv-cli` với tham số `-e ../../.env` cho các script `prisma:generate` và `prisma:migrate` trong `apps/api/package.json`.

---

## Kiểm tra: Xác thực đọc biến môi trường qua dotenv-cli

- Thời gian: 2026-09-27 12:45:18 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `pnpm --filter @campusjob/api exec dotenv -e ../../.env -- prisma validate`
- Exit code: 0
- Kết quả rút gọn: `The schema at prisma\schema.prisma is valid 🚀`.
- Kết luận: `dotenv-cli` đã đọc chính xác và đầy đủ file `.env` từ gốc monorepo và truyền vào cho Prisma CLI thành công.
- File liên quan: `apps/api/package.json`
- Hành động đề xuất: Áp dụng cấu hình này vào `apps/api/package.json`.

---

## Kiểm tra: Khởi động Docker Compose với cổng PostgreSQL 5434 và Mailpit

- Thời gian: 2026-09-27 12:48:47 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `docker compose -f infra/docker-compose.yml up -d`
- Exit code: 0
- Kết quả rút gọn: Container `campusjob-postgres` (port `5434->5432`) và `campusjob-mailpit` (ports `1025`, `8025`) khởi chạy thành công. Không còn xung đột cổng 5432 và không phụ thuộc MinIO.
- Kết luận: Hạ tầng Docker hoạt động ổn định và hoàn toàn độc lập với các container khác trên máy chủ.
- File liên quan: `infra/docker-compose.yml`, `.env`, `.env.example`
- Hành động đề xuất: Chạy migration Prisma.

---

## Kiểm tra: Áp dụng Migration CSDL (pnpm db:migrate) và xử lý UTF-8 BOM

- Thời gian: 2026-09-27 12:49:12 đến 12:49:36 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `pnpm db:migrate`
- Exit code: 0
- Kết quả rút gọn: Ban đầu gặp lỗi `ERROR: syntax error at or near "\u{feff}"` do PowerShell ghi BOM vào đầu file migration SQL. Sau khi loại bỏ BOM (`TrimStart([char]0xfeff)`), migration `20260927000000_init` đã áp dụng thành công 100% lên PostgreSQL 16 (tạo đủ 23 bảng nghiệp vụ + 4 bảng auth).
- Kết luận: Cơ sở dữ liệu PostgreSQL đã sẵn sàng hoạt động với toàn bộ cấu trúc bảng và khóa ngoại.
- File liên quan: `apps/api/prisma/migrations/20260927000000_init/migration.sql`
- Hành động đề xuất: Kiểm tra tạo tài khoản quản trị đầu tiên qua CLI.

---

## Kiểm tra: Khởi tạo Quản trị viên đầu tiên qua CLI (pnpm admin:create)

- Thời gian: 2026-09-27 12:49:47 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `pnpm admin:create -- --email admin@example.com --name "System Admin" --password "AdminPass123!@#"`
- Exit code: 0
- Kết quả rút gọn: `Thành công: Quản trị viên "System Admin" (admin@example.com) đã được thiết lập thành công.`
- Kết luận: CLI kết nối trực tiếp tới đúng database `campusjob` trên cổng 5434, mã hóa mật khẩu Argon2id và lưu thành công.
- File liên quan: `apps/api/src/cli/create-admin.ts`
- Hành động đề xuất: Chạy bộ kiểm thử toàn diện cho hệ thống.

---

## Kiểm tra: Kiểm thử lưu trữ Storage Abstraction & Files Service

- Thời gian: 2026-09-27 12:50:12 UTC+7
- Thư mục chạy: `CampusJob_Nhom11/`
- Câu lệnh: `pnpm --filter @campusjob/api test`
- Exit code: 0
- Kết quả rút gọn: Đạt 100% (5 test suites, 34 tests). Kiểm thử bao gồm: upload hợp lệ, download đúng quyền, từ chối non-owner, cho phép admin/moderator, từ chối file quá dung lượng, từ chối MIME sai, chống path traversal, xóa file, rollback DB khi lưu trữ thất bại, driver local, và báo lỗi cấu hình S3 thiếu secret.
- Kết luận: Hệ thống lưu trữ cục bộ hoạt động an toàn và tương thích hoàn toàn.
- File liên quan: `apps/api/src/storage/*`, `apps/api/src/files/*`
- Hành động đề xuất: Tiến hành nghiệm thu toàn bộ chất lượng Quality Gate.

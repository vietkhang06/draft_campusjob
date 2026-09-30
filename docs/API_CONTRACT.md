# API bản đầu

JSON UTF-8, gốc `/api`. Lỗi dạng `{ "error": "thông báo" }`. Các API nghiệp vụ lấy định danh từ máy chủ; không nhận `user_id` từ trình duyệt để giả làm người khác. CSRF kiểm tra Origin cho thao tác ghi; giới hạn60 thao tác/phút/tài khoản ở API.

| Nhóm | Endpoint và phương thức | Quyền |
|---|---|---|
| Phiên | GET session | Khách/đăng nhập |
| Khởi tạo | POST setup `{key}` | Đã đăng nhập + mã khởi tạo, một lần |
| Tài khoản | POST onboard `{role,name}` | Đã đăng nhập, student/employer |
| Cá nhân | GET/POST profile | Tài khoản của mình |
| Doanh nghiệp công khai | GET companies; GET companies/:id | Khách, chỉ công ty active |
| Hồ sơ pháp lý | GET/POST company | Employer, của mình |
| Chi nhánh | GET/POST branches; POST/DELETE branches/:id | Employer, của mình |
| Tìm việc | GET jobs?q=&city=&industry=&type=&schedule=&salary=&sort=&lat=&lng= | Tin mở, còn hạn, công ty active |
| Chi tiết tin | GET jobs/:id | Công khai nếu open; owner/staff cho tin ẩn |
| Quản lý tin | GET my-jobs; POST jobs; POST jobs/:id; POST jobs/:id/state | Employer active, owner |
| CV | GET/POST cvs; POST/DELETE cvs/:id | Student, owner |
| Lưu tin | GET saved; POST/DELETE saved/:job | Student |
| Ứng tuyển | GET/POST applications; GET/POST applications/:id | Student của mình / employer nhận hồ sơ; staff đọc có quyền |
| Phỏng vấn | GET interviews; POST interviews/:application | Employer tạo; danh sách hai bên |
| Xác nhận/đổi lịch | POST interviews/:application/confirm hoặc /reschedule | Student của hồ sơ |
| Giải quyết đổi lịch | POST interviews/:application/resolve | Employer của hồ sơ |
| Đánh giá | POST reviews; GET reviews; POST reviews/:id | Student có kết quả cuối; employer xem/phản hồi một lần |
| Báo cáo | GET/POST reports | Student/employer của mình |
| Chat | GET/POST messages/:application | Hai bên, sau lời mời, công ty không đình chỉ |
| Thông báo | GET notifications; POST notifications[/:id] | Recipient |
| Tệp | POST files multipart `{file,purpose}`; GET files/:id | Owner và staff theo quyền tải xuống |
| Kiểm duyệt | GET moderation; POST moderation/:id/job hoặc /report hoặc /review | Moderator/Admin |
| Quản trị | GET admin/overview; GET admin/reports?from=&to= | Admin |
| Quyết định quản trị | POST admin/:id/company, /role, /report, /lock, /clear_flag | Admin |
| Tác vụ | POST admin/maintenance | Admin |
| Gợi ý | GET recommendations | Student |
| Xác thực trường | GET school-verification; POST school-verification/send, /confirm | Student + provider thật |
| Gói dịch vụ | GET plans; POST plans[/:id] | Tài khoản đọc; admin tạo/ẩn |
| Thanh toán | GET/POST orders | Employer active, đơn của mình |
| Webhook | POST payment-webhook | Chữ ký provider, không dựa vào phiên người dùng |
| Lịch vận hành | POST maintenance | Bearer CRON_SECRET |

Mã lỗi chính:400 đầu vào,401 chưa đăng nhập,403 sai quyền,404 không tìm thấy/không công khai,409 xung đột quy tắc/trạng thái,413 dữ liệu lớn,428 chưa hoàn tất tài khoản,429 quá nhanh,503 thiếu tích hợp hoặc dịch vụ không sẵn sàng.

Kiểu trường và các ràng buộc cụ thể nằm trong `lib/domain.ts`, `lib/extensions.ts`; đây là mã thực thi chứ không phải stub. Danh sách endpoint không thay thế kiểm thử xác thực, phân quyền và phiên trên hệ thống đã triển khai.

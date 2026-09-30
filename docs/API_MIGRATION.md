# Tài liệu Ánh xạ API: Legacy Catch-all Route sang NestJS REST API (/api/v1)

Tài liệu này cung cấp bảng ánh xạ đầy đủ giữa hệ thống endpoint cũ (chạy qua một catch-all route duy nhất `app/api/[...path]/route.ts`) sang kiến trúc module hóa chuẩn RESTful NestJS tại `/api/v1/...`.

---

## 1. Chuẩn hóa Phản hồi và Mã lỗi

### Cấu trúc phản hồi lỗi thống nhất:
Mọi endpoint khi xảy ra lỗi đều trả về định dạng JSON:
```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Thông tin chi tiết thông báo lỗi bằng tiếng Việt.",
  "details": []
}
```

### Cơ chế xác thực:
- **Access Token:** Bearer token truyền qua header `Authorization: Bearer <token>`, lưu trên memory phía frontend.
- **Refresh Token:** HttpOnly Cookie (`campusjob_refresh_token`), SameSite=Lax, tự động xoay vòng (rotation) và lưu hash trong DB.

---

## 2. Bảng ánh xạ Endpoint (Cũ -> Mới)

### 2.1. Xác thực & Quản lý Tài khoản (Auth & Users)
| Nghiệp vụ | Phương thức | Endpoint Cũ | Endpoint Mới | Quyền hạn |
|---|---|---|---|---|
| Đăng ký tài khoản | `POST` | *Không có (ChatGPT SSO)* | `/api/v1/auth/register` | Public (chỉ `student`, `employer`) |
| Đăng nhập | `POST` | `/signin-with-chatgpt` | `/api/v1/auth/login` | Public |
| Làm mới Access Token | `POST` | *Không có* | `/api/v1/auth/refresh` | Cookie `campusjob_refresh_token` |
| Đăng xuất phiên hiện tại | `POST` | `/signout-with-chatgpt` | `/api/v1/auth/logout` | Authenticated |
| Đăng xuất mọi thiết bị | `POST` | *Không có* | `/api/v1/auth/logout-all` | Authenticated |
| Lấy thông tin user hiện tại | `GET` | `/api/session` (phần user) | `/api/v1/auth/me` | Authenticated |
| Trạng thái hệ thống & session | `GET` | `/api/session` | `/api/v1/session` | Public / Optional Auth |
| Xác minh email | `POST` | *Không có* | `/api/v1/auth/verify-email` | Public |
| Gửi lại email xác minh | `POST` | *Không có* | `/api/v1/auth/resend-verification` | Public |
| Yêu cầu quên mật khẩu | `POST` | *Không có* | `/api/v1/auth/forgot-password` | Public |
| Đặt lại mật khẩu | `POST` | *Không có* | `/api/v1/auth/reset-password` | Public |
| Đổi mật khẩu | `POST` | *Không có* | `/api/v1/auth/change-password` | Authenticated |
| Cập nhật hồ sơ cá nhân | `POST` | `/api/profile` | `/api/v1/profile` | Authenticated |
| Gửi mã email trường (.edu.vn) | `POST` | `/api/school-verification/send` | `/api/v1/school-verification/send` | Student |
| Xác nhận email trường | `POST` | `/api/school-verification/confirm` | `/api/v1/school-verification/confirm` | Student |
| Kiểm tra trạng thái email trường | `GET` | `/api/school-verification` | `/api/v1/school-verification` | Student |

### 2.2. Doanh nghiệp & Chi nhánh (Companies & Branches)
| Nghiệp vụ | Phương thức | Endpoint Cũ | Endpoint Mới | Quyền hạn |
|---|---|---|---|---|
| Danh sách doanh nghiệp công khai | `GET` | `/api/companies` | `/api/v1/companies` | Public |
| Chi tiết doanh nghiệp | `GET` | `/api/companies/:id` | `/api/v1/companies/:id` | Public |
| Lấy hồ sơ doanh nghiệp của mình | `GET` | `/api/company` | `/api/v1/company` | Employer |
| Cập nhật/nộp hồ sơ doanh nghiệp | `POST` | `/api/company` | `/api/v1/company` | Employer |
| Danh sách chi nhánh | `GET` | `/api/branches` | `/api/v1/branches` | Employer |
| Tạo chi nhánh mới | `POST` | `/api/branches` | `/api/v1/branches` | Employer |
| Cập nhật chi nhánh | `POST` | `/api/branches/:id` | `/api/v1/branches/:id` | Employer (Owner) |
| Xóa chi nhánh | `DELETE` | `/api/branches/:id` | `/api/v1/branches/:id` | Employer (Owner) |

### 2.3. Việc làm & Lưu việc (Jobs & Saved Jobs)
| Nghiệp vụ | Phương thức | Endpoint Cũ | Endpoint Mới | Quyền hạn |
|---|---|---|---|---|
| Tìm kiếm tin việc làm | `GET` | `/api/jobs` | `/api/v1/jobs` | Public |
| Chi tiết tin việc làm | `GET` | `/api/jobs/:id` | `/api/v1/jobs/:id` | Public |
| Danh sách tin của doanh nghiệp tôi | `GET` | `/api/my-jobs` | `/api/v1/my-jobs` | Employer |
| Đăng tin tuyển dụng mới | `POST` | `/api/jobs` | `/api/v1/jobs` | Employer |
| Sửa tin tuyển dụng | `POST` | `/api/jobs/:id` | `/api/v1/jobs/:id` | Employer (Owner) |
| Thay đổi trạng thái tin | `POST` | `/api/jobs/:id/state` | `/api/v1/jobs/:id/state` | Employer (Owner) |
| Danh sách việc đã lưu | `GET` | `/api/saved` | `/api/v1/saved` | Student |
| Lưu tin việc làm | `POST` | `/api/saved/:id` | `/api/v1/saved/:id` | Student |
| Bỏ lưu tin việc làm | `DELETE` | `/api/saved/:id` | `/api/v1/saved/:id` | Student |
| Gợi ý việc làm theo CV & ngành | `GET` | `/api/recommendations` | `/api/v1/recommendations` | Student |

### 2.4. CV & Hồ sơ ứng tuyển (CVs & Applications)
| Nghiệp vụ | Phương thức | Endpoint Cũ | Endpoint Mới | Quyền hạn |
|---|---|---|---|---|
| Danh sách CV cá nhân | `GET` | `/api/cvs` | `/api/v1/cvs` | Student |
| Chi tiết một CV | `GET` | `/api/cvs/:id` | `/api/v1/cvs/:id` | Student (Owner) |
| Tạo mới CV | `POST` | `/api/cvs` | `/api/v1/cvs` | Student |
| Chỉnh sửa CV | `POST` | `/api/cvs/:id` | `/api/v1/cvs/:id` | Student (Owner) |
| Xóa CV (chưa nộp đơn) | `DELETE` | `/api/cvs/:id` | `/api/v1/cvs/:id` | Student (Owner) |
| Danh sách ứng tuyển | `GET` | `/api/applications` | `/api/v1/applications` | Student / Employer |
| Chi tiết đơn ứng tuyển | `GET` | `/api/applications/:id` | `/api/v1/applications/:id` | Involved / Admin / Mod |
| Nộp đơn ứng tuyển | `POST` | `/api/applications` | `/api/v1/applications` | Student |
| Cập nhật trạng thái ứng tuyển | `POST` | `/api/applications/:id` | `/api/v1/applications/:id` | Involved Parties |

### 2.5. Phỏng vấn, Nhắn tin, Đánh giá, Báo cáo
| Nghiệp vụ | Phương thức | Endpoint Cũ | Endpoint Mới | Quyền hạn |
|---|---|---|---|---|
| Danh sách phỏng vấn | `GET` | `/api/interviews` | `/api/v1/interviews` | Student / Employer |
| Gửi lời mời phỏng vấn | `POST` | `/api/interviews/:id` | `/api/v1/interviews/:id` | Employer |
| Xác nhận tham gia phỏng vấn | `POST` | `/api/interviews/:id/confirm` | `/api/v1/interviews/:id/confirm` | Student |
| Yêu cầu đổi lịch phỏng vấn | `POST` | `/api/interviews/:id/reschedule` | `/api/v1/interviews/:id/reschedule` | Student |
| Xử lý yêu cầu đổi lịch | `POST` | `/api/interviews/:id/resolve` | `/api/v1/interviews/:id/resolve` | Employer |
| Lấy tin nhắn trao đổi | `GET` | `/api/messages/:id` | `/api/v1/messages/:id` | Involved Parties |
| Gửi tin nhắn trao đổi | `POST` | `/api/messages/:id` | `/api/v1/messages/:id` | Involved Parties |
| Danh sách đánh giá doanh nghiệp | `GET` | `/api/reviews` | `/api/v1/reviews` | Employer |
| Gửi đánh giá sau khi hoàn tất | `POST` | `/api/reviews` | `/api/v1/reviews` | Student |
| Doanh nghiệp phản hồi đánh giá | `POST` | `/api/reviews/:id` | `/api/v1/reviews/:id` | Employer |
| Danh sách báo cáo đã gửi | `GET` | `/api/reports` | `/api/v1/reports` | Authenticated |
| Gửi báo cáo vi phạm | `POST` | `/api/reports` | `/api/v1/reports` | Authenticated |

### 2.6. Kiểm duyệt & Quản trị (Moderation & Admin)
| Nghiệp vụ | Phương thức | Endpoint Cũ | Endpoint Mới | Quyền hạn |
|---|---|---|---|---|
| Hàng đợi kiểm duyệt | `GET` | `/api/moderation` | `/api/v1/moderation` | Moderator / Admin |
| Kiểm duyệt tin tuyển dụng | `POST` | `/api/moderation/:id/job` | `/api/v1/moderation/:id/job` | Moderator / Admin |
| Thẩm tra báo cáo vi phạm | `POST` | `/api/moderation/:id/report` | `/api/v1/moderation/:id/report` | Moderator / Admin |
| Ẩn/hiện đánh giá | `POST` | `/api/moderation/:id/review` | `/api/v1/moderation/:id/review` | Moderator / Admin |
| Tổng quan quản trị | `GET` | `/api/admin/overview` | `/api/v1/admin/overview` | Admin |
| 8 báo cáo phân tích | `GET` | `/api/admin/reports` | `/api/v1/admin/reports` | Admin |
| Xét duyệt doanh nghiệp | `POST` | `/api/admin/:id/company` | `/api/v1/admin/:id/company` | Admin |
| Đình chỉ doanh nghiệp | `POST` | `/api/admin/:id/suspend` | `/api/v1/admin/:id/company` | Admin |
| Gỡ cờ cảnh báo doanh nghiệp | `POST` | `/api/admin/:id/clear_flag` | `/api/v1/admin/:id/clear_flag` | Admin |
| Khóa quyền ứng tuyển học sinh | `POST` | `/api/admin/:id/lock` | `/api/v1/admin/:id/lock` | Admin |
| Cấp/thu hồi role Moderator | `POST` | `/api/admin/:id/role` | `/api/v1/admin/:id/role` | Admin |
| Kết luận báo cáo vi phạm | `POST` | `/api/admin/:id/report` | `/api/v1/admin/:id/report` | Admin |
| Kích hoạt tác vụ vận hành | `POST` | `/api/admin/maintenance` | `/api/v1/admin/maintenance` | Admin |

### 2.7. Tệp tin, Dịch vụ & Thanh toán (Files, Plans, Payments)
| Nghiệp vụ | Phương thức | Endpoint Cũ | Endpoint Mới | Quyền hạn |
|---|---|---|---|---|
| Tải file lên MinIO/S3 | `POST` | `/api/files` | `/api/v1/files` | Authenticated |
| Xem/Tải file | `GET` | `/api/files/:id` | `/api/v1/files/:id` | Authorized (Owner/Mod/Admin) |
| Danh sách gói dịch vụ | `GET` | `/api/plans` | `/api/v1/plans` | Public |
| Tạo gói dịch vụ mới | `POST` | `/api/plans` | `/api/v1/plans` | Admin |
| Đổi trạng thái mở bán gói | `POST` | `/api/plans/:id` | `/api/v1/plans/:id` | Admin |
| Lịch sử đơn hàng | `GET` | `/api/orders` | `/api/v1/orders` | Employer |
| Tạo phiên thanh toán (Stripe) | `POST` | `/api/orders` | `/api/v1/orders` | Employer |
| Webhook cổng thanh toán | `POST` | `/api/stripe-webhook` | `/api/v1/stripe-webhook` | Stripe HMAC Verified |
| Maintenance Cron Endpoint | `POST` | *Không có* | `/api/v1/maintenance/cron` | Bearer Maintenance Secret |

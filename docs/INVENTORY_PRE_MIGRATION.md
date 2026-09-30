# BẢNG KIỂM KÊ HỆ THỐNG CAMPUSJOB TRƯỚC KHI TÁI CẤU TRÚC

## 1. Route giao diện hiện tại (Web)

| Tuyến đường (Route) | Mục đích & Mô tả giao diện | Quyền truy cập |
|---|---|---|
| `/` | Cổng tìm việc: Hero banner, thanh tìm kiếm (từ khóa, địa điểm, bán kính gần tôi, WebMCP search), bộ lọc (ngành nghề, loại hình, mức lương, thời gian), sắp xếp (uy tín, mới nhất, lương), danh sách tin tuyển dụng, lưu tin, liên kết tạo CV. | Khách / Sinh viên / Nhà tuyển dụng |
| `/jobs/:id` | Chi tiết tin tuyển dụng: Thông tin công việc, công ty, lương, địa điểm (OpenStreetMap link), hạn nộp; nút Lưu tin; nút Ứng tuyển (mở Modal chọn CV và thư giới thiệu); nút Ẩn tin thẩm tra (dành cho Admin/Moderator). | Khách / Đã đăng nhập |
| `/companies` | Danh sách doanh nghiệp đã xác thực: Tìm kiếm theo tên / ngành nghề, hiển thị danh thiếp công ty, số tin đang tuyển, điểm đánh giá trung bình. | Khách / Đã đăng nhập |
| `/companies/:id` | Chi tiết doanh nghiệp: Giới thiệu pháp lý, website, danh sách tin đang tuyển, danh sách chi nhánh kèm bản đồ, đánh giá từ sinh viên kèm phản hồi doanh nghiệp, nút Báo cáo doanh nghiệp (sinh viên). | Khách / Đã đăng nhập |
| `/setup` | Thiết lập Quản trị viên đầu tiên: Nhập mã bí mật `ADMIN_SETUP_KEY` (trước đây dùng SSO ChatGPT). | Đã đăng nhập SSO (cũ) |
| `/guidelines` | Trang quy định: Tuyển dụng minh bạch, ứng tuyển có trách nhiệm, bảo mật dữ liệu, chính sách xử lý vi phạm, lưu giữ hồ sơ. | Công khai |
| `/workspace` | Không gian làm việc: Điều hướng phân quyền theo 4 vai trò (Student, Employer, Moderator, Admin). Màn hình Tổng quan (`overview`) hiển thị thống kê & liên kết nhanh. | Yêu cầu đăng nhập |
| `/workspace/profile` | Hồ sơ cá nhân: Cập nhật thông tin sinh viên (trường, khoa, năm tốt nghiệp, trạng thái tìm việc, số điện thoại, avatar) hoặc thông tin tài khoản; Xác thực email trường đại học đuôi `.edu.vn` qua OTP. | Tất cả vai trò (riêng theo vai trò) |
| `/workspace/cvs` | Quản lý CV sinh viên: Danh sách CV, tạo mới CV, chỉnh sửa CV, đặt CV mặc định, xem trước, xóa CV (chặn nếu CV đã nộp ứng tuyển). | Student |
| `/workspace/cvs/:id` | Xem và in CV: Bản in chuẩn trang web / xuất PDF bằng lệnh in trình duyệt. | Student sở hữu |
| `/workspace/saved` | Tin tuyển dụng đã lưu: Danh sách các công việc sinh viên đã bấm lưu để theo dõi. | Student |
| `/workspace/recommendations` | Gợi ý việc làm: Sắp xếp theo thuật toán khớp kỹ năng từ CV mặc định, chuyên ngành và lịch sử ứng tuyển. | Student |
| `/workspace/applications` | Quản lý ứng tuyển: Sinh viên xem hồ sơ của mình; Doanh nghiệp xem danh sách ứng viên nộp vào tin của mình. | Student / Employer |
| `/workspace/applications/:id` | Chi tiết hồ sơ ứng tuyển: Snapshot CV tại thời điểm nộp, thư xin việc, trạng thái, lịch sử duyệt, nút rút hồ sơ (student), nút đánh dấu đã xem, mời phỏng vấn, từ chối, ghi nhận trúng tuyển/không trúng tuyển (employer), trao đổi tin nhắn (chat). | Student sở hữu / Employer sở hữu / Admin / Moderator |
| `/workspace/company` | Hồ sơ pháp lý doanh nghiệp: Mã số thuế, tên pháp lý, địa chỉ, người đại diện, số điện thoại, email, giấy phép đăng ký kinh doanh, trạng thái xác thực. | Employer |
| `/workspace/branches` | Quản lý chi nhánh: Danh sách chi nhánh, thêm/sửa chi nhánh (địa chỉ, tỉnh/thành, tọa độ lat/lng), xóa chi nhánh (chặn nếu đã có tin). | Employer |
| `/workspace/jobs` | Quản lý tin tuyển dụng doanh nghiệp: Danh sách tin đã đăng, số lượt nộp, số lượt xem, trạng thái (open, paused, closed, pending, rejected), nút đăng tin mới, sửa tin, tạm dừng/mở lại/đóng tin. | Employer |
| `/workspace/interviews` | Lịch phỏng vấn: Danh sách lịch hẹn phỏng vấn (thời gian, hình thức trực tiếp/trực tuyến, địa điểm/link, trạng thái xác nhận/đổi lịch). | Student / Employer |
| `/workspace/reviews` | Quản lý đánh giá: Doanh nghiệp xem phản hồi từ ứng viên và thực hiện quyền phản hồi 1 lần duy nhất cho mỗi đánh giá. | Employer |
| `/workspace/services` | Dịch vụ tuyển dụng: Mua gói tin nổi bật qua Stripe Checkout, xem lịch sử giao dịch và trạng thái thanh toán. | Employer / Admin |
| `/workspace/reports` | Quản lý báo cáo vi phạm: Theo dõi kết quả thẩm tra các báo cáo vi phạm đã gửi. | Student / Employer |
| `/workspace/notifications` | Trung tâm thông báo: Danh sách thông báo trong hệ thống, đánh dấu đã đọc, cài đặt bật/tắt nhận email cho 8 nhóm sự kiện. | Tất cả vai trò |
| `/workspace/moderation` | Bàn kiểm duyệt: Hàng đợi duyệt tin tuyển dụng mới/sửa, thẩm tra báo cáo vi phạm và đề xuất xử lý, kiểm duyệt ẩn/hiện đánh giá. | Moderator / Admin |
| `/workspace/admin` | Quản trị hệ thống: 6 tab gồm Xét duyệt doanh nghiệp & gỡ cờ/đình chỉ, Quản lý tài khoản & cấp/thu hồi quyền kiểm duyệt & khóa ứng tuyển, Kết luận báo cáo vi phạm, Quản lý chế tài, Nhật ký hệ thống (Audit log), Tác vụ vận hành (Maintenance). | Admin |
| `/workspace/analytics` | Thống kê & Báo cáo: 8 nhóm số liệu thống kê (Tin theo tháng, Hàng đợi duyệt, Chế tài vi phạm, Doanh nghiệp nổi bật, Kết quả tuyển dụng, Phễu tuyển dụng, Xu hướng đánh giá, Hoạt động sinh viên) và xuất file CSV. | Admin |

---

## 2. Endpoint hiện tại

Tất cả endpoint cũ nằm trong catch-all route `/api/[...path]`:

| STT | Phương thức | Endpoint | Vai trò / Quyền hạn | Nghiệp vụ tóm tắt |
|---|---|---|---|---|
| 1 | `GET` | `/api/session` | Public | Lấy thông tin định danh người dùng hiện tại, user profile, cờ setupRequired, emailConfigured. |
| 2 | `POST` | `/api/setup` | Đã đăng nhập SSO | Khởi tạo tài khoản Quản trị viên đầu tiên bằng mã bí mật `ADMIN_SETUP_KEY`. |
| 3 | `POST` | `/api/onboard` | Đã đăng nhập SSO | Chọn vai trò ban đầu (`student` hoặc `employer`) và nhập họ tên. |
| 4 | `GET` | `/api/jobs` | Public | Tìm kiếm danh sách việc làm mở, còn hạn, doanh nghiệp active; hỗ trợ lọc từ khóa, ngành, loại hình, địa điểm, lương, khoảng cách; tự động chạy maintenance. |
| 5 | `GET` | `/api/jobs/:id` | Public (nếu open) / Owner / Staff | Xem chi tiết tin tuyển dụng; ghi nhận lượt xem theo ngày (chống trùng lặp). |
| 6 | `GET` | `/api/companies` | Public | Lấy danh sách doanh nghiệp active kèm số tin đang tuyển và điểm đánh giá trung bình. |
| 7 | `GET` | `/api/companies/:id` | Public | Xem thông tin chi tiết doanh nghiệp active, danh sách chi nhánh, đánh giá công khai. |
| 8 | `GET` | `/api/profile` | Authenticated | Lấy thông tin hồ sơ người dùng hiện tại. |
| 9 | `POST` | `/api/profile` | Authenticated | Cập nhật hồ sơ (sinh viên: trường, ngành, năm tốt nghiệp, trạng thái tìm việc, avatar, tùy chọn email; chung: tên, số điện thoại, giới thiệu). |
| 10 | `GET` | `/api/company` | Employer | Xem hồ sơ pháp lý doanh nghiệp của nhà tuyển dụng hiện tại. |
| 11 | `POST` | `/api/company` | Employer | Đăng ký hoặc cập nhật hồ sơ pháp lý doanh nghiệp (mã số thuế 10-13 số, giấy phép, người đại diện). Đưa về trạng thái `pending`. |
| 12 | `GET` | `/api/branches` | Employer | Lấy danh sách chi nhánh của doanh nghiệp. |
| 13 | `POST` | `/api/branches` | Employer | Tạo chi nhánh mới hoặc sửa chi nhánh cũ (nếu sửa chi nhánh, các tin tuyển dụng liên quan sẽ bị đưa về `pending` để kiểm duyệt lại). |
| 14 | `DELETE`| `/api/branches/:id`| Employer | Xóa chi nhánh (chặn nếu đã gắn với tin tuyển dụng). |
| 15 | `GET` | `/api/my-jobs` | Employer | Xem danh sách tin tuyển dụng của công ty kèm số lượng ứng viên, trúng tuyển, lượt xem. |
| 16 | `POST` | `/api/jobs` | Employer (Active) | Đăng tin tuyển dụng mới (trạng thái ban đầu `pending`). |
| 17 | `POST` | `/api/jobs/:id` | Employer (Owner) | Chỉnh sửa tin tuyển dụng (đưa trạng thái về `pending` để duyệt lại). |
| 18 | `POST` | `/api/jobs/:id/state`| Employer (Owner) | Tạm dừng, mở lại, hoặc đóng tin tuyển dụng. |
| 19 | `GET` | `/api/cvs` | Student | Danh sách CV của sinh viên (parse JSON data). |
| 20 | `POST` | `/api/cvs` | Student | Tạo mới hoặc cập nhật CV (nếu chọn mặc định thì bỏ mặc định của các CV khác). |
| 21 | `DELETE`| `/api/cvs/:id` | Student | Xóa CV (chặn nếu CV đã được dùng để ứng tuyển). |
| 22 | `GET` | `/api/saved` | Student | Lấy danh sách việc làm đã lưu. |
| 23 | `POST` | `/api/saved/:id` | Student | Lưu một tin tuyển dụng đang mở. |
| 24 | `DELETE`| `/api/saved/:id` | Student | Bỏ lưu tin tuyển dụng. |
| 25 | `GET` | `/api/recommendations` | Student | Lấy danh sách công việc gợi ý dựa trên kỹ năng CV mặc định, chuyên ngành và lịch sử ứng tuyển. |
| 26 | `GET` | `/api/applications` | Student / Employer | Xem danh sách ứng tuyển (student xem đơn của mình; employer xem ứng viên nộp vào tin công ty). |
| 27 | `GET` | `/api/applications/:id` | Student / Employer / Staff | Xem chi tiết đơn ứng tuyển, snapshot CV, lịch phỏng vấn, đánh giá, lịch sử trạng thái. |
| 28 | `POST` | `/api/applications` | Student | Nộp hồ sơ ứng tuyển (chặn nếu đang có >= 5 hồ sơ đang xử lý, đang bị khóa ứng tuyển hoặc tin đã đóng). Lưu snapshot CV. |
| 29 | `POST` | `/api/applications/:id` | Student / Employer | Cập nhật trạng thái đơn (student: `withdrawn`; employer: `viewed`, `rejected`, `hired`, `not_hired`). |
| 30 | `GET` | `/api/interviews` | Student / Employer | Danh sách lịch phỏng vấn liên quan đến tài khoản. |
| 31 | `POST` | `/api/interviews/:application` | Employer | Mời phỏng vấn ứng viên (yêu cầu hồ sơ đang ở trạng thái `viewed`). |
| 32 | `POST` | `/api/interviews/:application/confirm` | Student | Ứng viên xác nhận tham gia phỏng vấn trước giờ hẹn. |
| 33 | `POST` | `/api/interviews/:application/reschedule` | Student | Đề nghị đổi lịch phỏng vấn (tối đa 1 lần, trước giờ hẹn). |
| 34 | `POST` | `/api/interviews/:application/resolve` | Employer | Nhà tuyển dụng chấp nhận hoặc từ chối đề nghị đổi lịch. |
| 35 | `GET` | `/api/reviews` | Employer | Xem danh sách đánh giá của sinh viên về doanh nghiệp. |
| 36 | `POST` | `/api/reviews` | Student | Gửi đánh giá sau khi có kết quả tuyển dụng cuối cùng (`hired`, `not_hired`, `rejected`). Kiểm tra gắn cờ doanh nghiệp nếu > 30% 1 sao với >= 10 đánh giá. |
| 37 | `POST` | `/api/reviews/:id` | Employer | Phản hồi đánh giá (tối đa 1 lần duy nhất). |
| 38 | `GET` | `/api/reports` | Student / Employer | Lấy danh sách báo cáo vi phạm do tài khoản hiện tại gửi. |
| 39 | `POST` | `/api/reports` | Student / Employer | Gửi báo cáo vi phạm (student báo cáo công ty lừa đảo -> gắn cờ; employer báo cáo sinh viên vắng phỏng vấn hoặc bỏ việc tuần đầu -> bắt buộc minh chứng). |
| 40 | `GET` | `/api/messages/:application` | Student / Employer | Lấy tin nhắn trao đổi của đơn ứng tuyển (chỉ mở sau khi đã có lời mời phỏng vấn). |
| 41 | `POST` | `/api/messages/:application` | Student / Employer | Gửi tin nhắn trao đổi. |
| 42 | `GET` | `/api/notifications` | Authenticated | Lấy danh sách thông báo của tài khoản. |
| 43 | `POST` | `/api/notifications[/:id]` | Authenticated | Đánh dấu thông báo là đã đọc. |
| 44 | `POST` | `/api/files` | Authenticated | Tải lên tệp (avatar, license, evidence): kiểm tra dung lượng <= 5MB, kiểm tra magic bytes PNG/JPEG/PDF. |
| 45 | `GET` | `/api/files/:id` | Owner / Admin / Mod | Tải xuống / xem tệp riêng tư, kiểm tra quyền sở hữu. |
| 46 | `GET` | `/api/moderation` | Moderator / Admin | Lấy hàng đợi tin chờ duyệt, báo cáo chờ xử lý, đánh giá cần kiểm duyệt. |
| 47 | `POST` | `/api/moderation/:id/job` | Moderator / Admin | Duyệt (`approve`), từ chối (`reject`), hoặc ẩn tạm (`hide`) tin tuyển dụng (không được tự duyệt tin của mình). |
| 48 | `POST` | `/api/moderation/:id/report` | Moderator / Admin | Ghi nhận kết luận thẩm tra sơ bộ và đề xuất xử lý báo cáo. |
| 49 | `POST` | `/api/moderation/:id/review` | Moderator / Admin | Ẩn hoặc khôi phục đánh giá. |
| 50 | `GET` | `/api/admin/overview` | Admin | Lấy toàn bộ số liệu tổng quan hệ thống: công ty, người dùng, báo cáo, chế tài, nhật ký, hàng đợi email. |
| 51 | `GET` | `/api/admin/reports` | Admin | 8 bộ dữ liệu phân tích thống kê kèm bộ lọc ngày. |
| 52 | `POST` | `/api/admin/:id/company` | Admin | Duyệt pháp lý công ty (`approve`), từ chối (`reject`), đình chỉ công ty (`suspend` - yêu cầu có báo cáo đã xác nhận vi phạm, đóng toàn bộ tin và tạo chế tài). |
| 53 | `POST` | `/api/admin/:id/clear_flag` | Admin | Gỡ cờ cảnh báo doanh nghiệp (yêu cầu hết báo cáo tồn đọng và tỷ lệ 1 sao <= 30%). |
| 54 | `POST` | `/api/admin/:id/role` | Admin | Cấp hoặc thu hồi quyền Kiểm duyệt viên (`moderator`) cho tài khoản `student`. |
| 55 | `POST` | `/api/admin/:id/report` | Admin | Ra quyết định cuối cùng cho báo cáo vi phạm (`confirm` hoặc `dismiss`). Nếu sinh viên có 2 vi phạm trong 6 tháng -> tự động tạo cảnh cáo `warning`. |
| 56 | `POST` | `/api/admin/:id/lock` | Admin | Khóa quyền ứng tuyển của sinh viên 30–90 ngày (yêu cầu có >= 3 vi phạm đã xác nhận trong 6 tháng). |
| 57 | `POST` | `/api/admin/maintenance` | Admin | Kích hoạt tác vụ dọn dẹp và đẩy hàng đợi email. |
| 58 | `GET` | `/api/school-verification` | Student | Xem trạng thái xác thực email sinh viên đuôi `.edu.vn`. |
| 59 | `POST` | `/api/school-verification/send` | Student | Gửi mã OTP 6 số vào email `.edu.vn` (thời hạn 10 phút, cooldown 60s). |
| 60 | `POST` | `/api/school-verification/confirm` | Student | Xác thực mã OTP 6 số (tối đa 5 lần thử sai). |
| 61 | `GET` | `/api/plans` | Authenticated | Xem danh sách các gói dịch vụ tin tuyển dụng nổi bật. |
| 62 | `POST` | `/api/plans[/:id]` | Admin | Tạo gói tin nổi bật mới hoặc bật/tắt trạng thái mở bán gói. |
| 63 | `GET` | `/api/orders` | Employer | Xem lịch sử đơn mua gói dịch vụ nổi bật của công ty. |
| 64 | `POST` | `/api/orders` | Employer (Active) | Tạo phiên thanh toán Stripe Checkout cho gói tin nổi bật. |
| 65 | `POST` | `/api/payment-webhook` | Stripe Webhook | Webhook xử lý sự kiện thanh toán `checkout.session.completed`, xác thực chữ ký HMAC-SHA256, gia hạn `featured_until`. |
| 66 | `POST` | `/api/maintenance` | Cron / Secret | Endpoint tác vụ định kỳ bảo vệ bằng header `Authorization: Bearer <CRON_SECRET>`. |

---

## 3. Bảng dữ liệu hiện tại (23 bảng SQLite)

1. `users`: id, email, name, role, profile, created, updated
2. `companies`: id, owner, name, tax, address, phone, email, website, industry, size, hr, description, license, status, reason, flag, created, updated
3. `branches`: id, company, name, address, city, lat, lng
4. `jobs`: id, company, branch, title, industry, type, description, skills, preferred, vacancies, salary_min, salary_max, salary_unit, schedule, benefits, deadline, status, reason, featured_until, created, updated
5. `cvs`: id, student, name, data, is_default, created, updated
6. `applications`: id, student, job, cv, snapshot, letter, score, status, reason, created, updated
7. `interviews`: id, application, time, mode, location, message, response, reschedule_used, proposed, request_reason, decision, created
8. `saved`: id, student, job, created
9. `views`: id, job, visitor, day, created
10. `reviews`: id, application, student, company, rating, comment, reply, hidden, created
11. `reports`: id, reporter, target, target_type, application, kind, description, evidence, status, recommendation, decision, resolved_by, occurred, created, updated
12. `sanctions`: id, target, kind, reason, until, report, created, actor
13. `notifications`: id, recipient, kind, title, body, url, read, created, dedupe
14. `files`: id, owner, name, mime, size, purpose, created
15. `messages`: id, application, sender, body, created
16. `history`: id, entity, entity_id, action, actor, detail, created
17. `settings`: key, value
18. `email_queue`: id, notification, recipient, subject, body, status, attempts, error, created, sent
19. `rate_limits`: key, count, window
20. `school_verifications`: user, email, hash, expires, attempts, verified, created
21. `plans`: id, name, amount, days, active, created
22. `orders`: id, company, job, plan, amount, days, status, session, created, paid
23. `payment_events`: id, order, created

---

## 4. Nghiệp vụ, vai trò và ma trận kiểm tra quyền

### Bốn vai trò (Roles)
- **`student`**: Quản lý hồ sơ cá nhân, tạo nhiều CV (1 CV mặc định), tìm kiếm & lọc việc làm, lưu việc làm, xem gợi ý việc làm, ứng tuyển (tối đa 5 hồ sơ đang xử lý), rút hồ sơ, xác nhận / đề nghị đổi lịch phỏng vấn (1 lần), chat với nhà tuyển dụng, đánh giá doanh nghiệp sau khi có kết quả cuối, gửi báo cáo doanh nghiệp vi phạm.
- **`employer`**: Nộp hồ sơ pháp lý doanh nghiệp (mã số thuế, giấy phép kinh doanh), quản lý nhiều chi nhánh, đăng & quản lý tin tuyển dụng (open, paused, closed), quản lý ứng viên (xem, mời phỏng vấn, chấp nhận/từ chối đổi lịch, trúng tuyển/không trúng tuyển/từ chối), chat với ứng viên, phản hồi đánh giá (1 lần duy nhất), báo cáo sinh viên vi phạm (vắng phỏng vấn, bỏ việc tuần đầu - bắt buộc minh chứng), mua gói tin nổi bật qua cổng thanh toán.
- **`moderator`**: Xét duyệt tin tuyển dụng (duyệt, từ chối kèm lý do, ẩn tạm để thẩm tra; không được tự duyệt tin của chính mình), thẩm tra báo cáo vi phạm và đưa ra kết luận sơ bộ kèm đề xuất xử lý, kiểm duyệt ẩn/khôi phục đánh giá của sinh viên.
- **`admin`**: Toàn quyền của moderator; Xét duyệt hồ sơ pháp lý doanh nghiệp (duyệt, từ chối, đình chỉ doanh nghiệp khi có báo cáo vi phạm xác nhận, gỡ cờ cảnh báo); Quản lý phân quyền (cấp/thu hồi quyền moderator cho student; không tự đổi quyền mình); Ra kết luận cuối cùng cho các báo cáo vi phạm; Áp dụng chế tài khóa quyền ứng tuyển 30–90 ngày cho sinh viên có đủ từ 3 vi phạm trong 6 tháng; Quản lý gói tin nổi bật; Xem toàn bộ 8 nhóm báo cáo thống kê và nhật ký kiểm toán (audit log); Kích hoạt tác vụ vận hành (maintenance).

### Kiểm tra quyền sở hữu (Ownership checks)
- **CV**: Chỉ chính sinh viên sở hữu mới được xem, sửa, xóa hoặc dùng ứng tuyển.
- **Doanh nghiệp & Chi nhánh**: Chỉ employer sở hữu mới được sửa thông tin, thêm/sửa/xóa chi nhánh.
- **Tin tuyển dụng**: Chỉ employer sở hữu mới được sửa hoặc đổi trạng thái; kiểm duyệt viên không được duyệt tin mình sở hữu.
- **Ứng tuyển & Tin nhắn**: Chỉ sinh viên nộp đơn và nhà tuyển dụng nhận đơn mới được xem hồ sơ và chat sau khi có lịch phỏng vấn.
- **Tệp riêng tư**: Tệp avatar, giấy phép kinh doanh, minh chứng báo cáo chỉ chủ sở hữu và staff (admin, moderator) mới có quyền đọc/tải xuống.

---

## 5. Tệp, Email, Thanh toán và Tác vụ định kỳ

- **Upload file**:
  - Hạn mức tối đa 5MB.
  - Phân loại `purpose`: `avatar`, `license`, `evidence`.
  - Kiểm tra MIME thực tế thông qua magic bytes (%PDF-, PNG, JPEG).
  - Tải xuống có kiểm tra quyền sở hữu và bảo mật CSP `sandbox`.
  - Mục tiêu mới: Lưu trữ qua MinIO / S3-compatible adapter.
- **Email**:
  - Hệ thống lưu hàng đợi `email_queue` gắn với thông báo hoặc OTP.
  - Hỗ trợ gửi lại tối đa 5 lần nếu gặp lỗi.
  - Tùy chọn bật/tắt nhận email theo 8 loại thông báo tại hồ sơ người dùng.
  - Mục tiêu mới: Sử dụng Nodemailer gửi qua Mailpit local và cấu hình SMTP/provider cho production.
- **Thanh toán**:
  - Tích hợp Stripe Checkout với VNĐ.
  - Xác thực chữ ký HMAC-SHA256 trên webhook raw body và timestamp ±5 phút.
  - Khử trùng lặp sự kiện qua bảng `payment_events`, đảm bảo không xử lý lặp đơn đã trả.
  - Tự động cộng dồn thời hạn nổi bật `featured_until` cho tin tuyển dụng tương ứng.
- **Tác vụ vận hành (Maintenance Job)**:
  - Tự động đóng tin quá hạn (`status='closed'`).
  - Quét tin sắp hết hạn trong 3 ngày và gửi thông báo nhắc nhở cho nhà tuyển dụng.
  - Xóa dữ liệu rate limit cũ hơn 24 giờ.
  - Đẩy hàng đợi email xử lý các thư chưa gửi.
  - Bảo vệ qua header `Authorization: Bearer <CRON_SECRET>`.

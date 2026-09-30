# Vận hành CampusJob

## Khởi tạo

Site được tạo riêng tư. Mở `/setup`, đăng nhập bằng tài khoản của chủ hệ thống rồi dùng mã thiết lập được bàn giao riêng. Mã không nằm trong kho mã nguồn. Không công khai site trước khi hoàn tất bước này. Không cấp admin tự động cho người đăng ký đầu tiên.

Sau khi khởi tạo, quản trị có thể cấp quyền kiểm duyệt viên cho tài khoản sinh viên đã đăng ký. Khóa bí mật môi trường được nền tảng lưu; không đặt vào frontend, hosting manifest hoặc Git.

## Biến môi trường

| Tên | Mục đích | Trạng thái bàn giao |
|---|---|---|
| ADMIN_SETUP_KEY | Mã khởi tạo quản trị một lần | Đã tạo và lưu dạng bí mật |
| CRON_SECRET | Bảo vệ endpoint tác vụ vận hành | Đã tạo và lưu dạng bí mật |
| PUBLIC_ORIGIN | Origin HTTPS cố định của website | Cấu hình theo URL triển khai |
| RESEND_API_KEY | Gửi email và OTP | Chưa có thông tin từ người dùng |
| MAIL_FROM | Địa chỉ gửi thuộc tên miền đã xác minh | Chưa cấu hình |
| STRIPE_SECRET_KEY | Tài khoản nhận thanh toán thực tế | Chưa cấu hình; không dùng test key |
| STRIPE_WEBHOOK_SECRET | Xác minh sự kiện thanh toán | Chưa cấu hình |

`.env.example` chứa tên khóa, không chứa thông tin truy cập thật. Giá gói do quản trị tự tạo; migration không thêm gói mẫu.

## Email và tác vụ theo lịch

Adapter gọi `POST https://api.resend.com/emails`; dùng idempotency key theo bản ghi hàng đợi, chỉ cập nhật sent khi provider trả về thành công. `sent` nghĩa là provider tiếp nhận, không phải đã chứng minh người nhận đọc hoặc thư vào inbox. Lần gửi lỗi lưu trạng thái và số lần thử; tối đa5 lần. Muốn xử lý sau5 lần cần người vận hành điều tra nguyên nhân.

Sau thao tác POST, nếu đã cấu hình provider, API thử xử lý tối đa25 thư trong hàng đợi. Quản trị cũng có nút chạy tác vụ. Endpoint `POST /api/maintenance` yêu cầu `Authorization: Bearer <CRON_SECRET>` để gọi định kỳ, ví dụ mỗi5 phút, bằng hệ thống lịch bên ngoài do nhóm quản lý. Không ghi secret vào URL.

**Cổng truy cập private của Sites có thể chặn caller bên ngoài trước khi tới endpoint.** Chưa thể coi cron/webhook hoạt động khi site chỉ cho chủ sở hữu vào. Phải cấu hình phạm vi truy cập hoặc kiến trúc endpoint phù hợp và thử request thật trước nghiệm thu. Không tự thay đổi phạm vi chia sẻ chỉ để chạy tích hợp.

Tin quá hạn bị loại khỏi tìm kiếm và bị từ chối ứng tuyển theo thời gian máy chủ ngay cả khi tác vụ chưa chạy. Chuyển trạng thái closed và nhắc3 ngày xảy ra khi tác vụ chạy hoặc có truy cập tìm việc; không bảo đảm giờ gửi nhắc khi chưa có scheduler.

## Thanh toán

Adapter Stripe Checkout dùng số tiền VNĐ và số ngày đọc từ bảng plans, không tin giá gửi từ trình duyệt. Chỉ nhận khóa live; tài khoản nhận tiền phải hợp lệ và được nhà cung cấp hỗ trợ. Giao dịch thật chưa được tạo hoặc thử trong lần bàn giao này.

Webhook: `POST /api/payment-webhook`, đăng ký các sự kiện `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`. Kiểm tra HMAC SHA-256 trên raw body, timestamp ±5 phút, tiền tệ, số tiền, live mode, session và đơn; không cấp quyền từ tham số URL redirect. Cập nhật đơn và thời hạn nổi bật bằng transaction, chống cấp lặp cho đơn đã trả.

Cần thử chu trình thực tế từ Checkout tới webhook trên cấu hình truy cập hợp lệ. Chưa có hỗ trợ hoàn tiền, tranh chấp, hóa đơn thuế, đối soát tự động hoặc bán thông tin ứng viên. Không bật bán dịch vụ trước khi nhóm chốt chính sách này và hoàn tất nghiệm thu thanh toán.

## Dữ liệu và tệp

D1 lưu bản ghi; R2 lưu PNG/JPEG/PDF tối đa5MB. Tải xuống qua API có kiểm tra quyền; không cung cấp URL bucket công khai. Kiểm tra chữ ký định dạng tệp không phải quét mã độc. Xem xét dịch vụ quét tệp trước khi mở tiếp nhận đại trà.

Áp dụng migrations theo thứ tự; không sửa migration đã triển khai. Tác vụ đa câu SQL dùng batch. Bản CV nộp được giữ nguyên khi sửa CV gốc. Không dùng browser localStorage làm dữ liệu nghiệp vụ.

Trước khi mở công khai: cấu hình quy trình sao lưu D1/R2 và diễn tập khôi phục, giám sát lỗi, chính sách lưu giữ/xóa dữ liệu, kênh hỗ trợ và xử lý báo cáo. Chưa có bằng chứng thử phục hồi hoặc thử tải trong bản bàn giao.

## Tài liệu API gốc dùng để viết adapter

- https://resend.com/docs/api-reference/emails/send-email
- https://docs.stripe.com/api/checkout/sessions/create
- https://docs.stripe.com/webhooks/signature

## Duy trì

Chạy TypeScript và bộ kiểm tra tích hợp sau khi sửa quyền, trạng thái, hạn mức, schema hoặc adapter. Bộ kiểm tra dùng Miniflare/D1/R2 tách biệt, không dùng dữ liệu môi trường thật. Không bật mock auth trong cấu hình managed hoặc production. Nếu chuyển sang host khác, phải thay tích hợp định danh; các header `oai-authenticated-*` chỉ đáng tin sau cổng nền tảng.

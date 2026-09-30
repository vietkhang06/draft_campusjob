# Kết quả kiểm tra — 26/09/2026 UTC

## Đã thực hiện

- TypeScript strict: kiểm tra kiểu không lỗi.
- Build Vinext/Worker: hoàn tất, có trang root, route trang động và API.
- 53 kiểm tra tích hợp nghiệp vụ đã đạt, chạy mã `Service` thực tế với D1/SQLite và R2 của Miniflare trong môi trường tách biệt. Không mock hàm truy vấn, không thay cơ sở dữ liệu bằng mảng hoặc dữ liệu trả về cứng. Test tạo các bản ghi riêng qua nghiệp vụ để thực hiện kiểm tra, sau đó hủy toàn bộ môi trường; không đưa chúng vào database triển khai.
- 14 kiểm tra HTTP trên Worker đã biên dịch đã đạt: trang chính/doanh nghiệp/không gian làm việc/quy tắc; session/tìm việc/danh sách công ty; chặn CV/admin/tệp khi chưa đăng nhập; CSRF; xác thực tác vụ; khóa cổng thanh toán khi thiếu cấu hình; không tạo bản ghi kinh doanh.
- Áp dụng ba migration lên D1 local thành công. Migration chỉ tạo/thay schema và index, không có seed.

## Các rủi ro nghiệp vụ đã kiểm tra

- Khởi tạo admin cần secret và chỉ một lần; không tự đăng ký admin/moderator.
- Doanh nghiệp chưa xác thực không đăng tin; không gắn chi nhánh của doanh nghiệp khác.
- Tin chưa duyệt không có trong tìm kiếm; employer không tự duyệt.
- Không đọc hoặc sửa hồ sơ của doanh nghiệp khác.
- Giới hạn 5 hồ sơ vẫn đúng khi nhiều thao tác ứng tuyển chạy đồng thời.
- Phiếu đã xem vẫn tính hạn mức; rút hợp lệ giải phóng suất; không rút khi đã phỏng vấn.
- Bản CV nộp không đổi khi CV gốc được sửa; không xóa CV đã nộp.
- Phải xem hồ sơ trước khi mời; không cập nhật trúng tuyển trước giờ phỏng vấn.
- Một đề nghị đổi lịch; hội thoại chỉ cho hai bên sau lời mời.
- Đánh giá chỉ khi có kết quả cuối; không đánh giá lặp; doanh nghiệp phản hồi một lần.
- Hai vi phạm đã xác nhận tạo cảnh cáo; cùng một sự việc không được đếm hai lần.
- Chưa đủ căn cứ không khóa; khóa dưới30 ngày bị từ chối; khóa đang hiệu lực chặn ứng tuyển; hết hạn phục hồi điều kiện.
- Chính xác30% một sao với10 đánh giá chưa tạo cờ; lớn hơn30% và đủ10 tạo cờ.
- Moderator không có quyền đình chỉ; chưa xác nhận báo cáo không thể đình chỉ; đình chỉ ẩn các tin và chặn employer đọc CV.
- Tám báo cáo truy vấn được dữ liệu thực tế trong DB kiểm tra.
- Không giả lập gửi mail/OTP hoặc tạo giao dịch khi thiếu provider.
- Lượt xem được khử lặp; thông báo bền vững; R2 đọc lại đúng byte đã ghi.

## Chưa kiểm tra / không được suy diễn thành đã đạt

- Đăng nhập SSO thật với nhiều tài khoản qua cổng Sites. Bài kiểm tra nghiệp vụ nhận identity ở đầu vào service; đây không phải kiểm thử đăng nhập đầu cuối.
- Tương tác bằng trình duyệt, ảnh chụp giao diện, hành vi trên thiết bị di động, bàn phím và trình đọc màn hình. Preview được khởi động nhưng kênh truy cập kiểm tra không hoạt động; không có đường điều khiển trình duyệt được phép thay thế trong phiên này.
- WebMCP `search_jobs` có mã đăng ký/hủy đăng ký và dùng API thật; chưa kiểm tra trong trình duyệt hỗ trợ WebMCP.
- Email vào hộp thư, OTP qua email trường thật, thanh toán Checkout thật và webhook từ provider. Chưa có thông tin cấu hình dịch vụ; không dùng gửi mail hoặc trả tiền giả để tuyên bố thành công.
- Chạy đúng giờ của scheduler ngoài nền tảng; endpoint private có thể cần cấu hình truy cập riêng.
- Kiểm thử tải, khôi phục sao lưu, quét mã độc tệp, đánh giá bảo mật độc lập và UAT của nhóm.

## Tái chạy

```sh
pnpm exec tsc --noEmit
node tests/integration.mjs
pnpm run build
node tests/runtime.mjs
```

`runtime.mjs` nạp toàn bộ module của artifact thực, khởi tạo storage tách biệt và gửi request HTTP vào Worker. Nó không mở website đã triển khai và không ghi vào dữ liệu sản phẩm.

export { api, uploadFile, getAccessToken, setAccessToken, clearAccessToken, refreshAccessToken, API_BASE } from './api';

export const labels: Record<string, string> = {
  student: 'Sinh viên',
  employer: 'Doanh nghiệp',
  moderator: 'Kiểm duyệt viên',
  admin: 'Quản trị viên',
  pending: 'Chờ xử lý',
  viewed: 'Đã xem',
  interview: 'Hẹn phỏng vấn',
  rejected: 'Từ chối',
  hired: 'Trúng tuyển',
  not_hired: 'Không trúng tuyển',
  withdrawn: 'Đã rút',
  active: 'Đang hoạt động',
  suspended: 'Đình chỉ',
  open: 'Đang tuyển',
  closed: 'Đã đóng',
  paused: 'Tạm dừng',
  invited: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  reschedule_requested: 'Đề nghị đổi lịch',
  reviewed: 'Đã thẩm tra',
  dismissed: 'Không xác nhận',
  warning: 'Cảnh cáo',
  application_lock: 'Khóa ứng tuyển',
  company_suspension: 'Đình chỉ doanh nghiệp',
  no_show: 'Vắng phỏng vấn',
  left_early: 'Bỏ việc tuần đầu',
  fraud: 'Dấu hiệu lừa đảo',
  queued: 'Chờ gửi',
  failed: 'Gửi thất bại',
  sent: 'Đã gửi',
  paid: 'Đã thanh toán',
  expired: 'Hết hạn thanh toán',
};

export const jobTypes = ['Thực tập', 'Bán thời gian', 'Toàn thời gian', 'Làm việc từ xa'];

export const industries = [
  'Công nghệ phần mềm',
  'Marketing',
  'Kế toán',
  'Thiết kế',
  'Ngoại ngữ – Biên phiên dịch',
  'Kinh doanh',
  'Giáo dục',
  'Nhà hàng – Khách sạn',
  'Hành chính – Nhân sự',
  'Khác',
];

export const fmtDate = (v: any) => (v ? new Date(v).toLocaleDateString('vi-VN') : '');

export const fmtTime = (v: any) =>
  v
    ? new Date(v).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '';

export const salary = (j: any) =>
  j.salary_min != null
    ? `${Number(j.salary_min).toLocaleString('vi-VN')} – ${Number(j.salary_max).toLocaleString('vi-VN')} đ/${
        j.salary_unit === 'hour' ? 'giờ' : 'tháng'
      }`
    : 'Lương thỏa thuận';

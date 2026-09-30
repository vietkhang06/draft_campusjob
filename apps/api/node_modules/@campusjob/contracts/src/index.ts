export type UserRole = 'student' | 'employer' | 'moderator' | 'admin';

export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'locked';

export interface ApiErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export interface AuthUserDto {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: string | null;
  profile: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: AuthUserDto;
}

export const LABELS: Record<string, string> = {
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

export const JOB_TYPES = ['Thực tập', 'Bán thời gian', 'Toàn thời gian', 'Làm việc từ xa'] as const;

export const INDUSTRIES = [
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
] as const;

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Building2, LoaderCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [role, setRole] = useState<'student' | 'employer'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError('Vui lòng nhập họ và tên hoặc tên người liên hệ.');
      return;
    }

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (password.length < 10) {
      setError('Mật khẩu phải có tối thiểu 10 ký tự.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setBusy(true);
    try {
      await register({
        email: trimmedEmail,
        password,
        name: trimmedName,
        role,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <div className="wrap page narrow" style={{ maxWidth: 520, margin: '60px auto' }}>
        <div className="panel" style={{ padding: '40px 32px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 28,
              background: '#eff6e8',
              color: '#2d7958',
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Đăng ký tài khoản thành công!</h1>
          <p className="muted" style={{ fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
            Hệ thống đã gửi liên kết xác minh đến địa chỉ email <strong>{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc Mailpit trong môi trường local) để kích hoạt tài khoản của bạn.
          </p>

          <div
            style={{
              background: '#f0fdf4',
              border: '1px dashed #22c55e',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 24,
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, color: '#166534', marginBottom: 4, fontSize: 14 }}>
              🛠️ Chế độ phát triển (Dev Mode):
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#15803d', lineHeight: 1.5 }}>
              Bạn đang dùng email ngẫu nhiên? Bạn có thể kích hoạt tài khoản ngay bằng mã test cố định <strong>123456</strong> mà không cần mở Mailpit.
            </p>
          </div>

          <div className="row center" style={{ gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={`/verify-email?email=${encodeURIComponent(email)}&token=123456`}
              className="button"
            >
              Kích hoạt ngay bằng mã test (123456)
            </Link>
            <Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="button light">
              Nhập mã tùy chọn
            </Link>
            <Link href="/login" className="button light">
              Đến trang đăng nhập
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page narrow" style={{ maxWidth: 520, margin: '50px auto' }}>
      <div className="panel" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <h1 style={{ fontSize: 26, margin: '0 0 8px' }}>Tạo tài khoản CampusJob</h1>
          <p className="muted" style={{ fontSize: 15, margin: 0 }}>
            Lựa chọn vai trò phù hợp để bắt đầu trải nghiệm
          </p>
        </div>

        {/* Role Selector: Student or Employer ONLY */}
        <div className="grid2" style={{ marginBottom: 22, gap: 14 }}>
          <button
            type="button"
            className="panel"
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              padding: 16,
              borderColor: role === 'student' ? '#2d7958' : '#e1e7e3',
              background: role === 'student' ? '#eff6e8' : 'white',
              boxShadow: role === 'student' ? '0 0 0 2px #2d7958' : 'none',
            }}
            onClick={() => setRole('student')}
          >
            <GraduationCap size={28} color="#2d7958" />
            <h3 style={{ margin: '10px 0 4px', fontSize: 17 }}>Tôi là sinh viên</h3>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Tạo CV, tìm việc làm thêm, thực tập
            </p>
          </button>

          <button
            type="button"
            className="panel"
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              padding: 16,
              borderColor: role === 'employer' ? '#2d7958' : '#e1e7e3',
              background: role === 'employer' ? '#eff6e8' : 'white',
              boxShadow: role === 'employer' ? '0 0 0 2px #2d7958' : 'none',
            }}
            onClick={() => setRole('employer')}
          >
            <Building2 size={28} color="#2d7958" />
            <h3 style={{ margin: '10px 0 4px', fontSize: 17 }}>Nhà tuyển dụng</h3>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Đăng tin, tìm kiếm và quản lý ứng viên
            </p>
          </button>
        </div>

        {error && (
          <div className="error-box" role="alert" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack">
          <label className="field full">
            <span>{role === 'student' ? 'Họ và tên sinh viên' : 'Tên người liên hệ / Đại diện doanh nghiệp'}</span>
            <input
              type="text"
              required
              placeholder={role === 'student' ? 'Nguyễn Văn A' : 'Trần Thị Tuyển Dụng'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </label>

          <label className="field full">
            <span>Email</span>
            <input
              type="email"
              required
              placeholder="ten@vi-du.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
            <span className="hint">
              {role === 'student'
                ? 'Có thể dùng email trường (.edu.vn) để xác minh tự động'
                : 'Khuyên dùng email doanh nghiệp để đẩy nhanh xác thực'}
            </span>
          </label>

          <label className="field full">
            <span>Mật khẩu</span>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Tối thiểu 10 ký tự, có chữ hoa, thường, số, ký tự đặc biệt"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                aria-label="Hiển thị mật khẩu"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6c7a71',
                  padding: 4,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <span className="hint">Tối thiểu 10 ký tự, gồm ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt</span>
          </label>

          <label className="field full">
            <span>Xác nhận mật khẩu</span>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={busy}
            />
          </label>

          <button
            type="submit"
            className="button"
            style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}
            disabled={busy}
          >
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                Đang tạo tài khoản…
              </>
            ) : (
              'Hoàn tất đăng ký'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }} className="muted">
          Đã có tài khoản?{' '}
          <Link href="/login" className="file-link" style={{ fontWeight: 600 }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}

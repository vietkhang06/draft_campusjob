'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Key, LoaderCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { api } from '@/lib/shared';
import { Loading } from '@/components/common-ui';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Vui lòng cung cấp mã đặt lại mật khẩu.');
      return;
    }

    if (password.length < 10) {
      setError('Mật khẩu mới phải có tối thiểu 10 ký tự.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{10,}$/;
    if (!passwordRegex.test(password)) {
      setError('Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setBusy(true);
    try {
      await api('auth/reset-password', 'POST', {
        token: token.trim(),
        password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Mã đặt lại mật khẩu không hợp lệ, đã hết hạn hoặc đã được sử dụng.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap page narrow" style={{ maxWidth: 460, margin: '60px auto' }}>
      <div className="panel" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: 26,
              background: '#eff6e8',
              color: '#2d7958',
              marginBottom: 16,
            }}
          >
            {success ? <CheckCircle2 size={30} /> : <Key size={28} />}
          </div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>
            {success ? 'Đặt lại mật khẩu thành công!' : 'Đặt lại mật khẩu mới'}
          </h1>
          <p className="muted" style={{ fontSize: 15, margin: 0 }}>
            {success
              ? 'Mật khẩu của bạn đã được cập nhật thành công.'
              : 'Thiết lập mật khẩu an toàn mới cho tài khoản của bạn.'}
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <Link
              href="/login"
              className="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              Đăng nhập với mật khẩu mới
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stack">
            {error && <div className="error-box">{error}</div>}

            {!tokenFromUrl && (
              <label className="field full">
                <span>Mã đặt lại mật khẩu (Token)</span>
                <input
                  type="text"
                  required
                  placeholder="Dán mã nhận được từ email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={busy}
                />
              </label>
            )}

            <label className="field full">
              <span>Mật khẩu mới</span>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Tối thiểu 10 ký tự, có hoa, thường, số, ký tự đặc biệt"
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
            </label>

            <label className="field full">
              <span>Xác nhận mật khẩu mới</span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={busy}
              />
            </label>

            <button
              type="submit"
              className="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              disabled={busy}
            >
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  Đang cập nhật…
                </>
              ) : (
                'Cập nhật mật khẩu'
              )}
            </button>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
              <Link href="/login" className="file-link">
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="wrap page narrow" style={{ maxWidth: 460, margin: '60px auto' }}>
          <Loading />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

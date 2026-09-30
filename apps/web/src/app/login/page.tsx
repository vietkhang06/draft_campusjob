'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BriefcaseBusiness, LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Loading } from '@/components/common-ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('return_to') || '/workspace';
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setBusy(true);
    try {
      await login(trimmedEmail, password);
      router.push(returnTo);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
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
              borderRadius: 12,
              background: '#2d7958',
              color: 'white',
              marginBottom: 16,
            }}
          >
            <BriefcaseBusiness size={28} />
          </div>
          <h1 style={{ fontSize: 26, margin: '0 0 8px' }}>Đăng nhập CampusJob</h1>
          <p className="muted" style={{ fontSize: 15, margin: 0 }}>
            Kết nối cơ hội việc làm thêm và thực tập chất lượng
          </p>
        </div>

        {error && (
          <div className="error-box" role="alert" style={{ marginBottom: 20 }}>
            <div>{error}</div>
            {error.includes('chưa được xác minh') && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #fca5a5' }}>
                <Link
                  href={`/verify-email?email=${encodeURIComponent(email)}&token=123456`}
                  style={{ color: '#2d7958', fontWeight: 600, textDecoration: 'underline', fontSize: 13 }}
                >
                  👉 Bấm vào đây để kích hoạt tài khoản ngay bằng mã test (123456)
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="stack">
          <label className="field full">
            <span>Email</span>
            <input
              type="email"
              required
              autoFocus
              placeholder="ten@vi-du.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </label>

          <label className="field full">
            <div className="row between" style={{ marginBottom: 6 }}>
              <span>Mật khẩu</span>
              <Link href="/forgot-password" className="subtitle" style={{ fontSize: 13 }}>
                Quên mật khẩu?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••••••"
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

          <button
            type="submit"
            className="button"
            style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}
            disabled={busy}
          >
            {busy ? (
              <>
                <LoaderCircle className="animate-spin" size={18} />
                Đang xác thực…
              </>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }} className="muted">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="file-link" style={{ fontWeight: 600 }}>
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="wrap page narrow" style={{ maxWidth: 460, margin: '60px auto' }}>
          <Loading />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

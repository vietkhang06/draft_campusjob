'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Mail, LoaderCircle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/shared';
import { Loading } from '@/components/common-ui';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const emailFromUrl = searchParams.get('email') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState(emailFromUrl);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Resend section
  const [resendEmail, setResendEmail] = useState(emailFromUrl);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async (tokenToUse: string, emailToUse?: string) => {
    if (!tokenToUse.trim()) {
      setError('Vui lòng cung cấp mã xác minh.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await api('auth/verify-email', 'POST', {
        token: tokenToUse.trim(),
        email: (emailToUse !== undefined ? emailToUse : email).trim() || undefined,
      });
      setSuccess(true);
      if (res?.message) {
        setSuccessMessage(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Mã xác minh không hợp lệ hoặc đã hết hạn.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (tokenFromUrl) {
      handleVerify(tokenFromUrl, emailFromUrl);
    }
  }, [tokenFromUrl, emailFromUrl]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = resendEmail.trim() || email.trim();
    if (!targetEmail) return;

    setResendBusy(true);
    setResendMessage('');
    try {
      const data = await api('auth/resend-verification', 'POST', { email: targetEmail });
      setResendMessage(data.message || 'Liên kết xác minh mới đã được gửi vào hộp thư của bạn.');
    } catch (err: any) {
      setResendMessage(err.message || 'Không thể gửi lại liên kết xác minh.');
    } finally {
      setResendBusy(false);
    }
  };

  return (
    <div className="wrap page narrow" style={{ maxWidth: 480, margin: '60px auto' }}>
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
            {success ? <CheckCircle2 size={32} /> : <Mail size={28} />}
          </div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>
            {success ? 'Xác minh email thành công!' : 'Xác minh tài khoản'}
          </h1>
          <p className="muted" style={{ fontSize: 15, margin: 0 }}>
            {success
              ? (successMessage || 'Tài khoản của bạn đã được kích hoạt và sẵn sàng sử dụng.')
              : 'Xác nhận địa chỉ email của bạn để tiếp tục.'}
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <Link
              href="/login"
              className="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              Đăng nhập ngay <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div>
            {error && (
              <div className="error-box" role="alert" style={{ marginBottom: 20 }}>
                {error}
              </div>
            )}

            {/* Dev helper box */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px dashed #94a3b8',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                    🛠️ Dev Test Code: <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>123456</code>
                  </span>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Dùng cho email ngẫu nhiên để kích hoạt ngay mà không cần mở Mailpit
                  </div>
                </div>
                <button
                  type="button"
                  className="button light small"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  onClick={() => setToken('123456')}
                >
                  Điền mã test 123456
                </button>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(token);
              }}
              className="stack"
            >
              <label className="field full">
                <span>Email tài khoản (tùy chọn hoặc nếu dùng mã test)</span>
                <input
                  type="email"
                  placeholder="ví dụ: test1234@random.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!resendEmail) setResendEmail(e.target.value);
                  }}
                  disabled={busy}
                />
              </label>

              <label className="field full">
                <span>Mã xác minh (Token hoặc mã test)</span>
                <input
                  type="text"
                  placeholder="Dán mã xác minh từ email hoặc nhập 123456"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={busy}
                />
              </label>

              <button
                type="submit"
                className="button"
                style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                disabled={busy}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="animate-spin" size={18} />
                    Đang xác minh…
                  </>
                ) : (
                  'Kích hoạt tài khoản'
                )}
              </button>
            </form>

            <div style={{ borderTop: '1px solid #e1e7e3', marginTop: 32, paddingTop: 24 }}>
              <h3 style={{ fontSize: 15, marginBottom: 8 }}>Chưa nhận được email hoặc mã hết hạn?</h3>
              <form onSubmit={handleResend} className="stack">
                <input
                  type="email"
                  placeholder="Nhập email để nhận lại mã"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  disabled={resendBusy}
                />
                <button type="submit" className="button light small" disabled={resendBusy || (!resendEmail && !email)}>
                  {resendBusy ? 'Đang gửi…' : 'Gửi lại liên kết xác minh'}
                </button>
              </form>
              {resendMessage && (
                <p className="subtitle" style={{ marginTop: 12 }}>
                  {resendMessage}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14 }}>
              <Link href="/login" className="file-link">
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="wrap page narrow" style={{ maxWidth: 480, margin: '60px auto' }}>
          <Loading />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}

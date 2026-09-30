'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { KeyRound, LoaderCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/shared';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }

    setBusy(true);
    try {
      await api('auth/forgot-password', 'POST', { email: trimmedEmail });
      setSubmitted(true);
    } catch (err: any) {
      // Still show success or handle error without leaking existence
      setSubmitted(true);
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
            {submitted ? <CheckCircle2 size={30} /> : <KeyRound size={28} />}
          </div>
          <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>Quên mật khẩu?</h1>
          <p className="muted" style={{ fontSize: 15, margin: 0 }}>
            {submitted
              ? 'Yêu cầu đặt lại mật khẩu đã được ghi nhận.'
              : 'Nhập email để nhận liên kết đặt lại mật khẩu của bạn.'}
          </p>
        </div>

        {submitted ? (
          <div className="stack" style={{ textAlign: 'center' }}>
            <p className="subtitle" style={{ lineHeight: 1.6, fontSize: 14 }}>
              Nếu địa chỉ email <strong>{email}</strong> tồn tại trên hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến hộp thư của bạn. Vui lòng kiểm tra hộp thư đến (hoặc Mailpit trên máy local).
            </p>
            <div style={{ marginTop: 20 }}>
              <Link href="/login" className="button" style={{ width: '100%', justifyContent: 'center' }}>
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="stack">
            {error && <div className="error-box">{error}</div>}

            <label className="field full">
              <span>Địa chỉ email đã đăng ký</span>
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

            <button
              type="submit"
              className="button"
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
              disabled={busy}
            >
              {busy ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  Đang xử lý…
                </>
              ) : (
                'Gửi liên kết đặt lại mật khẩu'
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

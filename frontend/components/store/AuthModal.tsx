'use client';

import { useState, useEffect } from 'react';
import { useCustomerAuthStore } from '@/lib/store';
import { customerLogin, customerRegister } from '@/lib/api';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api').replace('/api', '');

function openOAuthPopup(provider: 'google' | 'facebook') {
  const url = `${API_BASE}/api/auth/${provider}`;
  const popup = window.open(url, 'oauth_login', 'width=520,height=620,left=200,top=100');
  return popup;
}

export function AuthModal() {
  const { authOpen, closeAuth, setAuth } = useCustomerAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen for OAuth popup postMessage
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== 'oauth_token') return;
      const { token, user } = event.data;
      if (token && user) {
        setAuth(user, token);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setAuth]);

  if (!authOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await customerLogin(email, password);
      } else {
        result = await customerRegister(email, password, name);
      }
      if (result.user.role !== 'customer') {
        setError('บัญชีนี้ไม่ใช่บัญชีลูกค้า');
        return;
      }
      setAuth(result.user, result.accessToken);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'facebook') => {
    openOAuthPopup(provider);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={closeAuth}>
      <div
        className="bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--line)] w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--ink)]">
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </h2>
            <p className="text-xs text-[var(--ink-4)] mt-0.5">Kraft Market</p>
          </div>
          <button onClick={closeAuth} className="p-2 rounded-full hover:bg-[var(--bg-2)] transition-colors text-[var(--ink-4)]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* Social login */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[var(--line)] rounded-xl text-sm font-medium hover:bg-[var(--bg-2)] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              onClick={() => handleOAuth('facebook')}
              className="flex items-center justify-center gap-2 px-3 py-2.5 border border-[var(--line)] rounded-xl text-sm font-medium hover:bg-[var(--bg-2)] transition-colors"
            >
              <svg className="w-4 h-4" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[var(--line)]" />
            <span className="text-xs text-[var(--ink-4)]">หรือ</span>
            <div className="flex-1 h-px bg-[var(--line)]" />
          </div>

          {/* Email/password form */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อ-นามสกุล"
                className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
              />
            )}
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="อีเมล"
              className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            />
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
              minLength={6}
              className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--coral)] text-white font-semibold rounded-xl hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'กำลังโหลด...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-xs text-[var(--ink-4)]">
            {mode === 'login' ? (
              <>ยังไม่มีบัญชี?{' '}
                <button onClick={() => { setMode('register'); setError(''); }} className="text-[var(--coral)] font-medium hover:underline">
                  สมัครสมาชิก
                </button>
              </>
            ) : (
              <>มีบัญชีแล้ว?{' '}
                <button onClick={() => { setMode('login'); setError(''); }} className="text-[var(--coral)] font-medium hover:underline">
                  เข้าสู่ระบบ
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

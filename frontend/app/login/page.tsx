'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { accessToken, user } = await login(email, password);
      setAuth(user, accessToken);
      document.cookie = `kraft_token=${accessToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--surface)] rounded-2xl shadow-lg p-8 border border-[var(--line)]">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-[var(--coral)]">Kraft Market</h1>
          <p className="text-sm text-[var(--ink-4)] mt-1">เข้าสู่ระบบจัดการ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-[var(--ink-3)] block mb-1">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@kraft.market"
              required
              className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--ink-3)] block mb-1">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[var(--coral)] text-white font-semibold rounded-xl hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--ink-4)] mt-6">
          <a href="/" className="hover:text-[var(--ink)] transition-colors">← กลับหน้าร้านค้า</a>
        </p>
      </div>
    </div>
  );
}

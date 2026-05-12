'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StoreHeader } from '@/components/store/StoreHeader';
import { useCustomerAuthStore } from '@/lib/store';
import { getMyProfile, updateMyProfile, getMyOrders } from '@/lib/api';

const STATUS_TH: Record<string, string> = {
  pending: 'รอดำเนินการ',
  paid: 'ชำระแล้ว',
  shipped: 'จัดส่งแล้ว',
  completed: 'สำเร็จ',
  cancelled: 'ยกเลิก',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-blue-50 text-blue-700',
  shipped: 'bg-purple-50 text-purple-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-500',
};

export default function AccountPage() {
  const router = useRouter();
  const { isLoggedIn, openAuth, clearAuth } = useCustomerAuthStore();
  const [tab, setTab] = useState<'profile' | 'orders'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', avatarUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { openAuth(); return; }
    getMyProfile().then((p) => {
      setProfile(p);
      setForm({ name: p.name ?? '', phone: p.phone ?? '', avatarUrl: p.avatarUrl ?? '' });
    });
    getMyOrders().then((o) => setOrders(Array.isArray(o) ? o : []));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateMyProfile(form);
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn()) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <StoreHeader />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <p className="text-[var(--ink-3)] mb-4">กรุณาเข้าสู่ระบบก่อน</p>
          <button onClick={openAuth} className="px-5 py-2.5 bg-[var(--coral)] text-white rounded-full font-semibold text-sm hover:bg-[var(--coral-deep)] transition-colors">
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <StoreHeader />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--coral)] flex items-center justify-center text-white text-2xl font-bold shrink-0 overflow-hidden">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{form.name?.[0]?.toUpperCase() ?? 'U'}</span>
            )}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-[var(--ink)]">{form.name || profile?.email}</h1>
            <p className="text-sm text-[var(--ink-4)]">{profile?.email}</p>
          </div>
          <button
            onClick={() => { clearAuth(); router.push('/'); }}
            className="ml-auto text-xs text-[var(--ink-4)] hover:text-red-500 transition-colors"
          >
            ออกจากระบบ
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[var(--line)]">
          {(['profile', 'orders'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 text-sm font-medium transition-colors -mb-px border-b-2 ${tab === t ? 'border-[var(--coral)] text-[var(--coral)]' : 'border-transparent text-[var(--ink-4)] hover:text-[var(--ink)]'}`}
            >
              {t === 'profile' ? '⚙️ โปรไฟล์' : '📦 ประวัติซื้อ'}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {tab === 'profile' && (
          <form onSubmit={handleSave} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 space-y-4">
            {saved && <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">✓ บันทึกแล้ว</div>}
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">ชื่อ-นามสกุล</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">เบอร์โทร</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="08X-XXX-XXXX"
                className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">URL รูปโปรไฟล์</label>
              <input
                type="url"
                value={form.avatarUrl}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
              />
            </div>
            <div className="text-xs text-[var(--ink-4)] bg-[var(--bg-2)] rounded-xl px-3 py-2">
              อีเมล: {profile?.email} (ไม่สามารถเปลี่ยนได้)
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 bg-[var(--coral)] text-white font-semibold rounded-xl hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50 text-sm"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </form>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-[var(--surface)] border border-[var(--line)] rounded-2xl">
                <div className="text-4xl mb-3">📦</div>
                <p className="font-semibold text-[var(--ink-3)]">ยังไม่มีประวัติซื้อ</p>
                <a href="/products" className="mt-3 inline-block text-sm text-[var(--coral)] hover:underline">เริ่มช้อปเลย →</a>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order._id} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-[var(--ink-4)] font-mono">{order.receiptNumber}</p>
                      <p className="text-xs text-[var(--ink-4)]">{new Date(order.createdAt).toLocaleDateString('th-TH', { dateStyle: 'medium' })}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLOR[order.status] ?? 'bg-[var(--bg-2)] text-[var(--ink-3)]'}`}>
                        {STATUS_TH[order.status] ?? order.status}
                      </span>
                      <p className="font-bold text-[var(--ink)] mt-1">฿{order.total?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-[var(--line)]">
                    {(order.items ?? []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--ink)] truncate">{item.name}</p>
                          <p className="text-xs text-[var(--ink-4)]">x{item.qty} · ฿{item.price?.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

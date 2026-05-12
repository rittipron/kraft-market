'use client';

import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const fetcher = (url: string) => fetch(url).then((r) => r.json());
const SETTINGS_URL = `${BASE}/settings`;

interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  promptpayId: string;
  facebookUrl: string;
  lineId: string;
  vatPercent: number;
  logoUrl: string;
}

const FIELD_GROUPS = [
  {
    title: 'ข้อมูลร้าน',
    fields: [
      { key: 'storeName', label: 'ชื่อร้าน', type: 'text', placeholder: 'Kraft Market' },
      { key: 'tagline', label: 'สโลแกน', type: 'text', placeholder: 'ของดี ของจริง จากคนทำมือทั่วไทย' },
      { key: 'logoUrl', label: 'URL โลโก้', type: 'text', placeholder: 'https://...' },
    ],
  },
  {
    title: 'ติดต่อ',
    fields: [
      { key: 'phone', label: 'เบอร์โทร', type: 'tel', placeholder: '02-xxx-xxxx' },
      { key: 'email', label: 'อีเมล', type: 'email', placeholder: 'info@kraftmarket.com' },
      { key: 'address', label: 'ที่อยู่', type: 'textarea', placeholder: 'เลขที่ ถนน ตำบล อำเภอ จังหวัด' },
    ],
  },
  {
    title: 'โซเชียลมีเดีย',
    fields: [
      { key: 'facebookUrl', label: 'Facebook URL', type: 'url', placeholder: 'https://facebook.com/...' },
      { key: 'lineId', label: 'Line ID', type: 'text', placeholder: '@kraftmarket' },
    ],
  },
  {
    title: 'การชำระเงิน',
    fields: [
      { key: 'promptpayId', label: 'พร้อมเพย์ (เบอร์/เลข 13 หลัก)', type: 'text', placeholder: '0800000001' },
      { key: 'vatPercent', label: 'VAT (%)', type: 'number', placeholder: '7' },
    ],
  },
];

export default function SettingsPage() {
  const { data: settings, isLoading } = useSWR<StoreSettings>(SETTINGS_URL, fetcher);
  const [form, setForm] = useState<Partial<StoreSettings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(SETTINGS_URL, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('kraft_token')}`,
        },
        body: JSON.stringify(form),
      });
      mutate(SETTINGS_URL);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl space-y-6 animate-pulse">
        <div className="h-8 bg-[var(--bg-2)] rounded w-32" />
        {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-[var(--bg-2)] rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Settings</h1>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-[var(--good)]">✓ บันทึกแล้ว</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-[var(--coral)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {FIELD_GROUPS.map((group) => (
          <div key={group.title} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6">
            <h2 className="font-semibold text-[var(--ink)] mb-4">{group.title}</h2>
            <div className="space-y-4">
              {group.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[var(--ink-3)] mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      rows={3}
                      value={(form as any)[field.key] ?? ''}
                      onChange={(e) => set(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)] resize-none"
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={(form as any)[field.key] ?? ''}
                      onChange={(e) => set(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

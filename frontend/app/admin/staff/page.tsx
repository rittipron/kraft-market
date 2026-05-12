'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { getStaff, createStaff, updateStaff, updateStaffPermissions, deleteStaff } from '@/lib/api';
import type { StaffMember } from '@/lib/api';

const ALL_MENUS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'สินค้า' },
  { key: 'orders', label: 'คำสั่งซื้อ' },
  { key: 'pos', label: 'POS' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'customers', label: 'ลูกค้า' },
  { key: 'media', label: 'Media' },
  { key: 'pages', label: 'หน้าเพจ' },
  { key: 'builder', label: 'Page Builder' },
  { key: 'nav', label: 'Navbar' },
  { key: 'settings', label: 'Settings' },
];

const EMPTY_FORM = { name: '', email: '', password: '', menuPermissions: ALL_MENUS.map((m) => m.key) };

export default function StaffPage() {
  const { data: staff = [], isLoading } = useSWR<StaffMember[]>('/staff-list', getStaff);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [permStaff, setPermStaff] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tempPerms, setTempPerms] = useState<string[]>([]);

  const refresh = () => mutate('/staff-list');

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (s: StaffMember) => {
    setEditingId(s._id);
    setForm({ name: s.name, email: s.email, password: '', menuPermissions: s.menuPermissions });
    setError('');
    setShowForm(true);
  };

  const openPerms = (s: StaffMember) => {
    setPermStaff(s);
    setTempPerms([...s.menuPermissions]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const data: any = { name: form.name, email: form.email };
        if (form.password) data.password = form.password;
        await updateStaff(editingId, data);
      } else {
        await createStaff({ name: form.name, email: form.email, password: form.password, menuPermissions: form.menuPermissions });
      }
      refresh();
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (s: StaffMember) => {
    await updateStaff(s._id, { isActive: !s.isActive });
    refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ลบพนักงานคนนี้?')) return;
    await deleteStaff(id);
    refresh();
  };

  const handleSavePerms = async () => {
    if (!permStaff) return;
    setSaving(true);
    try {
      await updateStaffPermissions(permStaff._id, tempPerms);
      refresh();
      setPermStaff(null);
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (key: string) => {
    setTempPerms((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key]);
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">จัดการพนักงาน</h1>
          <p className="text-[var(--ink-4)] text-sm">{staff.length} คน</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-[var(--coral)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors"
        >
          + เพิ่มพนักงาน
        </button>
      </div>

      {/* Staff table */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--ink-4)]">กำลังโหลด...</div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👤</div>
            <p className="font-semibold text-[var(--ink-3)]">ยังไม่มีพนักงาน</p>
            <p className="text-sm text-[var(--ink-4)] mt-1">กด "เพิ่มพนักงาน" เพื่อเริ่มต้น</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--bg-2)] text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wide">ชื่อ / อีเมล</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wide">สิทธิ์เมนู</th>
                <th className="px-4 py-3 text-xs font-semibold text-[var(--ink-3)] uppercase tracking-wide">สถานะ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {staff.map((s) => (
                <tr key={s._id} className="hover:bg-[var(--bg-2)] transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--ink)] text-sm">{s.name}</p>
                    <p className="text-xs text-[var(--ink-4)]">{s.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.menuPermissions.length === ALL_MENUS.length ? (
                        <span className="px-2 py-0.5 bg-[var(--teal-soft)] text-[var(--teal)] text-xs rounded-full font-medium">ทั้งหมด</span>
                      ) : s.menuPermissions.length === 0 ? (
                        <span className="px-2 py-0.5 bg-red-50 text-red-500 text-xs rounded-full font-medium">ไม่มีสิทธิ์</span>
                      ) : (
                        s.menuPermissions.slice(0, 3).map((k) => (
                          <span key={k} className="px-2 py-0.5 bg-[var(--bg-2)] text-[var(--ink-3)] text-xs rounded-full">{ALL_MENUS.find((m) => m.key === k)?.label ?? k}</span>
                        ))
                      )}
                      {s.menuPermissions.length > 3 && s.menuPermissions.length < ALL_MENUS.length && (
                        <span className="px-2 py-0.5 text-[var(--ink-4)] text-xs">+{s.menuPermissions.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(s)}
                      className={`px-2 py-0.5 text-xs rounded-full font-medium transition-colors ${s.isActive ? 'bg-[var(--good-soft)] text-[var(--good)]' : 'bg-red-50 text-red-500'}`}
                    >
                      {s.isActive ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openPerms(s)} className="text-xs text-[var(--teal)] hover:underline">สิทธิ์</button>
                      <button onClick={() => openEdit(s)} className="text-xs text-[var(--ink-3)] hover:text-[var(--coral)]">แก้ไข</button>
                      <button onClick={() => handleDelete(s._id)} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--line)]">
              <h3 className="font-semibold text-[var(--ink)]">{editingId ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}</h3>
              <button onClick={() => setShowForm(false)} className="text-[var(--ink-4)] hover:text-[var(--ink)]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>}
              <div>
                <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">ชื่อ *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">อีเมล *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">
                  รหัสผ่าน {editingId ? '(เว้นว่างถ้าไม่เปลี่ยน)' : '*'}
                </label>
                <input required={!editingId} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  minLength={6}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]" />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-semibold text-[var(--ink-3)] mb-2">สิทธิ์เมนูเริ่มต้น</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ALL_MENUS.map((m) => (
                      <label key={m.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.menuPermissions.includes(m.key)}
                          onChange={() => setForm((f) => ({
                            ...f,
                            menuPermissions: f.menuPermissions.includes(m.key)
                              ? f.menuPermissions.filter((k) => k !== m.key)
                              : [...f.menuPermissions, m.key],
                          }))}
                          className="accent-[var(--coral)]"
                        />
                        <span className="text-[var(--ink-3)]">{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 bg-[var(--coral)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-[var(--line)] text-[var(--ink-3)] rounded-xl text-sm font-semibold hover:bg-[var(--bg-2)] transition-colors">
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions modal */}
      {permStaff && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--line)]">
              <div>
                <h3 className="font-semibold text-[var(--ink)]">สิทธิ์เมนู</h3>
                <p className="text-xs text-[var(--ink-4)]">{permStaff.name}</p>
              </div>
              <button onClick={() => setPermStaff(null)} className="text-[var(--ink-4)] hover:text-[var(--ink)]">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex gap-2 mb-3">
                <button onClick={() => setTempPerms(ALL_MENUS.map((m) => m.key))} className="text-xs text-[var(--teal)] hover:underline">เลือกทั้งหมด</button>
                <span className="text-[var(--line)]">·</span>
                <button onClick={() => setTempPerms([])} className="text-xs text-red-400 hover:underline">ล้างทั้งหมด</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ALL_MENUS.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--bg-2)] cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={tempPerms.includes(m.key)}
                      onChange={() => togglePerm(m.key)}
                      className="accent-[var(--coral)]"
                    />
                    <span className="text-sm text-[var(--ink-3)]">{m.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSavePerms} disabled={saving}
                  className="flex-1 py-2.5 bg-[var(--coral)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50">
                  {saving ? 'กำลังบันทึก...' : 'บันทึกสิทธิ์'}
                </button>
                <button onClick={() => setPermStaff(null)}
                  className="flex-1 py-2.5 border border-[var(--line)] text-[var(--ink-3)] rounded-xl text-sm font-semibold hover:bg-[var(--bg-2)] transition-colors">
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

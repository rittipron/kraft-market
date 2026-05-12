'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import type { NavItem } from '@/lib/api';
import { createNavItem, updateNavItem, deleteNavItem, reorderNav } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const authedFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

const NAV_URL = `${BASE}/nav`;

type NavType = 'url' | 'page' | 'category';
const EMPTY_FORM: { label: string; type: NavType; url: string; parentId: string } = { label: '', type: 'url', url: '', parentId: '' };

export default function NavAdminPage() {
  const { data: items = [], isLoading } = useSWR<NavItem[]>(NAV_URL, authedFetch);
  const [editItem, setEditItem] = useState<NavItem | null>(null);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const topLevel = items.filter((i) => !i.parentId);
  const childrenOf = (id: string) => items.filter((i) => i.parentId === id);

  const openNew = (parentId = '') => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, parentId });
    setShowForm(true);
    setError('');
  };

  const openEdit = (item: NavItem) => {
    setEditItem(item);
    setForm({ label: item.label, type: item.type, url: item.url || '', parentId: item.parentId || '' });
    setShowForm(true);
    setError('');
  };

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.label.trim()) { setError('กรุณาใส่ชื่อเมนู'); return; }
    setSaving(true);
    setError('');
    try {
      const payload: Partial<NavItem> = {
        label: form.label.trim(),
        type: form.type,
        url: form.url || undefined,
        parentId: form.parentId || null,
        isVisible: editItem?.isVisible ?? true,
        openInNewTab: editItem?.openInNewTab ?? false,
      };
      if (editItem) {
        await updateNavItem(editItem._id, payload);
      } else {
        await createNavItem(payload);
      }
      mutate(NAV_URL);
      setShowForm(false);
    } catch (e: any) {
      setError(e.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: NavItem) => {
    const hasChildren = childrenOf(item._id).length > 0;
    const msg = hasChildren
      ? `ลบเมนู "${item.label}" และเมนูย่อยทั้งหมด?`
      : `ลบเมนู "${item.label}"?`;
    if (!confirm(msg)) return;
    await deleteNavItem(item._id);
    mutate(NAV_URL);
  };

  const handleToggleVisible = async (item: NavItem) => {
    await updateNavItem(item._id, { isVisible: !item.isVisible });
    mutate(NAV_URL);
  };

  const moveItem = async (item: NavItem, dir: -1 | 1) => {
    const siblings = item.parentId ? childrenOf(item.parentId) : topLevel;
    const idx = siblings.findIndex((i) => i._id === item._id);
    const swap = siblings[idx + dir];
    if (!swap) return;

    // Optimistic update — swap orders in local cache immediately
    const optimistic = items.map((i) => {
      if (i._id === item._id) return { ...i, order: swap.order };
      if (i._id === swap._id) return { ...i, order: item.order };
      return i;
    });
    mutate(NAV_URL, optimistic, false);

    // Sync to backend, then revalidate
    await reorderNav([
      { id: item._id, order: swap.order },
      { id: swap._id, order: item.order },
    ]);
    mutate(NAV_URL);
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">จัดการ Navbar</h1>
          <p className="text-[var(--ink-4)] text-sm">{topLevel.length} รายการหลัก</p>
        </div>
        <button
          onClick={() => openNew()}
          className="px-4 py-2 bg-[var(--coral)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors"
        >
          + เพิ่มเมนู
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] w-full max-w-md p-6 shadow-xl">
            <h2 className="font-display font-bold text-lg mb-4">{editItem ? 'แก้ไขเมนู' : 'เพิ่มเมนูใหม่'}</h2>
            {error && <div className="mb-3 p-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--ink-3)] mb-1 block">ชื่อเมนู *</label>
                <input
                  value={form.label}
                  onChange={(e) => set('label', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
                  placeholder="เช่น สินค้า, เกี่ยวกับเรา"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--ink-3)] mb-1 block">ประเภทลิงก์</label>
                <select
                  value={form.type}
                  onChange={(e) => set('type', e.target.value as NavType)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
                >
                  <option value="url">URL ตรง</option>
                  <option value="page">หน้า CMS</option>
                  <option value="category">หมวดหมู่</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--ink-3)] mb-1 block">
                  {form.type === 'url' ? 'URL' : form.type === 'page' ? 'Slug หน้า (เช่น /about)' : 'URL หมวดหมู่'}
                </label>
                <input
                  value={form.url}
                  onChange={(e) => set('url', e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
                  placeholder={form.type === 'url' ? 'https://... หรือ /' : '/slug-name'}
                />
              </div>
              {!editItem && topLevel.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-[var(--ink-3)] mb-1 block">เมนูแม่ (ถ้าเป็นเมนูย่อย)</label>
                  <select
                    value={form.parentId}
                    onChange={(e) => set('parentId', e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
                  >
                    <option value="">— ไม่มี (เมนูหลัก) —</option>
                    {topLevel.map((i) => (
                      <option key={i._id} value={i._id}>{i.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-[var(--coral)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--coral-deep)] disabled:opacity-50">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 py-2 border border-[var(--line)] text-[var(--ink-3)] rounded-lg text-sm hover:bg-[var(--bg-2)]">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav tree */}
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[var(--ink-4)] text-sm animate-pulse">กำลังโหลด...</div>
        ) : topLevel.length === 0 ? (
          <div className="p-12 text-center text-[var(--ink-4)]">
            <div className="text-4xl mb-3">🔗</div>
            <p className="font-semibold mb-1">ยังไม่มีเมนู</p>
            <button onClick={() => openNew()} className="mt-2 text-sm text-[var(--coral)] hover:underline">เพิ่มเมนูแรก →</button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {topLevel.map((item, idx) => (
              <div key={item._id}>
                <NavRow
                  item={item}
                  idx={idx}
                  total={topLevel.length}
                  level={0}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onToggle={handleToggleVisible}
                  onMove={moveItem}
                  onAddChild={() => openNew(item._id)}
                />
                {childrenOf(item._id).map((child, cidx) => (
                  <NavRow
                    key={child._id}
                    item={child}
                    idx={cidx}
                    total={childrenOf(item._id).length}
                    level={1}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onToggle={handleToggleVisible}
                    onMove={moveItem}
                    onAddChild={() => {}}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NavRow({
  item, idx, total, level, onEdit, onDelete, onToggle, onMove, onAddChild,
}: {
  item: NavItem; idx: number; total: number; level: number;
  onEdit: (i: NavItem) => void;
  onDelete: (i: NavItem) => void;
  onToggle: (i: NavItem) => void;
  onMove: (i: NavItem, dir: -1 | 1) => void;
  onAddChild: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg)] transition-colors ${!item.isVisible ? 'opacity-50' : ''}`}>
      {level === 1 && <span className="text-[var(--ink-4)] text-xs ml-4">↳</span>}
      <div className="flex flex-col gap-0.5">
        <button onClick={() => onMove(item, -1)} disabled={idx === 0} className="text-[var(--ink-4)] hover:text-[var(--coral)] disabled:opacity-20 text-xs leading-none">▲</button>
        <button onClick={() => onMove(item, 1)} disabled={idx === total - 1} className="text-[var(--ink-4)] hover:text-[var(--coral)] disabled:opacity-20 text-xs leading-none">▼</button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-[var(--ink)] truncate">{item.label}</p>
        <p className="text-xs text-[var(--ink-4)] font-mono truncate">{item.url || `[${item.type}]`}</p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'page' ? 'bg-blue-100 text-blue-700' : item.type === 'category' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
        {item.type}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {level === 0 && (
          <button onClick={onAddChild} className="text-xs text-[var(--teal)] hover:underline">+ เมนูย่อย</button>
        )}
        <button
          onClick={() => onToggle(item)}
          className={`text-xs ${item.isVisible ? 'text-[var(--good)]' : 'text-[var(--ink-4)]'} hover:underline`}
        >
          {item.isVisible ? 'แสดง' : 'ซ่อน'}
        </button>
        <button onClick={() => onEdit(item)} className="text-xs text-[var(--teal)] hover:underline">แก้ไข</button>
        <button onClick={() => onDelete(item)} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
      </div>
    </div>
  );
}

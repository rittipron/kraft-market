'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/api';
import { ImageManager } from '@/components/admin/ImageManager';

const EMPTY_FORM = {
  name: '',
  price: '',
  sku: '',
  stock: '0',
  description: '',
  tags: '',
  status: 'active' as const,
};


export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createProduct({
        name: form.name,
        price: parseFloat(form.price),
        sku: form.sku || undefined,
        stock: parseInt(form.stock, 10),
        description: form.description || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images,
        status: form.status,
      });
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/products" className="text-[var(--ink-4)] hover:text-[var(--coral)] text-sm">← สินค้า</a>
        <span className="text-[var(--line)]">/</span>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">เพิ่มสินค้าใหม่</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-6">
        <div>
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">ชื่อสินค้า *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            placeholder="ชื่อสินค้า"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">ราคา (฿) *</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">จำนวนคงเหลือ</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => set('stock', e.target.value)}
              className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">SKU</label>
          <input
            value={form.sku}
            onChange={(e) => set('sku', e.target.value)}
            className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)] font-mono"
            placeholder="KRF-001 (ถ้าไม่ใส่จะ generate อัตโนมัติ)"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">รายละเอียด</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)] resize-none"
            placeholder="รายละเอียดสินค้า..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">รูปภาพสินค้า</label>
          <ImageManager images={images} onChange={setImages} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">Tags</label>
          <input
            value={form.tags}
            onChange={(e) => set('tags', e.target.value)}
            className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
            placeholder="กาแฟ, เครื่องดื่ม, ออร์แกนิค (คั่นด้วย ,)"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">สถานะ</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value as any)}
            className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
          >
            <option value="active">Active — แสดงในร้าน</option>
            <option value="draft">Draft — ซ่อนจากร้าน</option>
            <option value="archived">Archived — เก็บถาวร</option>
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-[var(--coral)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
          </button>
          <a
            href="/admin/products"
            className="px-6 py-2.5 border border-[var(--line)] text-[var(--ink-3)] rounded-xl text-sm font-semibold hover:bg-[var(--bg-2)] transition-colors"
          >
            ยกเลิก
          </a>
        </div>
      </form>
    </div>
  );
}

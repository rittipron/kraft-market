'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { updateProduct } from '@/lib/api';
import type { Product } from '@/lib/api';
import { ImageManager } from '@/components/admin/ImageManager';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function authFetch(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('kraft_token') : '';
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    sku: '',
    stock: '',
    description: '',
    tags: '',
    status: 'active',
  });

  useEffect(() => {
    if (!id) return;
    authFetch(`${BASE}/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((p: Product) => {
        setProduct(p);
        setImages(p.images ?? []);
        setForm({
          name: p.name,
          price: String(p.price),
          sku: p.sku || '',
          stock: String(p.stock ?? 0),
          description: p.description || '',
          tags: (p.tags ?? []).join(', '),
          status: p.status,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await updateProduct(id, {
        name: form.name,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        description: form.description || undefined,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images,
        status: form.status as Product['status'],
      });
      router.push('/admin/products');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl animate-pulse space-y-4">
        <div className="h-8 bg-[var(--bg-2)] rounded w-48" />
        <div className="h-64 bg-[var(--bg-2)] rounded-2xl" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="p-6 lg:p-8">
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
        <a href="/admin/products" className="mt-4 inline-block text-sm text-[var(--coral)] hover:underline">← กลับ</a>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/admin/products" className="text-[var(--ink-4)] hover:text-[var(--coral)] text-sm">← สินค้า</a>
        <span className="text-[var(--line)]">/</span>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">แก้ไขสินค้า</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-[var(--surface)] rounded-2xl border border-[var(--line)] p-6">
        <div className="p-3 bg-[var(--bg-2)] rounded-xl text-xs text-[var(--ink-4)] font-mono">
          ID: {id} &nbsp;·&nbsp; SKU: {form.sku}
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">ชื่อสินค้า *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
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
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">รายละเอียด</label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full px-4 py-2 border border-[var(--line)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)] resize-none"
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
            placeholder="tag1, tag2, tag3"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--ink-3)] mb-1">สถานะ</label>
          <select
            value={form.status}
            onChange={(e) => set('status', e.target.value)}
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
            {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
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

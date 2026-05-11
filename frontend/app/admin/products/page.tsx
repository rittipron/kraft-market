'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import type { Product } from '@/lib/api';
import { deleteProduct } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const authedFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  archived: 'bg-gray-100 text-gray-600',
};

export default function ProductsAdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '15' });
  if (search) params.set('search', search);
  if (statusFilter) params.set('status', statusFilter);

  const url = `${BASE}/products?${params}`;
  const { data, isLoading } = useSWR<{ items: Product[]; total: number; pages: number }>(url, authedFetch);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ลบสินค้า "${name}" หรือไม่?`)) return;
    await deleteProduct(id);
    mutate(url);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">สินค้า</h1>
          <p className="text-[var(--ink-4)] text-sm">{data?.total ?? 0} รายการ</p>
        </div>
        <a href="/admin/products/new" className="px-4 py-2 bg-[var(--coral)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors">
          + เพิ่มสินค้า
        </a>
      </div>

      <div className="flex gap-3 mb-5">
        <input
          type="search"
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 max-w-xs px-4 py-2 border border-[var(--line)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:outline-none"
        >
          <option value="">ทุกสถานะ</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--bg)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--ink-3)]">สินค้า</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ink-3)]">ราคา</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ink-3)]">คงเหลือ</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--ink-3)]">สถานะ</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ink-3)]">ยอดขาย</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--line)] animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 bg-[var(--bg-2)] rounded w-48" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-[var(--bg-2)] rounded w-16 ml-auto" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-[var(--bg-2)] rounded w-12 ml-auto" /></td>
                  <td className="px-4 py-3"><div className="h-5 bg-[var(--bg-2)] rounded w-16 mx-auto" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-[var(--bg-2)] rounded w-12 ml-auto" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : data?.items.map((p) => (
              <tr key={p._id} className="border-b border-[var(--line)] hover:bg-[var(--bg)] transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--ink)]">{p.name}</div>
                  <div className="text-xs text-[var(--ink-4)] font-mono">{p.sku}</div>
                </td>
                <td className="px-4 py-3 text-right font-bold">฿{p.price.toLocaleString()}</td>
                <td className={`px-4 py-3 text-right font-medium ${p.stock < 5 ? 'text-red-500' : 'text-[var(--ink)]'}`}>
                  {p.stock}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[p.status] || ''}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[var(--ink-3)]">{p.soldCount}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a href={`/admin/products/${p._id}`} className="text-xs text-[var(--teal)] hover:underline">แก้ไข</a>
                    <button onClick={() => handleDelete(p._id, p.name)} className="text-xs text-red-400 hover:text-red-600">ลบ</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${p === page ? 'bg-[var(--coral)] text-white' : 'border border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--coral)]'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

const SORT_OPTIONS = [
  { label: 'ยอดนิยม', value: 'popular' },
  { label: 'ราคาต่ำ-สูง', value: 'price_asc' },
  { label: 'ราคาสูง-ต่ำ', value: 'price_desc' },
  { label: 'ใหม่ล่าสุด', value: 'newest' },
];

export function ProductGrid() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('popular');
  const [search, setSearch] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '12' });
  if (search) params.set('search', search);

  const { data, isLoading } = useSWR<{ items: Product[]; total: number; pages: number }>(
    `${BASE}/products?${params}`,
    fetcher,
  );

  const products = data?.items ?? [];

  return (
    <section id="products">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold text-[var(--ink)]">
          สินค้าทั้งหมด
          {data && <span className="text-sm font-normal text-[var(--ink-4)] ml-2">({data.total} รายการ)</span>}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--ink-4)]">เรียงโดย</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-sm border border-[var(--line)] rounded-lg px-3 py-1.5 bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-[var(--bg-2)]" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-[var(--bg-3)] rounded w-3/4" />
                <div className="h-4 bg-[var(--bg-3)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-[var(--ink-4)]">
          <div className="text-5xl mb-4">🔍</div>
          <p>ไม่พบสินค้า</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-[var(--coral)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--coral)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

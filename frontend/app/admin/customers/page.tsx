'use client';

import { useState } from 'react';
import useSWR from 'swr';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const authedFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

interface Customer {
  name: string;
  phone: string;
  email: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
  firstOrder: string;
}

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const url = `${BASE}/orders/customers?page=${page}&limit=20`;
  const { data, isLoading } = useSWR<{ items: Customer[]; total: number; pages: number }>(url, authedFetch);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Customers</h1>
          <p className="text-[var(--ink-4)] text-sm">{data?.total ?? 0} ลูกค้า (จากออเดอร์ออนไลน์)</p>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--bg)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--ink-3)]">ลูกค้า</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--ink-3)]">ติดต่อ</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ink-3)]">ออเดอร์</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ink-3)]">ยอดรวม</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ink-3)]">ล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--line)] animate-pulse">
                    {[1, 2, 3, 4, 5].map((j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--bg-2)] rounded" /></td>
                    ))}
                  </tr>
                ))
              : data?.items.map((c, i) => (
                  <tr key={i} className="border-b border-[var(--line)] hover:bg-[var(--bg)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--coral-soft)] flex items-center justify-center text-sm font-bold text-[var(--coral)] shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--ink)]">{c.name}</p>
                          {c.address && <p className="text-xs text-[var(--ink-4)] truncate max-w-[160px]">{c.address}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {c.phone && <p className="text-[var(--ink-3)]">{c.phone}</p>}
                      {c.email && <p className="text-xs text-[var(--ink-4)]">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[var(--ink)]">{c.orderCount}</td>
                    <td className="px-4 py-3 text-right font-bold text-[var(--coral)]">
                      ฿{c.totalSpent.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--ink-4)] text-xs">
                      {new Date(c.lastOrder).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && !data?.items.length && (
          <div className="text-center py-16 text-[var(--ink-4)]">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-semibold">ยังไม่มีข้อมูลลูกค้า</p>
            <p className="text-sm mt-1">ลูกค้าจะปรากฏหลังจากมีออเดอร์ออนไลน์</p>
          </div>
        )}
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

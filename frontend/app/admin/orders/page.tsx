'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import type { Order } from '@/lib/api';
import { updateOrderStatus } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const authedFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const CHANNEL_COLORS: Record<string, string> = {
  online: 'bg-[var(--teal-soft)] text-[var(--teal)]',
  pos: 'bg-[var(--coral-soft)] text-[var(--coral)]',
};

export default function OrdersAdminPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: '15' });
  if (statusFilter) params.set('status', statusFilter);
  if (channelFilter) params.set('channel', channelFilter);

  const url = `${BASE}/orders?${params}`;
  const { data, isLoading } = useSWR<{ items: Order[]; total: number; pages: number }>(url, authedFetch);

  const handleStatusUpdate = async (id: string, status: string) => {
    await updateOrderStatus(id, status);
    mutate(url);
    setSelected((prev) => prev ? { ...prev, status: status as Order['status'] } : prev);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">ออเดอร์</h1>
        <p className="text-[var(--ink-4)] text-sm">{data?.total ?? 0} รายการ</p>
      </div>

      <div className="flex gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-[var(--line)] rounded-lg text-sm">
          <option value="">ทุกสถานะ</option>
          {['pending', 'paid', 'shipped', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={channelFilter} onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-[var(--line)] rounded-lg text-sm">
          <option value="">ทุกช่องทาง</option>
          <option value="online">Online</option>
          <option value="pos">POS</option>
        </select>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--bg)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--ink-3)]">ใบเสร็จ</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--ink-3)]">วันที่</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--ink-3)]">ช่องทาง</th>
              <th className="text-right px-4 py-3 font-semibold text-[var(--ink-3)]">ยอด</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--ink-3)]">สถานะ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--line)] animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--bg-2)] rounded" /></td>
                    ))}
                  </tr>
                ))
              : data?.items.map((o) => (
                  <tr key={o._id} className="border-b border-[var(--line)] hover:bg-[var(--bg)] transition-colors cursor-pointer" onClick={() => setSelected(o)}>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--ink-3)]">{o.receiptNumber}</td>
                    <td className="px-4 py-3 text-[var(--ink-3)]">{new Date(o.createdAt).toLocaleDateString('th-TH')}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${CHANNEL_COLORS[o.channel]}`}>{o.channel}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">฿{o.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-xs text-[var(--teal)] hover:underline">ดูรายละเอียด</button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${p === page ? 'bg-[var(--coral)] text-white' : 'border border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--coral)]'}`}>{p}</button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-[var(--surface)] rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b border-[var(--line)] flex items-center justify-between">
              <div>
                <h2 className="font-display font-bold">ออเดอร์ {selected.receiptNumber}</h2>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[selected.status]}`}>{selected.status}</span>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-[var(--bg-2)] rounded-full">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {selected.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name} × {item.qty}</span>
                  <span className="font-semibold">฿{(item.price * item.qty).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-[var(--line)] pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-[var(--ink-3)]"><span>ยอดรวม</span><span>฿{selected.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-[var(--ink-3)]"><span>VAT 7%</span><span>฿{selected.vat.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-base"><span>รวม</span><span className="text-[var(--coral)]">฿{selected.total.toLocaleString()}</span></div>
              </div>
              <div>
                <label className="text-xs text-[var(--ink-4)] block mb-1">อัปเดตสถานะ</label>
                <div className="flex flex-wrap gap-2">
                  {['pending', 'paid', 'shipped', 'completed', 'cancelled'].map((s) => (
                    <button key={s} onClick={() => handleStatusUpdate(selected._id, s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${selected.status === s ? STATUS_COLORS[s] + ' border-current' : 'border-[var(--line)] text-[var(--ink-3)] hover:border-[var(--coral)]'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import useSWR from 'swr';
import type { DashboardStats } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const fetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

function StatCard({ label, value, sub, icon, color }: { label: string; value: string; sub?: string; icon: string; color: string }) {
  return (
    <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--line)]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--ink-4)]">{label}</p>
          <p className={`font-display text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-[var(--good)] mt-1">{sub}</p>}
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats } = useSWR<DashboardStats>(`${BASE}/orders/stats/dashboard`, fetcher);

  const totalRevenue = stats?.dailySales.reduce((s, d) => s + d.total, 0) ?? 0;
  const totalOrders = stats?.dailySales.reduce((s, d) => s + d.count, 0) ?? 0;
  const completedOrders = stats?.statusBreakdown.find((s) => s._id === 'completed')?.count ?? 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Dashboard</h1>
        <p className="text-[var(--ink-4)] text-sm mt-1">ภาพรวมธุรกิจ 30 วันที่ผ่านมา</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="รายได้รวม" value={`฿${totalRevenue.toLocaleString()}`} sub="↑ 12.5% จากเดือนก่อน" icon="💰" color="text-[var(--good)]" />
        <StatCard label="ออเดอร์ทั้งหมด" value={String(totalOrders)} sub={`${completedOrders} สำเร็จ`} icon="📦" color="text-[var(--ink)]" />
        <StatCard label="ออเดอร์ POS" value={String(stats?.dailySales.filter(d => d._id.channel === 'pos').reduce((s, d) => s + d.count, 0) ?? 0)} icon="🖥️" color="text-[var(--teal)]" />
        <StatCard label="ออเดอร์ออนไลน์" value={String(stats?.dailySales.filter(d => d._id.channel === 'online').reduce((s, d) => s + d.count, 0) ?? 0)} icon="🛒" color="text-[var(--coral)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--line)]">
          <h2 className="font-display font-semibold mb-4">Top 5 สินค้าขายดี</h2>
          {stats?.topProducts.length ? (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--bg-2)] text-xs flex items-center justify-center font-bold text-[var(--ink-3)]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-[var(--ink-4)]">ขายได้ {p.sold} ชิ้น</p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--good)]">฿{p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--ink-4)] text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>

        <div className="bg-[var(--surface)] rounded-2xl p-5 border border-[var(--line)]">
          <h2 className="font-display font-semibold mb-4">สถานะออเดอร์</h2>
          {stats?.statusBreakdown.length ? (
            <div className="space-y-3">
              {stats.statusBreakdown.map((s) => {
                const colors: Record<string, string> = { completed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700', cancelled: 'bg-red-100 text-red-700', paid: 'bg-blue-100 text-blue-700', shipped: 'bg-purple-100 text-purple-700' };
                return (
                  <div key={s._id} className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors[s._id] || 'bg-gray-100 text-gray-700'}`}>{s._id}</span>
                    <span className="text-sm font-bold">{s.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--ink-4)] text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>
      </div>
    </div>
  );
}

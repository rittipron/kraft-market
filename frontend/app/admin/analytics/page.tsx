'use client';

import useSWR from 'swr';
import type { DashboardStats } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const authedFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

const STATUS_TH: Record<string, string> = {
  pending: 'รอชำระ', paid: 'ชำระแล้ว', shipped: 'จัดส่งแล้ว',
  completed: 'เสร็จสิ้น', cancelled: 'ยกเลิก',
};
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-400', paid: 'bg-blue-400', shipped: 'bg-purple-400',
  completed: 'bg-green-400', cancelled: 'bg-red-400',
};

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useSWR<DashboardStats>(`${BASE}/orders/stats/dashboard`, authedFetch);

  // Aggregate daily totals across channels
  const dailyMap: Record<string, number> = {};
  stats?.dailySales.forEach(({ _id, total }) => {
    dailyMap[_id.date] = (dailyMap[_id.date] || 0) + total;
  });
  const days = Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDay = Math.max(...days.map((d) => d[1]), 1);

  const totalRevenue = days.reduce((s, d) => s + d[1], 0);
  const totalOrders = stats?.dailySales.reduce((s, d) => s + d.count, 0) ?? 0;
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalStatusCount = stats?.statusBreakdown.reduce((s, d) => s + d.count, 0) ?? 0;

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-[var(--bg-2)] rounded w-40" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-[var(--bg-2)] rounded-2xl" />)}
        </div>
        <div className="h-64 bg-[var(--bg-2)] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Analytics</h1>
        <p className="text-[var(--ink-4)] text-sm">ยอดขาย 30 วันที่ผ่านมา (orders ที่ completed)</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'รายได้รวม', value: `฿${totalRevenue.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, color: 'text-[var(--coral)]', icon: '💰' },
          { label: 'คำสั่งซื้อทั้งหมด', value: totalOrders.toLocaleString(), color: 'text-[var(--teal)]', icon: '📦' },
          { label: 'มูลค่าเฉลี่ย/ออเดอร์', value: `฿${avgOrder.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`, color: 'text-[var(--amber)]', icon: '📊' },
        ].map((card) => (
          <div key={card.label} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5">
            <div className="flex items-start justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
            </div>
            <p className={`font-display text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-sm text-[var(--ink-4)] mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Sales bar chart */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6">
        <h2 className="font-semibold text-[var(--ink)] mb-5">ยอดขายรายวัน</h2>
        {days.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-[var(--ink-4)] text-sm">ยังไม่มีข้อมูล</div>
        ) : (
          <div className="flex items-end gap-1 h-40 overflow-x-auto pb-2">
            {days.map(([date, total]) => {
              const pct = (total / maxDay) * 100;
              const label = date.slice(5); // MM-DD
              return (
                <div key={date} className="flex flex-col items-center gap-1 min-w-[28px] flex-1">
                  <span className="text-[9px] text-[var(--ink-4)] truncate w-full text-center">
                    {total >= 1000 ? `฿${(total / 1000).toFixed(1)}K` : `฿${Math.round(total)}`}
                  </span>
                  <div className="w-full flex-1 flex items-end">
                    <div
                      className="w-full bg-[var(--coral)] rounded-t-sm hover:bg-[var(--coral-deep)] transition-colors"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      title={`${date}: ฿${total.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[9px] text-[var(--ink-4)]">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6">
          <h2 className="font-semibold text-[var(--ink)] mb-4">สินค้าขายดีเดือนนี้</h2>
          {!stats?.topProducts.length ? (
            <p className="text-sm text-[var(--ink-4)]">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-bold text-[var(--ink-4)]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--ink)] truncate">{p.name}</p>
                    <div className="mt-1 h-1.5 bg-[var(--bg-2)] rounded-full">
                      <div
                        className="h-1.5 bg-[var(--coral)] rounded-full"
                        style={{ width: `${(p.sold / (stats.topProducts[0]?.sold || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[var(--ink)]">{p.sold} ชิ้น</p>
                    <p className="text-xs text-[var(--ink-4)]">฿{p.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order status breakdown */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6">
          <h2 className="font-semibold text-[var(--ink)] mb-4">สถานะออเดอร์</h2>
          {!stats?.statusBreakdown.length ? (
            <p className="text-sm text-[var(--ink-4)]">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {stats.statusBreakdown.map((s) => (
                <div key={s._id} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_COLOR[s._id] ?? 'bg-gray-400'}`} />
                  <span className="flex-1 text-sm text-[var(--ink-3)]">{STATUS_TH[s._id] ?? s._id}</span>
                  <span className="text-sm font-bold text-[var(--ink)]">{s.count}</span>
                  <div className="w-24 h-2 bg-[var(--bg-2)] rounded-full">
                    <div
                      className={`h-2 rounded-full ${STATUS_COLOR[s._id] ?? 'bg-gray-400'}`}
                      style={{ width: `${(s.count / totalStatusCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--ink-4)] w-8 text-right">
                    {Math.round((s.count / totalStatusCount) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

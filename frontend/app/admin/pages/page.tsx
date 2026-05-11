'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { deletePage } from '@/lib/api';
import type { Page } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const authedFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-blue-100 text-blue-700',
};

export default function PagesAdminPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const url = `${BASE}/pages${statusFilter ? `?status=${statusFilter}` : ''}`;
  const { data: pages, isLoading } = useSWR<Page[]>(url, authedFetch);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ลบหน้า "${title}" หรือไม่?`)) return;
    await deletePage(id);
    mutate(url);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Pages</h1>
          <p className="text-[var(--ink-4)] text-sm">{pages?.length ?? 0} หน้า</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-[var(--line)] rounded-lg text-sm"
          >
            <option value="">ทุกสถานะ</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
          <a
            href="/admin/builder"
            className="px-4 py-2 bg-[var(--coral)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors"
          >
            + สร้างหน้าใหม่
          </a>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--bg)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--ink-3)]">หัวข้อ</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--ink-3)]">Slug</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--ink-3)]">บล็อก</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--ink-3)]">สถานะ</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--ink-3)]">อัปเดต</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--line)] animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-[var(--bg-2)] rounded" /></td>
                    ))}
                  </tr>
                ))
              : pages?.map((page) => (
                  <tr key={page._id} className="border-b border-[var(--line)] hover:bg-[var(--bg)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">{page.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--ink-4)]">/{page.slug}</td>
                    <td className="px-4 py-3 text-center text-[var(--ink-3)]">{page.blocks.length}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[page.status]}`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ink-4)]">
                      {new Date(page.createdAt).toLocaleDateString('th-TH')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <a href={`/admin/builder?id=${page._id}`} className="text-xs text-[var(--teal)] hover:underline">แก้ไข</a>
                        {page.status === 'published' && (
                          <a href={`/${page.slug}`} target="_blank" className="text-xs text-[var(--ink-4)] hover:underline">ดูหน้า</a>
                        )}
                        <button
                          onClick={() => handleDelete(page._id, page.title)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!isLoading && !pages?.length && (
          <div className="text-center py-16 text-[var(--ink-4)]">
            <div className="text-4xl mb-3">📄</div>
            <p className="font-semibold">ยังไม่มีหน้า</p>
            <a href="/admin/builder" className="mt-2 inline-block text-sm text-[var(--coral)] hover:underline">
              สร้างหน้าแรก →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

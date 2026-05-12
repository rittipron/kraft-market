'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { StoreHeader } from '@/components/store/StoreHeader';
import type { PageBlock } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface CmsPage {
  _id: string;
  title: string;
  slug: string;
  status: string;
  blocks: PageBlock[];
}

function BlockRenderer({ block }: { block: PageBlock }) {
  const d = block.data ?? {};
  switch (block.type) {
    case 'hero':
      return (
        <div className="bg-gradient-to-br from-[var(--coral-soft)] to-[var(--teal-soft)] rounded-2xl p-12 text-center my-6">
          <h1 className="font-display text-4xl font-bold mb-3">{d.heading}</h1>
          {d.subheading && <p className="text-[var(--ink-3)] text-lg mb-6">{d.subheading}</p>}
          {d.buttonText && (
            <a href={d.buttonUrl || '/'} className="inline-block px-6 py-3 bg-[var(--coral)] text-white font-semibold rounded-full hover:bg-[var(--coral-deep)] transition-colors">
              {d.buttonText}
            </a>
          )}
        </div>
      );
    case 'heading': {
      const level = d.level || 2;
      const cls = ['', 'text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base'][level] ?? 'text-2xl';
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag className={`font-display font-bold ${cls} text-[var(--ink)] my-4`}>{d.text}</Tag>;
    }
    case 'text':
      return <p className="text-[var(--ink-3)] leading-relaxed my-4 whitespace-pre-wrap">{d.content}</p>;
    case 'image':
      return d.url ? (
        <div className={`my-6 ${d.width === 'full' ? 'w-full' : 'max-w-xl mx-auto'}`}>
          <img src={d.url} alt={d.alt || ''} className="w-full rounded-xl object-cover" />
        </div>
      ) : null;
    case 'cta':
      return (
        <div className="bg-[var(--ink)] text-white rounded-2xl p-10 text-center my-6">
          <h2 className="font-display text-2xl font-bold mb-4">{d.heading}</h2>
          {d.buttonText && (
            <a href={d.buttonUrl || '/'} className="inline-block px-6 py-3 bg-[var(--coral)] text-white font-semibold rounded-full hover:bg-[var(--coral-deep)] transition-colors">
              {d.buttonText}
            </a>
          )}
        </div>
      );
    case 'columns':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {(d.columns ?? []).map((col: any, i: number) => (
            <div key={i} className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--line)]">
              <p className="text-[var(--ink-3)]">{col.text}</p>
            </div>
          ))}
        </div>
      );
    case 'testimonials':
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {(d.items ?? []).map((item: any, i: number) => (
            <div key={i} className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--line)]">
              <p className="text-[var(--ink-3)] mb-3">"{item.text}"</p>
              <p className="font-semibold text-sm text-[var(--ink)]">— {item.author}</p>
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: item.rating ?? 5 }).map((_, j) => (
                  <span key={j} className="text-[var(--amber)] text-xs">★</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function CmsPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const isPreview = searchParams.get('preview') === '1';
  const [page, setPage] = useState<CmsPage | null>(null);
  const [status, setStatus] = useState<'loading' | 'not-found' | 'ok'>('loading');

  useEffect(() => {
    if (!slug) return;
    fetch(`${BASE}/pages/slug/${slug}`)
      .then((r) => {
        if (r.status === 404) { setStatus('not-found'); return null; }
        if (!r.ok) { setStatus('not-found'); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) { setPage(data); setStatus('ok'); }
      })
      .catch(() => setStatus('not-found'));
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="text-6xl mb-4">404</div>
        <h1 className="font-display text-2xl font-bold text-[var(--ink)] mb-2">ไม่พบหน้านี้</h1>
        <p className="text-[var(--ink-4)] mb-6">หน้า <code className="font-mono text-sm">/{slug}</code> ไม่มีในระบบหรือยังไม่ได้เผยแพร่</p>
        <a href="/" className="px-5 py-2.5 bg-[var(--coral)] text-white rounded-full font-semibold hover:bg-[var(--coral-deep)] transition-colors">
          กลับหน้าแรก
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {isPreview ? (
        <div className="sticky top-0 z-50 bg-[var(--ink)] text-white px-4 py-2 flex items-center justify-between text-sm">
          <span className="text-white/60">Preview Mode — <span className="text-[var(--coral)]">{page?.title}</span></span>
          <a href="/admin/pages" className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs font-medium">
            ← กลับ Admin Pages
          </a>
        </div>
      ) : (
        <StoreHeader />
      )}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-[var(--ink)] mb-8">{page?.title}</h1>
        {page?.blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}

export default function CmsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" /></div>}>
      <CmsPageInner />
    </Suspense>
  );
}

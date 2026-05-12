'use client';

import { useState, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { updatePage, createPage, getPageById } from '@/lib/api';
import type { PageBlock } from '@/lib/api';

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Banner', icon: '🖼️', defaultData: { heading: 'หัวข้อหลัก', subheading: 'คำอธิบาย', buttonText: 'ดูเพิ่มเติม', buttonUrl: '/' } },
  { type: 'heading', label: 'หัวข้อ', icon: '📝', defaultData: { text: 'หัวข้อ', level: 2 } },
  { type: 'text', label: 'เนื้อหา', icon: '📄', defaultData: { content: 'เนื้อหาของคุณ...' } },
  { type: 'image', label: 'รูปภาพ', icon: '🖼️', defaultData: { url: '', alt: '', width: 'full' } },
  { type: 'products', label: 'สินค้า', icon: '📦', defaultData: { categoryId: '', limit: 4, title: 'สินค้าแนะนำ' } },
  { type: 'cta', label: 'Call to Action', icon: '🎯', defaultData: { heading: 'พร้อมเริ่มต้นแล้วหรือยัง?', buttonText: 'เริ่มต้นเลย', buttonUrl: '/' } },
  { type: 'columns', label: 'Columns', icon: '⬛', defaultData: { columns: [{ text: 'คอลัมน์ 1' }, { text: 'คอลัมน์ 2' }] } },
  { type: 'testimonials', label: 'รีวิว', icon: '💬', defaultData: { items: [{ author: 'ลูกค้า', text: 'สินค้าดีมาก!', rating: 5 }] } },
];

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function BlockRenderer({ block }: { block: PageBlock }) {
  const d = block.data;
  switch (block.type) {
    case 'hero':
      return (
        <div className="bg-gradient-to-br from-[var(--coral-soft)] to-[var(--teal-soft)] rounded-xl p-8 text-center">
          <h2 className="font-display text-2xl font-bold mb-2">{d.heading}</h2>
          <p className="text-[var(--ink-3)] mb-4">{d.subheading}</p>
          <button className="px-4 py-2 bg-[var(--coral)] text-white rounded-full text-sm">{d.buttonText}</button>
        </div>
      );
    case 'heading': {
      const Tag = `h${d.level || 2}` as keyof JSX.IntrinsicElements;
      return <Tag className="font-display font-bold text-xl">{d.text}</Tag>;
    }
    case 'text':
      return <p className="text-[var(--ink-3)]">{d.content}</p>;
    case 'cta':
      return (
        <div className="bg-[var(--coral-soft)] rounded-xl p-6 text-center">
          <h3 className="font-display font-bold text-lg mb-3">{d.heading}</h3>
          <button className="px-5 py-2 bg-[var(--coral)] text-white rounded-full text-sm font-semibold">{d.buttonText}</button>
        </div>
      );
    default:
      return <div className="border-2 border-dashed border-[var(--line)] rounded-xl p-6 text-center text-sm text-[var(--ink-4)]">[{block.type}] Block</div>;
  }
}

let blockIdCounter = 1;

function PageBuilderInner() {
  const searchParams = useSearchParams();
  const pageId = searchParams.get('id');

  const [title, setTitle] = useState('หน้าใหม่');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(pageId);
  const [saveMsg, setSaveMsg] = useState('');
  const [loading, setLoading] = useState(!!pageId);

  // Load existing page
  useEffect(() => {
    if (!pageId) return;
    getPageById(pageId)
      .then((page) => {
        setTitle(page.title);
        setSlug(page.slug);
        setSlugManual(true);
        setStatus(page.status);
        setBlocks(page.blocks);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pageId]);

  // Auto-generate slug from title (only when not manually edited)
  useEffect(() => {
    if (slugManual) return;
    const s = slugify(title);
    setSlug(s || '');
  }, [title, slugManual]);

  const addBlock = useCallback((type: string) => {
    const tpl = BLOCK_TYPES.find((b) => b.type === type)!;
    const block: PageBlock = {
      id: `block-${blockIdCounter++}`,
      type: type as PageBlock['type'],
      data: { ...tpl.defaultData },
      order: blocks.length,
    };
    setBlocks((prev) => [...prev, block]);
    setSelected(block.id);
  }, [blocks.length]);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSelected(null);
  }, []);

  const moveBlock = useCallback((id: string, dir: -1 | 1) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      const next = idx + dir;
      if (next < 0 || next >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr.map((b, i) => ({ ...b, order: i }));
    });
  }, []);

  const updateBlockData = useCallback((id: string, key: string, value: any) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, data: { ...b.data, [key]: value } } : b));
  }, []);

  const save = async (publishNow = false) => {
    setSaving(true);
    setSaveMsg('');
    try {
      const finalStatus = publishNow ? 'published' : status;
      const data = { title, slug: slug || slugify(title) || `page-${Date.now()}`, blocks, status: finalStatus };
      if (savedId) {
        await updatePage(savedId, data);
      } else {
        const page = await createPage(data);
        setSavedId(page._id);
      }
      if (publishNow) setStatus('published');
      setSaveMsg('บันทึกสำเร็จ!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: any) {
      setSaveMsg(e.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = blocks.find((b) => b.id === selected);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-14 bg-[var(--surface)] border-b border-[var(--line)] flex items-center px-4 gap-4 shrink-0">
        <a href="/admin/pages" className="text-sm text-[var(--ink-4)] hover:text-[var(--coral)] shrink-0">← Pages</a>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="font-display font-bold text-lg border-none outline-none bg-transparent flex-1 min-w-0"
        />
        {saveMsg && (
          <span className={`text-xs shrink-0 ${saveMsg.includes('ไม่') ? 'text-red-500' : 'text-[var(--good)]'}`}>{saveMsg}</span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {status === 'published' && savedId && (
            <a href={`/${slug}`} target="_blank" className="text-xs text-[var(--teal)] hover:underline">ดูหน้า ↗</a>
          )}
          <button onClick={() => save(false)} disabled={saving} className="px-3 py-1.5 border border-[var(--line)] text-[var(--ink-3)] text-sm rounded-lg hover:bg-[var(--bg-2)] transition-colors disabled:opacity-50">
            บันทึก Draft
          </button>
          <button onClick={() => save(true)} disabled={saving} className="px-4 py-1.5 bg-[var(--coral)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50">
            {saving ? 'กำลังบันทึก...' : status === 'published' ? 'อัปเดต' : 'เผยแพร่'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Block Palette */}
        <div className="w-52 bg-[var(--bg)] border-r border-[var(--line)] overflow-y-auto p-3 shrink-0">
          <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider mb-3 px-1">บล็อก</p>
          <div className="space-y-1">
            {BLOCK_TYPES.map((b) => (
              <button
                key={b.type}
                onClick={() => addBlock(b.type)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--surface)] hover:shadow-sm transition-all text-left"
              >
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto bg-[var(--bg-2)] p-6">
          {blocks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[var(--ink-4)]">
              <div className="text-5xl mb-4">🧱</div>
              <p className="font-semibold mb-1">เพิ่มบล็อกแรก</p>
              <p className="text-sm">คลิกบล็อกจากแถบซ้ายเพื่อเริ่ม</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-3">
              {blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className={`relative group bg-[var(--surface)] rounded-xl p-4 border-2 transition-all cursor-pointer ${selected === block.id ? 'border-[var(--coral)]' : 'border-transparent hover:border-[var(--line)]'}`}
                  onClick={() => setSelected(block.id)}
                >
                  <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 z-10">
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, -1); }} disabled={idx === 0} className="p-1 rounded hover:bg-[var(--bg-2)] disabled:opacity-30 text-xs">↑</button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 1); }} disabled={idx === blocks.length - 1} className="p-1 rounded hover:bg-[var(--bg-2)] disabled:opacity-30 text-xs">↓</button>
                    <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-1 rounded hover:bg-red-50 text-red-400 text-xs">×</button>
                  </div>
                  <BlockRenderer block={block} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inspector */}
        <div className="w-64 bg-[var(--surface)] border-l border-[var(--line)] overflow-y-auto p-4 shrink-0">
          {selectedBlock ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider">
                  {BLOCK_TYPES.find((b) => b.type === selectedBlock.type)?.label}
                </p>
                <button onClick={() => setSelected(null)} className="text-xs text-[var(--ink-4)] hover:text-[var(--coral)]">✕</button>
              </div>
              <div className="space-y-3">
                {Object.entries(selectedBlock.data).map(([key, val]) =>
                  typeof val === 'string' ? (
                    <div key={key}>
                      <label className="text-xs text-[var(--ink-4)] block mb-1 capitalize">{key}</label>
                      <textarea
                        value={val}
                        onChange={(e) => updateBlockData(selectedBlock.id, key, e.target.value)}
                        rows={val.length > 80 ? 4 : 2}
                        className="w-full text-sm border border-[var(--line)] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--coral)] resize-none"
                      />
                    </div>
                  ) : null
                )}
              </div>
            </>
          ) : (
            /* Page Settings panel */
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[var(--ink-4)] uppercase tracking-wider">ตั้งค่าหน้า</p>

              <div>
                <label className="text-xs text-[var(--ink-4)] block mb-1">ชื่อหน้า</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-sm border border-[var(--line)] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--ink-4)] block mb-1">
                  Slug (URL)
                  {!slugManual && <span className="ml-1 text-[var(--teal)]">• auto</span>}
                </label>
                <div className="flex items-center gap-1 border border-[var(--line)] rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-[var(--coral)]">
                  <span className="pl-2 text-xs text-[var(--ink-4)]">/</span>
                  <input
                    value={slug}
                    onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                    className="flex-1 text-sm px-1 py-2 outline-none font-mono bg-transparent"
                    placeholder="my-page"
                  />
                  {slugManual && (
                    <button
                      onClick={() => { setSlugManual(false); setSlug(slugify(title)); }}
                      className="px-2 text-xs text-[var(--ink-4)] hover:text-[var(--coral)]"
                      title="Reset to auto"
                    >↺</button>
                  )}
                </div>
                <p className="text-xs text-[var(--ink-4)] mt-1">URL: <span className="font-mono">/{slug || '…'}</span></p>
              </div>

              <div>
                <label className="text-xs text-[var(--ink-4)] block mb-1">สถานะ</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className="w-full text-sm border border-[var(--line)] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[var(--coral)]"
                >
                  <option value="draft">Draft — ซ่อนจากสาธารณะ</option>
                  <option value="published">Published — เผยแพร่แล้ว</option>
                  <option value="scheduled">Scheduled — กำหนดเวลา</option>
                </select>
              </div>

              {savedId && status === 'published' && (
                <a
                  href={`/${slug}`}
                  target="_blank"
                  className="block text-center text-xs text-[var(--teal)] hover:underline py-2 border border-[var(--teal)] rounded-lg"
                >
                  ดูหน้าสาธารณะ ↗
                </a>
              )}

              <p className="text-xs text-[var(--ink-4)] text-center pt-2">คลิกบล็อกเพื่อแก้ไขเนื้อหา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PageBuilderPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--coral)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PageBuilderInner />
    </Suspense>
  );
}

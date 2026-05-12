'use client';

import { useRef, useState } from 'react';
import useSWR from 'swr';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function resizeToMaxSize(file: File, maxBytes = 1_000_000): Promise<File> {
  if (file.size <= maxBytes) return file;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.sqrt(maxBytes / file.size);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })),
        'image/jpeg',
        0.85,
      );
    };
    img.src = url;
  });
}
const authedFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

interface MediaFile { filename: string; url: string; size: number; }

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
}

export function ImageManager({ images, onChange }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: mediaFiles = [], mutate } = useSWR<MediaFile[]>(showPicker ? `${BASE}/media` : null, authedFetch);

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url || images.includes(url)) return;
    onChange([...images, url]);
    setUrlInput('');
  };

  const removeImage = (url: string) => onChange(images.filter((u) => u !== url));

  const moveImage = (idx: number, dir: -1 | 1) => {
    const arr = [...images];
    const next = idx + dir;
    if (next < 0 || next >= arr.length) return;
    [arr[idx], arr[next]] = [arr[next], arr[idx]];
    onChange(arr);
  };

  const selectFromMedia = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    if (!images.includes(fullUrl)) onChange([...images, fullUrl]);
    setShowPicker(false);
  };

  const uploadAndAdd = async (rawFile: File) => {
    const file = await resizeToMaxSize(rawFile, 1_000_000);
    const token = localStorage.getItem('kraft_token');
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      const res = await fetch(`${BASE}/media/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        const fullUrl = `${window.location.origin}${data.url}`;
        onChange([...images, fullUrl]);
        mutate();
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Current images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, idx) => (
            <div key={url} className="relative group w-20 h-20 shrink-0">
              <img src={url} alt="" className="w-full h-full object-cover rounded-xl border border-[var(--line)]" />
              {idx === 0 && (
                <span className="absolute top-0.5 left-0.5 text-[9px] bg-[var(--coral)] text-white px-1 rounded">หลัก</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1">
                <button onClick={() => moveImage(idx, -1)} disabled={idx === 0} className="text-white text-xs disabled:opacity-30 p-0.5 hover:text-[var(--coral)]">◀</button>
                <button onClick={() => removeImage(url)} className="text-white text-xs hover:text-red-300 p-0.5">×</button>
                <button onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1} className="text-white text-xs disabled:opacity-30 p-0.5 hover:text-[var(--coral)]">▶</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add by URL */}
      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          placeholder="วาง URL รูปภาพ..."
          className="flex-1 px-3 py-2 border border-[var(--line)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
        />
        <button onClick={addUrl} className="px-3 py-2 bg-[var(--bg-2)] border border-[var(--line)] rounded-lg text-sm hover:bg-[var(--bg-3)] transition-colors">
          + URL
        </button>
      </div>

      {/* Upload / Media picker */}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex-1 py-2 border border-dashed border-[var(--line)] rounded-lg text-sm text-[var(--ink-4)] hover:border-[var(--coral)] hover:text-[var(--coral)] transition-colors disabled:opacity-50"
        >
          {uploading ? 'กำลังอัปโหลด...' : '📤 อัปโหลดรูป'}
        </button>
        <button
          type="button"
          onClick={() => setShowPicker(true)}
          className="flex-1 py-2 border border-[var(--line)] rounded-lg text-sm text-[var(--ink-4)] hover:border-[var(--coral)] hover:text-[var(--coral)] transition-colors"
        >
          🖼️ เลือกจาก Media
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAndAdd(e.target.files[0])} />

      {/* Media picker modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl border border-[var(--line)] w-full max-w-2xl max-h-[70vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[var(--line)]">
              <h3 className="font-semibold text-[var(--ink)]">เลือกรูปจาก Media Library</h3>
              <button onClick={() => setShowPicker(false)} className="text-[var(--ink-4)] hover:text-[var(--ink)]">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {mediaFiles.length === 0 ? (
                <div className="text-center py-12 text-[var(--ink-4)]">
                  <div className="text-3xl mb-2">🖼️</div>
                  <p className="text-sm">ยังไม่มีรูปใน Media Library</p>
                  <p className="text-xs mt-1">อัปโหลดรูปที่หน้า Media ก่อน</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {mediaFiles.map((f) => (
                    <button
                      key={f.filename}
                      onClick={() => selectFromMedia(f.url)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[var(--coral)] transition-all"
                    >
                      <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

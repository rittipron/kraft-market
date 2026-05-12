'use client';

import { useRef, useState } from 'react';
import useSWR, { mutate } from 'swr';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const authedFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` } }).then((r) => r.json());

interface MediaFile {
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

const MEDIA_URL = `${BASE}/media`;

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const { data: files = [], isLoading } = useSWR<MediaFile[]>(MEDIA_URL, authedFetch);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'อัปโหลดไม่สำเร็จ');
        return;
      }
      mutate(MEDIA_URL);
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    Array.from(fileList).forEach(upload);
  };

  const handleDelete = async (filename: string) => {
    if (!confirm(`ลบไฟล์ "${filename}"?`)) return;
    await fetch(`${BASE}/media/${filename}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('kraft_token')}` },
    });
    if (selected === filename) setSelected(null);
    mutate(MEDIA_URL);
  };

  const copyUrl = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedFile = files.find((f) => f.filename === selected);

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink)]">Media Library</h1>
          <p className="text-[var(--ink-4)] text-sm">{files.length} ไฟล์</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-[var(--coral)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-50"
        >
          {uploading ? 'กำลังอัปโหลด...' : '+ อัปโหลด'}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors mb-6 ${dragOver ? 'border-[var(--coral)] bg-[var(--coral-soft)]' : 'border-[var(--line)] hover:border-[var(--coral)]'}`}
      >
        <div className="text-3xl mb-2">📤</div>
        <p className="text-sm text-[var(--ink-3)]">ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก</p>
        <p className="text-xs text-[var(--ink-4)] mt-1">รองรับ JPG, PNG, GIF, WebP, SVG ขนาดสูงสุด 5 MB</p>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Gallery */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-square bg-[var(--bg-2)] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-16 text-[var(--ink-4)]">
              <div className="text-4xl mb-3">🖼️</div>
              <p className="font-semibold">ยังไม่มีรูปภาพ</p>
              <p className="text-sm mt-1">อัปโหลดรูปแรกของคุณ</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {files.map((f) => (
                <button
                  key={f.filename}
                  onClick={() => setSelected(f.filename === selected ? null : f.filename)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${f.filename === selected ? 'border-[var(--coral)] shadow-lg scale-105' : 'border-transparent hover:border-[var(--line)]'}`}
                >
                  <img
                    src={f.url}
                    alt={f.filename}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect fill="%23f0f0f0"/></svg>'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* File detail panel */}
        {selectedFile && (
          <div className="w-56 shrink-0 bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 space-y-4 overflow-y-auto self-start">
            <img
              src={selectedFile.url}
              alt={selectedFile.filename}
              className="w-full aspect-square object-cover rounded-xl border border-[var(--line)]"
            />
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-[var(--ink)] break-all">{selectedFile.filename}</p>
              <p className="text-[var(--ink-4)]">{formatSize(selectedFile.size)}</p>
              <p className="text-[var(--ink-4)]">{new Date(selectedFile.createdAt).toLocaleString('th-TH')}</p>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => copyUrl(selectedFile.url)}
                className="w-full py-2 text-xs font-semibold border border-[var(--teal)] text-[var(--teal)] rounded-lg hover:bg-[var(--teal-soft)] transition-colors"
              >
                {copied ? '✓ คัดลอกแล้ว' : '📋 คัดลอก URL'}
              </button>
              <a
                href={selectedFile.url}
                target="_blank"
                rel="noreferrer"
                className="block text-center w-full py-2 text-xs font-semibold border border-[var(--line)] text-[var(--ink-3)] rounded-lg hover:bg-[var(--bg-2)] transition-colors"
              >
                เปิดรูปภาพ ↗
              </a>
              <button
                onClick={() => handleDelete(selectedFile.filename)}
                className="w-full py-2 text-xs font-semibold border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors"
              >
                🗑️ ลบ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

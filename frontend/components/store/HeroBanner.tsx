'use client';

import Link from 'next/link';

export function HeroBanner() {
  return (
    <section className="relative bg-gradient-to-br from-[var(--coral-soft)] via-[var(--bg)] to-[var(--teal-soft)] overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-20 w-64 h-64 rounded-full bg-[var(--coral)] blur-3xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-[var(--teal)] blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-[var(--coral)] text-white text-xs font-semibold rounded-full mb-4">
            Flash Sale วันนี้เท่านั้น!
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[var(--ink)] leading-tight mb-4">
            ของดี ของจริง<br />
            <span className="text-[var(--coral)]">จากคนทำมือ</span><br />
            ทั่วไทย
          </h1>
          <p className="text-[var(--ink-3)] text-lg mb-8">
            รวมสินค้าคุณภาพจากชุมชนไทย สินค้าท้องถิ่น และงานฝีมือที่หาไม่ได้จากที่อื่น
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#products"
              className="px-6 py-3 bg-[var(--coral)] text-white font-semibold rounded-full hover:bg-[var(--coral-deep)] transition-colors"
            >
              ช้อปเลย
            </Link>
            <Link
              href="#categories"
              className="px-6 py-3 bg-[var(--surface)] text-[var(--ink)] font-semibold rounded-full border border-[var(--line)] hover:bg-[var(--bg-2)] transition-colors"
            >
              ดูหมวดหมู่
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

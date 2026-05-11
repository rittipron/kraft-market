'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/api';

const FLASH_DEALS: Product[] = [
  { _id: '1', name: 'กาแฟดอยช้าง เมล็ดคั่ว', price: 299, sku: '', stock: 10, categoryId: '', tags: [], images: [], status: 'active', rating: 4.8, reviewCount: 145, soldCount: 320, description: '', createdAt: '' },
  { _id: '2', name: 'ครีมทาหน้าสมุนไพร', price: 249, sku: '', stock: 8, categoryId: '', tags: [], images: [], status: 'active', rating: 4.6, reviewCount: 89, soldCount: 200, description: '', createdAt: '' },
  { _id: '3', name: 'กระเป๋าสานมือ', price: 380, sku: '', stock: 4, categoryId: '', tags: [], images: [], status: 'active', rating: 4.9, reviewCount: 56, soldCount: 78, description: '', createdAt: '' },
  { _id: '4', name: 'น้ำผึ้งป่าแท้ 500 มล.', price: 220, sku: '', stock: 15, categoryId: '', tags: [], images: [], status: 'active', rating: 4.7, reviewCount: 200, soldCount: 450, description: '', createdAt: '' },
];

function useCountdown(targetSeconds: number) {
  const [seconds, setSeconds] = useState(targetSeconds);
  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return { h, m, s };
}

function Digit({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 bg-[var(--ink)] text-white rounded-lg flex items-center justify-center font-mono font-bold text-lg">
        {String(value).padStart(2, '0')}
      </div>
    </div>
  );
}

export function FlashSale() {
  const { h, m, s } = useCountdown(4 * 3600 + 32 * 60 + 15);

  return (
    <section>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h2 className="font-display text-2xl font-bold text-[var(--ink)]">Flash Sale</h2>
        </div>
        <div className="flex items-center gap-1 text-[var(--ink-3)] text-sm">
          <span>สิ้นสุดใน</span>
          <Digit value={h} />
          <span className="font-bold">:</span>
          <Digit value={m} />
          <span className="font-bold">:</span>
          <Digit value={s} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {FLASH_DEALS.map((product) => (
          <ProductCard key={product._id} product={product} isFlash />
        ))}
      </div>
    </section>
  );
}

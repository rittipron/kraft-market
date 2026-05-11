'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';

export function StoreHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { openCart, itemCount } = useCartStore();
  const count = itemCount();

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--line)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <Link href="/" className="font-display font-bold text-xl text-[var(--coral)] shrink-0">
          Kraft Market
        </Link>

        <div className="flex-1 hidden sm:block max-w-xl">
          <div className="relative">
            <input
              type="search"
              placeholder="ค้นหาสินค้า..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--bg-2)] border border-[var(--line)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)] focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="sm:hidden p-2 rounded-full hover:bg-[var(--bg-2)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <Link href="/login" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full hover:bg-[var(--bg-2)] transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            เข้าสู่ระบบ
          </Link>

          <button
            onClick={openCart}
            className="relative p-2 rounded-full hover:bg-[var(--bg-2)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--coral)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="sm:hidden px-4 pb-3">
          <input
            type="search"
            placeholder="ค้นหาสินค้า..."
            autoFocus
            className="w-full pl-10 pr-4 py-2 rounded-full bg-[var(--bg-2)] border border-[var(--line)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
          />
        </div>
      )}
    </header>
  );
}

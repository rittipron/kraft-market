'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useSWR from 'swr';
import { useCartStore, useCustomerAuthStore } from '@/lib/store';
import type { NavItem } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : []));

function resolveHref(item: NavItem): string {
  if (item.url) return item.url;
  return '/';
}

export function StoreHeader() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user: customerUser, openAuth, clearAuth, isLoggedIn } = useCustomerAuthStore();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { openCart, itemCount } = useCartStore();
  const pathname = usePathname();
  const count = itemCount();

  const { data: navItems = [] } = useSWR<NavItem[]>(`${BASE}/nav/public`, fetcher);

  const topLevel = navItems.filter((i) => !i.parentId);
  const childrenOf = (id: string) => navItems.filter((i) => i.parentId === id);

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--line)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="font-display font-bold text-xl text-[var(--coral)] shrink-0">
          Kraft Market
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {topLevel.map((item) => {
            const children = childrenOf(item._id);
            const href = resolveHref(item);
            const isActive = pathname === href;
            if (children.length > 0) {
              return (
                <div
                  key={item._id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item._id)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-colors ${isActive ? 'text-[var(--coral)] font-semibold' : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)]'}`}
                  >
                    {item.label}
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openDropdown === item._id && (
                    <div className="absolute top-full left-0 mt-1 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-lg py-1 min-w-[160px] z-50">
                      {children.map((child) => (
                        <Link
                          key={child._id}
                          href={resolveHref(child)}
                          target={child.openInNewTab ? '_blank' : undefined}
                          className="block px-4 py-2 text-sm text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item._id}
                href={href}
                target={item.openInNewTab ? '_blank' : undefined}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${isActive ? 'text-[var(--coral)] font-semibold' : 'text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)]'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Search + actions */}
        <div className="hidden sm:block max-w-xs flex-1 md:flex-none md:w-48 ml-auto md:ml-0">
          <div className="relative">
            <input
              type="search"
              placeholder="ค้นหาสินค้า..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-[var(--bg-2)] border border-[var(--line)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)] focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="ml-auto md:ml-0 flex items-center gap-1 shrink-0">
          {/* Mobile search */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="sm:hidden p-2 rounded-full hover:bg-[var(--bg-2)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-[var(--bg-2)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>

          {isLoggedIn() ? (
            <div className="hidden sm:flex items-center gap-1">
              <Link href="/account" className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full hover:bg-[var(--bg-2)] transition-colors">
                {customerUser?.avatarUrl ? (
                  <img src={customerUser.avatarUrl as string} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[var(--coral)] flex items-center justify-center text-white text-[10px] font-bold">
                    {customerUser?.name?.[0]?.toUpperCase() ?? 'U'}
                  </span>
                )}
                <span className="max-w-[80px] truncate">{customerUser?.name}</span>
              </Link>
              <button onClick={clearAuth} className="p-1.5 rounded-full hover:bg-[var(--bg-2)] transition-colors text-[var(--ink-4)]" title="ออกจากระบบ">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button onClick={openAuth} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full hover:bg-[var(--bg-2)] transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              เข้าสู่ระบบ
            </button>
          )}

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

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="sm:hidden px-4 pb-3">
          <input
            type="search"
            placeholder="ค้นหาสินค้า..."
            autoFocus
            className="w-full pl-9 pr-4 py-2 rounded-full bg-[var(--bg-2)] border border-[var(--line)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]"
          />
        </div>
      )}

      {/* Mobile nav menu */}
      {mobileMenuOpen && topLevel.length > 0 && (
        <div className="md:hidden border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3 space-y-1">
          {topLevel.map((item) => (
            <div key={item._id}>
              <Link
                href={resolveHref(item)}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] rounded-lg transition-colors"
              >
                {item.label}
              </Link>
              {childrenOf(item._id).map((child) => (
                <Link
                  key={child._id}
                  href={resolveHref(child)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block pl-7 pr-3 py-1.5 text-sm text-[var(--ink-4)] hover:text-[var(--ink)] hover:bg-[var(--bg-2)] rounded-lg transition-colors"
                >
                  ↳ {child.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

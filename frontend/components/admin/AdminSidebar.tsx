'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    group: 'OVERVIEW',
    items: [
      { href: '/admin', label: 'Dashboard', icon: '📊', key: 'dashboard' },
      { href: '/admin/pos', label: 'POS Terminal', icon: '🖥️', key: 'pos' },
    ],
  },
  {
    group: 'CONTENT',
    items: [
      { href: '/admin/pages', label: 'Pages', icon: '📄', key: 'pages' },
      { href: '/admin/builder', label: 'Page Builder', icon: '🧱', key: 'builder' },
      { href: '/admin/nav', label: 'Navbar', icon: '🔗', key: 'nav' },
    ],
  },
  {
    group: 'COMMERCE',
    items: [
      { href: '/admin/products', label: 'Products', icon: '📦', key: 'products' },
      { href: '/admin/orders', label: 'Orders', icon: '🛒', key: 'orders' },
    ],
  },
  {
    group: 'INSIGHTS',
    items: [
      { href: '/admin/analytics', label: 'Analytics', icon: '📈', key: 'analytics' },
      { href: '/admin/customers', label: 'Customers', icon: '👥', key: 'customers' },
    ],
  },
  {
    group: 'SETTINGS',
    items: [
      { href: '/admin/media', label: 'Media', icon: '🖼️', key: 'media' },
      { href: '/admin/settings', label: 'Settings', icon: '⚙️', key: 'settings' },
      { href: '/admin/staff', label: 'พนักงาน', icon: '👤', key: 'staff', adminOnly: true },
    ],
  },
];

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>('admin');
  const [menuPerms, setMenuPerms] = useState<string[] | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('kraft_token');
    if (token) {
      const payload = parseJwt(token);
      if (payload) {
        setUserRole(payload.role);
        if (payload.role === 'staff') {
          setMenuPerms(payload.menuPermissions ?? []);
        }
      }
    }
  }, []);

  const isVisible = (key: string, adminOnly?: boolean) => {
    if (userRole === 'admin') return !adminOnly ? true : true;
    if (adminOnly) return false;
    if (menuPerms === null) return true;
    return menuPerms.includes(key);
  };

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 bg-[var(--ink)] text-white flex flex-col transition-all duration-200 overflow-hidden`}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
        {!collapsed && (
          <Link href="/admin" className="font-display font-bold text-lg text-[var(--coral)]">
            Kraft Admin
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'} />
          </svg>
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {NAV.map((section) => {
          const visibleItems = section.items.filter((item) => isVisible(item.key, (item as any).adminOnly));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.group} className="mb-4">
              {!collapsed && (
                <p className="px-4 py-1 text-[10px] font-semibold tracking-widest text-white/40 uppercase">
                  {section.group}
                </p>
              )}
              {visibleItems.map((item) => {
                const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--coral)] text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="text-base shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3">
        <Link href="/" className={`flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors ${collapsed ? 'justify-center' : ''}`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {!collapsed && <span>กลับหน้าร้าน</span>}
        </Link>
      </div>
    </aside>
  );
}

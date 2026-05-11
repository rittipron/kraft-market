'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';

export function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, subtotal, vat, total } = useCartStore();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={closeCart} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[var(--surface)] z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--line)]">
          <h2 className="font-display font-bold text-lg">ตะกร้าสินค้า ({items.length})</h2>
          <button onClick={closeCart} className="p-2 rounded-full hover:bg-[var(--bg-2)] transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-16 text-[var(--ink-4)]">
              <div className="text-5xl mb-3">🛒</div>
              <p>ตะกร้าว่างเปล่า</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="w-16 h-16 rounded-xl bg-[var(--bg-2)] overflow-hidden shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">🛍️</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--ink)] line-clamp-2">{item.name}</p>
                  <p className="text-[var(--coral)] font-bold text-sm mt-1">฿{item.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateQty(item.productId, item.qty - 1)}
                      className="w-6 h-6 rounded-full border border-[var(--line)] flex items-center justify-center text-sm hover:bg-[var(--bg-2)] transition-colors"
                    >−</button>
                    <span className="text-sm w-6 text-center">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.qty + 1)}
                      className="w-6 h-6 rounded-full border border-[var(--line)] flex items-center justify-center text-sm hover:bg-[var(--bg-2)] transition-colors"
                    >+</button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[var(--line)] px-5 py-4 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[var(--ink-3)]">
                <span>ยอดรวม</span>
                <span>฿{subtotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[var(--ink-3)]">
                <span>ภาษี VAT 7%</span>
                <span>฿{vat().toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-base text-[var(--ink)] pt-1 border-t border-[var(--line)]">
                <span>รวมทั้งหมด</span>
                <span className="text-[var(--coral)]">฿{total().toLocaleString()}</span>
              </div>
            </div>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block w-full py-3 bg-[var(--coral)] text-white font-semibold rounded-full hover:bg-[var(--coral-deep)] transition-colors text-center"
            >
              ดำเนินการชำระเงิน →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { useCartStore } from '@/lib/store';
import { StoreHeader } from '@/components/store/StoreHeader';
import { CartDrawer } from '@/components/store/CartDrawer';
import type { Product } from '@/lib/api';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useSWR<Product>(`${BASE}/products/${id}`, fetcher);
  const { addItem, openCart } = useCartStore();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ productId: product._id, name: product.name, price: product.price, qty, image: product.images[0] });
    openCart();
  };

  if (isLoading) {
    return (
      <>
        <StoreHeader />
        <div className="max-w-5xl mx-auto px-4 py-10 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="aspect-square bg-[var(--bg-2)] rounded-2xl" />
            <div className="space-y-4">
              <div className="h-8 bg-[var(--bg-2)] rounded w-3/4" />
              <div className="h-6 bg-[var(--bg-2)] rounded w-1/3" />
              <div className="h-24 bg-[var(--bg-2)] rounded" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <StoreHeader />
        <div className="max-w-5xl mx-auto px-4 py-20 text-center text-[var(--ink-4)]">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-lg font-semibold">ไม่พบสินค้า</p>
          <a href="/" className="mt-4 inline-block text-[var(--coral)] hover:underline">← กลับหน้าแรก</a>
        </div>
      </>
    );
  }

  const images = product.images.length > 0 ? product.images : [''];
  const outOfStock = product.stock === 0;

  return (
    <>
      <StoreHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[var(--ink-4)] mb-8">
          <a href="/" className="hover:text-[var(--coral)]">หน้าแรก</a>
          <span>/</span>
          <a href="/" className="hover:text-[var(--coral)]">สินค้า</a>
          <span>/</span>
          <span className="text-[var(--ink)]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Gallery */}
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl bg-[var(--bg-2)] overflow-hidden border border-[var(--line)]">
              {images[activeImg] ? (
                <img src={images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl opacity-10">🛍️</div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-[var(--coral)]' : 'border-[var(--line)]'}`}
                  >
                    {img ? <img src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--bg-2)]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--ink)]">{product.name}</h1>
                {product.stock < 5 && product.stock > 0 && (
                  <span className="shrink-0 px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded-full">เหลือ {product.stock} ชิ้น</span>
                )}
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < Math.round(product.rating) ? 'text-amber-400' : 'text-[var(--bg-3)]'}`}>★</span>
                  ))}
                  <span className="text-sm text-[var(--ink-4)] ml-1">({product.reviewCount} รีวิว)</span>
                </div>
                <span className="text-sm text-[var(--ink-4)]">ขายแล้ว {product.soldCount} ชิ้น</span>
              </div>

              <p className="font-display text-3xl font-bold text-[var(--coral)] mb-4">
                ฿{product.price.toLocaleString()}
              </p>

              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-sm text-[var(--ink-3)] mb-2">รายละเอียด</h3>
                  <p className="text-[var(--ink-3)] text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {product.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 bg-[var(--bg-2)] text-[var(--ink-3)] text-xs rounded-full border border-[var(--line)]">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="p-3 bg-[var(--bg-2)] rounded-xl text-xs text-[var(--ink-4)] mb-6">
                <span className="font-semibold">SKU:</span> {product.sku}
                &nbsp;·&nbsp;
                <span className={product.stock > 0 ? 'text-[var(--good)]' : 'text-red-500'}>
                  {product.stock > 0 ? `มีสินค้า (${product.stock} ชิ้น)` : 'สินค้าหมด'}
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-3 pt-4 border-t border-[var(--line)]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[var(--ink-3)]">จำนวน</span>
                <div className="flex items-center border border-[var(--line)] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-[var(--bg-2)] transition-colors font-bold"
                  >−</button>
                  <span className="w-12 text-center font-semibold text-sm">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(product.stock, qty + 1))}
                    disabled={qty >= product.stock}
                    className="w-10 h-10 flex items-center justify-center hover:bg-[var(--bg-2)] transition-colors font-bold disabled:opacity-40"
                  >+</button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="w-full py-3.5 bg-[var(--coral)] text-white font-bold rounded-xl hover:bg-[var(--coral-deep)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {outOfStock ? 'สินค้าหมด' : '🛒 เพิ่มลงตะกร้า'}
              </button>

              <p className="text-center text-xs text-[var(--ink-4)]">
                รวม VAT 7% · จัดส่งทั่วประเทศ
              </p>
            </div>
          </div>
        </div>
      </main>
      <CartDrawer />
    </>
  );
}

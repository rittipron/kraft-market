'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import type { Product } from '@/lib/api';

interface Props {
  product: Product;
  isFlash?: boolean;
}

export function ProductCard({ product, isFlash }: Props) {
  const { addItem, openCart } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ productId: product._id, name: product.name, price: product.price, qty: 1, image: product.images[0] });
    openCart();
  };

  return (
    <Link href={`/products/${product._id}`} className="group">
      <div className="bg-[var(--surface)] rounded-2xl overflow-hidden border border-[var(--line)] hover:border-[var(--coral)] hover:shadow-lg transition-all">
        <div className="relative aspect-square bg-[var(--bg-2)] overflow-hidden">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🛍️</div>
          )}
          {isFlash && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-[var(--coral)] text-white text-[10px] font-bold rounded-full">
              FLASH
            </span>
          )}
          {product.stock < 5 && product.stock > 0 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
              เหลือ {product.stock}
            </span>
          )}
        </div>

        <div className="p-3">
          <p className="text-sm text-[var(--ink)] font-medium line-clamp-2 mb-1">{product.name}</p>
          <div className="flex items-center gap-1 mb-2">
            <span className="text-[10px] text-amber-500">★</span>
            <span className="text-[11px] text-[var(--ink-3)]">{product.rating?.toFixed(1)}</span>
            <span className="text-[11px] text-[var(--ink-4)]">({product.reviewCount})</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--coral)] font-bold text-base">
              ฿{product.price.toLocaleString()}
            </span>
            <button
              onClick={handleAddToCart}
              className="w-7 h-7 rounded-full bg-[var(--coral)] text-white flex items-center justify-center hover:bg-[var(--coral-deep)] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

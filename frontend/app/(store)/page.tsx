import { Suspense } from 'react';
import { StoreHeader } from '@/components/store/StoreHeader';
import { HeroBanner } from '@/components/store/HeroBanner';
import { CategoryGrid } from '@/components/store/CategoryGrid';
import { FlashSale } from '@/components/store/FlashSale';
import { ProductGrid } from '@/components/store/ProductGrid';
import { CartDrawer } from '@/components/store/CartDrawer';

export default function StorefrontPage() {
  return (
    <>
      <StoreHeader />
      <main className="min-h-screen">
        <HeroBanner />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
          <CategoryGrid />
          <FlashSale />
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid />
          </Suspense>
        </div>
      </main>
      <CartDrawer />
    </>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-[var(--surface)] rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-[var(--bg-2)]" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-[var(--bg-3)] rounded w-3/4" />
            <div className="h-4 bg-[var(--bg-3)] rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

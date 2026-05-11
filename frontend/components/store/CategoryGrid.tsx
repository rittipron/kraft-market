'use client';

const CATEGORIES = [
  { name: 'อาหารและเครื่องดื่ม', icon: '🍜', count: 48 },
  { name: 'ผักและผลไม้', icon: '🥬', count: 32 },
  { name: 'ของใช้ในบ้าน', icon: '🏠', count: 67 },
  { name: 'เสื้อผ้าและแฟชั่น', icon: '👗', count: 124 },
  { name: 'อิเล็กทรอนิกส์', icon: '📱', count: 89 },
  { name: 'สุขภาพและความงาม', icon: '💄', count: 56 },
  { name: 'กีฬาและกลางแจ้ง', icon: '⚽', count: 43 },
  { name: 'งานฝีมือ', icon: '🎨', count: 78 },
];

export function CategoryGrid() {
  return (
    <section id="categories">
      <h2 className="font-display text-2xl font-bold text-[var(--ink)] mb-6">หมวดหมู่สินค้า</h2>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            className="flex flex-col items-center gap-2 p-3 bg-[var(--surface)] rounded-2xl border border-[var(--line)] hover:border-[var(--coral)] hover:shadow-md transition-all group cursor-pointer"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
            <span className="text-[10px] sm:text-xs text-[var(--ink-3)] text-center leading-tight font-medium">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

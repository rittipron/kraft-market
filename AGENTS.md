# AGENTS.md — Kraft CMS + Commerce + POS

> **สำหรับ AI Agent / Coding Assistant ทุกตัว**
> อ่านไฟล์นี้ก่อนเสมอ → จากนั้นอ่าน **`SKILL.md`** → แล้วตามด้วย **`HISTORY.md`**
> ลำดับนี้บังคับ ห้ามข้าม

---

## 0. Reading Order (บังคับ)

```
1. AGENTS.md    ← ไฟล์นี้  (context + rules ของโปรเจค)
2. SKILL.md     ← debugging playbook, error patterns, self-learning loop
3. HISTORY.md   ← บันทึกสิ่งที่ทำไปแล้ว (อย่าทำซ้ำ)
```

---

## 1. Project Overview

**Kraft** คือ full-stack platform รวม **CMS + E-Commerce + POS** ออกแบบสำหรับร้านค้าที่ต้องการทั้ง online marketplace และระบบ POS หน้าร้าน

| มุมมอง | คำอธิบาย | เทียบกับ |
|--------|-----------|----------|
| **Customer Storefront** | หน้าร้านสำหรับลูกค้าซื้อของ | Shopee / Lazada |
| **Admin Panel** | จัดการร้าน + Page Builder + POS Terminal | WordPress + WooCommerce |

**Brand:** Kraft Market · **Slogan:** ของดี ของจริง จากคนทำมือทั่วไทย

---

## 2. Tech Stack (Production Target)

```
┌─────────────────────────────────────────────────────┐
│  FRONTEND          Next.js 14  (App Router)         │
│  BACKEND           NestJS 10   (REST + WebSocket)   │
│  PRIMARY DB        MongoDB 7   (via Mongoose)        │
│  CACHE / SESSION   Redis 7     (ioredis)             │
│  PROTOTYPE UI      React 18 UMD + Babel Standalone  │
└─────────────────────────────────────────────────────┘
```

> **Prototype ปัจจุบัน** ทำงานเป็น single-file React UMD + Babel  
> เมื่อ migrate ไป Next.js ให้ดู section 8 (Migration Guide)

---

## 3. Repository Structure

```
kraft-project/
├── index.html              # Prototype entry point
├── AGENTS.md               # ← ไฟล์นี้
├── SKILL.md                # Debugging & error playbook
├── HISTORY.md              # Session log
│
├── src/                    # Prototype source (React UMD)
│   ├── bundle.jsx          # รวมทุก component (compile by Babel)
│   ├── data.js             # window.KRAFT_DATA seed data
│   ├── styles.css          # Design tokens + global styles
│   ├── storefront.css      # Customer-facing styles
│   └── admin.css           # Admin panel + POS styles
│
├── frontend/               # (planned) Next.js App Router
│   ├── app/
│   │   ├── (store)/        # Customer routes
│   │   └── admin/          # Admin routes
│   ├── components/
│   └── lib/
│
├── backend/                # (planned) NestJS
│   ├── src/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── pos/
│   │   ├── auth/
│   │   └── pages/
│   └── prisma/             # หรือ mongoose schemas
│
└── infra/                  # Docker, nginx, env configs
```

---

## 4. Prototype Architecture

### Component Graph
```
App (app.jsx)
├── Modebar          — mode switcher: customer ↔ admin
├── Storefront       — customer view
│   ├── StoreHeader
│   ├── HeroBanner
│   ├── CategoryRow
│   ├── FlashDeals   — countdown timer
│   ├── ProductGrid → ProductCard → ProductDetail
│   └── Cart
│
├── Admin            — admin view
│   ├── AdminSidebar → navigate route
│   └── [route]
│       ├── dashboard   → Dashboard
│       ├── pages       → Pages
│       ├── builder     → PageBuilder
│       ├── products    → Products
│       ├── orders      → Orders
│       ├── pos         → POS Terminal
│       ├── media       → PlaceholderSection
│       ├── customers   → PlaceholderSection
│       ├── analytics   → PlaceholderSection
│       └── settings    → PlaceholderSection
│
└── TweaksPanel      — accent color, scale, density
```

### Global State Pattern (Prototype)
```js
// แต่ละ section ใน bundle.jsx expose ตัวเองผ่าน window:
window.Storefront   = Storefront;
window.AdminSidebar = AdminSidebar;
window.Dashboard    = Dashboard;
window.POS          = POS;
// ...etc
```
**ห้ามลบ** `window.X = X` assignments — ลบแล้ว App crash ทันที

### Data Layer (Prototype)
```js
window.KRAFT_DATA.products    // Array<Product>
window.KRAFT_DATA.orders      // Array<Order>
window.KRAFT_DATA.categories  // Array<Category>
window.KRAFT_DATA.pages       // Array<Page>
window.KRAFT_DATA.flashDeals  // Array<FlashDeal>
```

---

## 5. Admin Sections Reference

| Route ID | Component | สถานะ |
|----------|-----------|-------|
| `dashboard` | `Dashboard` | ✅ fully implemented |
| `pages` | `Pages` | ✅ fully implemented |
| `builder` | `PageBuilder` | ✅ fully implemented |
| `products` | `Products` | ✅ fully implemented |
| `orders` | `Orders` | ✅ fully implemented |
| `pos` | `POS` | ✅ fully implemented |
| `media` | `PlaceholderSection` | 🚧 placeholder |
| `customers` | `PlaceholderSection` | 🚧 placeholder |
| `analytics` | `PlaceholderSection` | 🚧 placeholder |
| `settings` | `PlaceholderSection` | 🚧 placeholder |

---

## 6. CSS Design Tokens

```css
/* Accent */
--coral / --coral-soft / --coral-deep   /* primary accent */
--teal  / --teal-soft                   /* secondary accent */
--amber / --amber-soft                  /* warning */

/* Text */
--ink / --ink-2 / --ink-3 / --ink-4    /* dark → light */

/* Backgrounds */
--bg / --bg-2 / --bg-3                  /* lightest → darkest */
--surface                               /* card surface (white) */
--line / --line-2                       /* border colors */

/* Fonts */
--font-display  /* Bricolage Grotesque */
--font-body     /* Plus Jakarta Sans */
--font-mono     /* JetBrains Mono */

/* Status */
--good / --good-soft   /* success green */
--bad                  /* error red */
--warn                 /* warning orange */
```

CSS Class Prefix Convention:
```
.store-*   → storefront.css  (customer view)
.admin-*   → admin.css       (admin shell)
.pos-*     → admin.css       (POS terminal)
.pb-*      → admin.css       (Page Builder)
.dash-*    → admin.css       (Dashboard)
.pl-*      → admin.css       (Products / list views)
```

---

## 7. Agent Permission Matrix

### ✅ ทำได้เลย (Auto-approve)
- แก้ไข UI, CSS, layout, animation
- เพิ่ม component ใหม่ใน `bundle.jsx`
- แก้ bug logic ใน storefront / admin
- เพิ่ม admin route ใหม่ (placeholder → real)
- เพิ่ม data ใน `KRAFT_DATA` array ที่มีอยู่แล้ว
- Refactor code ที่ไม่กระทบ data shape
- อัพเดต `HISTORY.md` หลังทำงานเสร็จ

### ⚠️ ต้องถามก่อน (Ask + Wait for confirm)
- เปลี่ยน **schema** ของ `KRAFT_DATA` (เพิ่ม/ลบ/rename field ใน objects)
- เพิ่ม **key ใหม่** ใน `KRAFT_DATA` root (products, orders, ฯลฯ)
- เปลี่ยน MongoDB schema / Mongoose model
- เพิ่ม Redis key pattern ใหม่
- เปลี่ยน NestJS API contract (request/response shape)
- เปลี่ยน Next.js route structure

**วิธีถาม:** บอกว่าจะเปลี่ยน schema ยังไง, กระทบ component อะไร, trade-off คืออะไร  
รอ "yes", "ได้เลย", "ยืนยัน" ก่อนถึงจะทำ

### ❌ ห้ามทำ (Hard block)
- ลบ `window.X = X` หรือ `Object.assign(window, {...})`
- เปลี่ยน `type="text/babel"` โดยไม่ setup bundler ก่อน
- Import ESM packages ใน bundle.jsx (ไม่มี bundler รองรับ)
- เขียน JSX ใน `<script>` ที่ไม่ใช่ `type="text/babel"`
- Commit ข้อมูล sensitive (keys, passwords, tokens)

---

## 8. Migration Guide (Prototype → Production)

เมื่อย้ายจาก prototype ไป full stack:

```
Prototype bundle.jsx section  →  Production target
──────────────────────────────────────────────────
shared.jsx (Icon, ProductImg)  →  components/ui/
storefront.jsx                 →  app/(store)/page.tsx
admin.jsx                      →  app/admin/layout.tsx
page-builder.jsx               →  app/admin/builder/page.tsx
commerce.jsx                   →  app/admin/[section]/page.tsx
data.js                        →  MongoDB seed + Mongoose models
                                   Redis cache layer (NestJS)
```

### MongoDB Collections (target)
```
products     → { _id, name, price, sku, stock, categoryId, shopId, ... }
orders       → { _id, items[], total, status, channel, customerId, ... }
customers    → { _id, name, email, phone, addresses[] }
pages        → { _id, title, slug, status, blocks[], publishedAt }
categories   → { _id, name, icon, parentId }
shops        → { _id, name, ownerId, location, verified }
```

### Redis Key Patterns (target)
```
session:{userId}          → JWT session (TTL: 7d)
pos:cart:{terminalId}     → POS active cart (TTL: 4h)
cache:products:*          → Product list cache (TTL: 5m)
cache:categories          → Category tree (TTL: 1h)
flash:deals               → Flash sale items (TTL: until end time)
rate:api:{ip}             → Rate limiting counter (TTL: 1m)
```

### NestJS Modules (target)
```
AuthModule      → JWT + Redis session
ProductModule   → CRUD + search + stock
OrderModule     → create, update status, history
POSModule       → terminal, cart, payment, receipt
PageModule      → CMS CRUD + block builder
AnalyticsModule → Redis-buffered events → MongoDB aggregate
```

---

## 9. After Each Session — Update HISTORY.md

เพิ่ม entry ใหม่ **ด้านบนสุด** ของ `HISTORY.md` (newest first):

```markdown
## Session YYYY-MM-DD HH:MM — [สรุปสั้นๆ 1 บรรทัด]

**สิ่งที่ทำ:**
- bullet 1
- bullet 2

**ไฟล์ที่แก้ไข:** `src/bundle.jsx`, `AGENTS.md`

**Schema changes:** ไม่มี  (หรืออธิบายถ้ามี)

**Known issues / TODO:**
- อะไรที่ยังค้างอยู่

---
```
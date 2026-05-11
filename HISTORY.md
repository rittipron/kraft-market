## Session 2026-05-12 (ต่อ 3) — Wire checkout + SETUP.md

**สิ่งที่ทำ:**
- เพิ่ม `POST /api/orders` endpoint (public — ไม่ต้อง login) สำหรับ customer online checkout
- เพิ่ม `CreateOnlineOrderDto` (validation ครบ) ใน orders.controller.ts
- Wire `app/(store)/cart/page.tsx` ส่ง order จริงไป backend (loading state + error display)
- สร้าง `SETUP.md` — คู่มือการติดตั้งและใช้งานสมบูรณ์ (Docker, Dev mode, บัญชีเริ่มต้น, URL list, debug tips)

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `backend/src/orders/orders.controller.ts` (เพิ่ม POST endpoint)
- `frontend/app/(store)/cart/page.tsx` (wire API + loading/error)
- `SETUP.md` (ใหม่ — คู่มือใช้งาน)

**Schema changes:** ไม่มี

**Known issues / TODO:**
- PromptPay QR ใช้ external image API (qrserver.com) — production ควรใช้ library แบบ offline
- Nginx TLS ใน docker-compose ต้องการใบรับรอง SSL จริง (`infra/certs/`) สำหรับ production

---

## Session 2026-05-12 (ต่อ 2) — Complete remaining features

**สิ่งที่ทำ:**
- สร้าง `lib/promptpay.ts` — Thai PromptPay QR generator (EMVCo spec, CRC-16 CCITT)
- อัปเดต POS Terminal ให้ใช้ QR จริงผ่าน qrserver.com API
- สร้าง `app/(store)/cart/page.tsx` — Cart + Checkout flow (3 steps: ตะกร้า → ข้อมูล → ชำระ → success, coupon KRAFT10)
- เชื่อม CartDrawer กับ `/cart` page (ปุ่ม "ดำเนินการชำระเงิน" เป็น Link จริง)
- สร้าง `backend/src/pos/pos.controller.ts` — `GET /api/pos/receipt/:orderId` ส่ง HTML ที่ auto-print
- เพิ่มปุ่ม "พิมพ์ใบเสร็จ" ใน POS success modal
- อัปเดต `app.module.ts` เพิ่ม global guards: ThrottlerGuard + JwtAuthGuard + RolesGuard (ตาม security spec)
- อัปเดต `pos.module.ts` ลงทะเบียน PosController

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `frontend/lib/promptpay.ts` (ใหม่)
- `frontend/app/(store)/cart/page.tsx` (ใหม่)
- `frontend/components/store/CartDrawer.tsx` (แก้ไข — Link ไป /cart)
- `frontend/app/admin/pos/page.tsx` (แก้ไข — QR จริง + print button)
- `backend/src/pos/pos.controller.ts` (ใหม่)
- `backend/src/pos/pos.module.ts` (แก้ไข — เพิ่ม controller)
- `backend/src/app.module.ts` (แก้ไข — global guards)

**Schema changes:** ไม่มี

**Known issues / TODO:**
- Frontend และ Backend ยังต้อง `npm install` ก่อน run
- PromptPay QR ใช้ external image API (qrserver.com) — production ควรใช้ library แบบ offline เช่น `qrcode`
- Checkout flow ยังไม่ได้ส่ง order จริงไป backend (simulate เท่านั้น) — ต้อง wire กับ `/api/orders`

---

## Session 2026-05-12 (ต่อ) — Fix missing files ตาม AGENTS.md audit

**สิ่งที่ทำ:**
- เพิ่ม `frontend/tsconfig.json` และ `postcss.config.js` (Tailwind ต้องการ)
- เพิ่ม `backend/nest-cli.json` (NestJS build ต้องการ)
- สร้าง Product Detail page `app/(store)/products/[id]/page.tsx` (gallery, qty selector, add-to-cart)
- สร้าง Admin Pages list `app/admin/pages/page.tsx` (CRUD table + status filter)
- สร้าง PlaceholderSection component
- สร้าง placeholder pages ทุกหน้าตาม AGENTS.md §5: analytics, customers, media, settings
- Admin routes ทุกเส้นทางใน sidebar มีไฟล์ page.tsx ครบ ✅

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `frontend/tsconfig.json`, `frontend/postcss.config.js`
- `backend/nest-cli.json`
- `frontend/app/(store)/products/[id]/page.tsx`
- `frontend/app/admin/pages/page.tsx`
- `frontend/components/admin/PlaceholderSection.tsx`
- `frontend/app/admin/{analytics,customers,media,settings}/page.tsx`

**Schema changes:** ไม่มี

**Known issues / TODO:**
- PromptPay QR จริงๆ ยังเป็น placeholder (ต้องการ Thai QR Prompt Pay library)
- Receipt PDF (@react-pdf/renderer) ยังไม่ implement
- Frontend และ Backend ยังต้อง `npm install` ก่อน run
- `app/(store)/cart/page.tsx` (checkout flow) ยังไม่มี — Cart ทำงานผ่าน CartDrawer แทน

---

## Session 2026-05-12 — Bootstrap complete monorepo (Phase 0–6)

**สิ่งที่ทำ:**
- Phase 0: สร้าง directory structure ทั้งหมด, infra/docker-compose.yml, infra/nginx.conf, infra/mongo-init.js, .env.example, .gitignore
- Phase 1: Backend NestJS — main.ts (Helmet/CORS/ValidationPipe), app.module.ts, Redis module, auth module (JWT + blacklist + bcrypt), decorators (@Public, @Roles), guards
- Phase 2: Backend features — Products CRUD + Redis cache, Orders + dashboard aggregations, POS WebSocket gateway + service (Lua stock decrement), Pages CMS, Health endpoints
- Phase 3: Seed script (8 categories, 12 products, 8 orders, 6 pages, admin user), backend tsconfig + package.json + Dockerfile
- Phase 4: Frontend Next.js — root layout (Bricolage/Plus Jakarta/JetBrains fonts), CSS variables, Providers (SWR), lib/api.ts, lib/store.ts (Zustand cart + auth), middleware (admin route protection)
- Phase 5: Storefront — StoreHeader, HeroBanner, CategoryGrid, FlashSale (countdown), ProductGrid (SWR paginated), ProductCard (add to cart), CartDrawer
- Phase 6: Admin — AdminSidebar (collapsible), Dashboard (stats), Products manager, Orders manager, POS Terminal (WebSocket real-time, payment modal cash/QR/card), Page Builder (drag blocks, inspector), Login page, next.config, tailwind.config, Dockerfile

**ไฟล์ที่สร้าง:**
- `infra/docker-compose.yml`, `infra/nginx.conf`, `infra/mongo-init.js`
- `backend/src/main.ts`, `app.module.ts`, `auth/*`, `products/*`, `orders/*`, `pos/*`, `pages/*`, `common/*`, `health/*`, `seed.ts`
- `backend/tsconfig.json`, `package.json`, `Dockerfile`, `.env.example`
- `frontend/app/layout.tsx`, `globals.css`, `middleware.ts`, `next.config.ts`, `tailwind.config.ts`
- `frontend/app/(store)/page.tsx`, `app/admin/page.tsx`, `app/admin/pos/page.tsx`
- `frontend/app/admin/products/page.tsx`, `app/admin/orders/page.tsx`, `app/admin/builder/page.tsx`
- `frontend/app/login/page.tsx`, `components/providers.tsx`
- `frontend/components/store/*`, `components/admin/AdminSidebar.tsx`
- `frontend/lib/api.ts`, `lib/store.ts`, `package.json`, `Dockerfile`
- `.env.example`, `.gitignore`

**Schema changes:** ไม่มีการเปลี่ยน schema หลัก (สร้างใหม่ทั้งหมด)

**Known issues / TODO:**
- Product detail page `/products/[id]` ยังไม่ได้สร้าง (next step)
- Admin pages list page ยังไม่ได้สร้าง
- PromptPay QR generation จริงๆ ยังไม่ได้ implement (ใช้ placeholder)
- Receipt PDF (@react-pdf/renderer) ยังไม่ได้ implement
- Frontend ยังไม่ได้ run `npm install` จริง — ต้อง install ก่อน run

---

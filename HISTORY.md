## Session 2026-05-12 (ต่อ 7) — Bug fixes (images + uploads) + Staff Management feature

**สิ่งที่ทำ:**
- แก้ Bug: `@IsUrl({ require_tld: false })` ใน `product.dto.ts` ให้รับ `http://localhost/...` ได้
- แก้ Bug: รูปใน Media Library ไม่แสดง — เปลี่ยน nginx จาก `proxy_pass http://backend` เป็น `alias /srv/uploads/` โดยต่อ volume `uploads_data` ตรงกับ nginx container
- Feature: Staff Management — `GET/POST/PATCH/DELETE /api/staff`, `PATCH /api/staff/:id/permissions`
- เพิ่ม `menuPermissions: string[]` ใน User schema และ JWT payload
- `frontend/app/admin/staff/page.tsx` — CRUD staff + permission modal (checkbox 11 เมนู), toggle active
- `AdminSidebar` — parse JWT, role=staff เห็นเฉพาะ menuPermissions, role=admin เห็นทั้งหมด

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `backend/src/products/product.dto.ts`, `auth/user.schema.ts`, `auth/auth.service.ts`
- `backend/src/staff/staff.controller.ts`, `staff/staff.module.ts` (ใหม่)
- `backend/src/app.module.ts`
- `frontend/app/admin/staff/page.tsx` (ใหม่)
- `frontend/components/admin/AdminSidebar.tsx`
- `frontend/lib/api.ts` (staff API + StaffMember type)
- `infra/nginx.dev.conf`, `infra/docker-compose.dev.yml`

**Schema changes:** เพิ่ม `menuPermissions: string[]` ใน User collection (default [])

**Known issues / TODO:**
- Staff ต้อง logout → login ใหม่หลัง admin อัปเดต permissions (JWT ไม่ refresh อัตโนมัติ)

---

## Session 2026-05-12 (ต่อ 6) — Analytics, Customers, Media, Settings, Product Images

**สิ่งที่ทำ:**
- Backend: `MediaModule` — multer upload (diskStorage, 5MB), `GET/POST/DELETE /media`
- Backend: `SettingsModule` — singleton `GET /settings` (public), `PATCH /settings` (admin)
- Backend: customer aggregation จาก order.note → `GET /orders/customers`
- Backend: `NestExpressApplication` + `useStaticAssets` สำหรับ uploads
- Frontend: analytics, customers, media, settings pages ครบ
- Frontend: `ImageManager` component + integrate ใน products/new + products/[id]
- infra: `uploads_data` volume, `UPLOADS_DIR` env, nginx `/uploads/` location

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `backend/src/media/`, `backend/src/settings/` (ใหม่ทั้งหมด)
- `backend/src/orders/orders.service.ts`, `orders.controller.ts`
- `backend/src/main.ts`, `backend/package.json` (@types/multer)
- `frontend/app/admin/{analytics,customers,media,settings}/page.tsx` (ใหม่)
- `frontend/components/admin/ImageManager.tsx` (ใหม่)
- `frontend/app/admin/products/new/page.tsx`, `[id]/page.tsx`
- `infra/docker-compose.yml`, `docker-compose.dev.yml`, `nginx.dev.conf`

**Schema changes:** Settings schema ใหม่ (singleton pattern)

---

## Session 2026-05-12 (ต่อ 5) — Navbar system + POS stock fix + Nav admin + Bug fixes

**สิ่งที่ทำ:**
- แก้ Bug: `CastError` ObjectId invalid → NotFoundException (products + pages service)
- แก้ Bug: Frontend crash `/products/1` — fetcher throw on `!r.ok`, null guard `?? []`
- แก้ Bug: POS "ไม่พบสต็อก" — fetch products จาก API แทน SAMPLE_PRODUCTS
- แก้ Bug: Nav controller import path (`../auth/decorators` → `../common/decorators`)
- แก้ Bug: `useSearchParams()` ใน Page Builder ต้องการ Suspense wrapper
- เพิ่ม `NavModule` + seed 5 default nav items
- `StoreHeader` — SWR fetch nav, dropdown, mobile hamburger
- `admin/nav/page.tsx` — CRUD + reorder + toggle visible
- slug field ใน Page Builder (auto + manual + reset)

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `backend/src/products/products.service.ts`, `pages/pages.service.ts`
- `backend/src/nav/` (ใหม่), `backend/src/seed.ts`, `backend/src/app.module.ts`
- `frontend/app/(store)/products/[id]/page.tsx`, `admin/pos/page.tsx`
- `frontend/app/admin/builder/page.tsx`, `admin/nav/page.tsx` (ใหม่)
- `frontend/components/store/StoreHeader.tsx`, `admin/AdminSidebar.tsx`
- `frontend/lib/api.ts`

**Schema changes:** เพิ่ม `NavItem` collection

---

## Session 2026-05-12 (ต่อ 4) — Fix page creation 500 + add public CMS page route

**สิ่งที่ทำ:**
- แก้ bug 500 ตอนสร้างหน้าใหม่: เปลี่ยน `pre('save')` → `pre('validate')` ใน `page.schema.ts` เพื่อให้ auto-generate slug ก่อน Mongoose validation ทำงาน. เพิ่ม fallback `page-{timestamp}` กรณี title เป็นภาษาไทยล้วน (slugify strip ทุก char)
- สร้าง `frontend/app/[slug]/page.tsx` — dynamic CMS page renderer สำหรับ public pages โดย fetch `/api/pages/slug/:slug` แล้ว render blocks (hero, heading, text, image, cta, columns, testimonials). แสดง 404 หน้า friendly เมื่อ page ไม่มีหรือ status ไม่ใช่ published

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `backend/src/pages/page.schema.ts` (แก้ไข — pre('save') → pre('validate') + timestamp fallback)
- `frontend/app/[slug]/page.tsx` (ใหม่ — public CMS page renderer)

**Schema changes:** ไม่มี

**Known issues / TODO:**
- Thai title → slug เป็น `page-{timestamp}` แทนที่จะเป็น Thai romanization — ยังใช้งานได้ แต่ไม่สวย (TODO: เพิ่ม Thai transliteration library)
- `/[slug]` route อาจ conflict กับ future top-level routes ที่ยังไม่ได้สร้าง

---

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

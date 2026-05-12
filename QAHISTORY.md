## QA Session 2026-05-12 19:00 — CMS page creation + public route regression

**Test scope:** User-reported bugs — สร้างหน้าใหม่ผ่าน admin → 500, เปิด /home → 404

**Result summary:**
- Total test cases: 6
- ✅ Pass: 0 (before fix) → 6 (after fix)
- ❌ Fail: 2 (BUG-004, BUG-005) — **Fixed ✅ ใน session เดียวกัน**

---

### Test Results (Session 3)

| # | Test Case | Result | Note |
|---|-----------|--------|------|
| 54 | POST /api/pages (Thai title, no slug) → 201 + auto-slug | ❌→✅ | BUG-004 fixed: pre('validate') |
| 55 | POST /api/pages (English title, no slug) → slug="about-us" | ❌→✅ | |
| 56 | POST /api/pages (Thai title fallback) → slug="page-{ts}" | ✅ | fallback timestamp slug |
| 57 | GET /[slug] frontend route → 200 | ❌→✅ | BUG-005 fixed: created [slug]/page.tsx |
| 58 | GET /home → 200 (seeded published page) | ❌→✅ | |
| 59 | GET /nonexistent-slug → 200 + friendly 404 UI | ✅ | renders 404 page, not Next.js error |

---

### BUG-004 — สร้างหน้าใหม่โดยไม่มี slug → 500

| Field | Value |
|-------|-------|
| **Severity** | 🔴 P0 — Critical |
| **Component** | API / Pages |
| **Found by** | User report |
| **Assigned to** | DEV |
| **Status** | ✅ Fixed |

**Steps to reproduce:**
1. เปิด `/admin/builder` → ใส่ชื่อหน้า → กด "บันทึก"
2. Builder ส่ง `POST /api/pages` โดยไม่มี `slug` field
3. หรือ `POST /api/pages` with `{ title: "ชื่อหน้า" }` (ไม่มี slug)

**Expected:** 201 + page สร้างสำเร็จ พร้อม slug auto-generated

**Actual:** 500 Internal Server Error

**Root cause:** `PageSchema.pre('save')` รันหลัง Mongoose `required` validation — `slug` required check fail ก่อนที่ hook จะ generate slug. ภาษาไทยยิ่งแย่กว่าเพราะ `slugify()` strip ทุก non-ASCII char → slug empty → double fail

**Fix:** เปลี่ยน `pre('save')` → `pre('validate')` + เพิ่ม fallback `page-{Date.now()}` กรณี slugify return empty string

**Retest result:** ✅ Fixed — Thai title → `page-{ts}`, English title → proper slug
**Retested on:** 2026-05-12

---

### BUG-005 — เปิด /[slug] (CMS page) → 404 Not Found

| Field | Value |
|-------|-------|
| **Severity** | 🔴 P0 — Critical |
| **Component** | Frontend / CMS |
| **Found by** | User report |
| **Assigned to** | DEV |
| **Status** | ✅ Fixed |

**Steps to reproduce:**
1. สร้าง page ใน admin → publish
2. คลิก "ดูหน้า" หรือเปิด `http://localhost/home`

**Expected:** เห็น CMS page ที่สร้างไว้

**Actual:** 404 Not Found

**Root cause:** ไม่มี Next.js route `app/[slug]/page.tsx` สำหรับ render CMS pages — API endpoint มี (`GET /api/pages/slug/:slug`) แต่ frontend ไม่มี route รับ

**Fix:** สร้าง `frontend/app/[slug]/page.tsx` — fetch page data แล้ว render blocks ทุก type (hero, heading, text, image, cta, columns, testimonials). แสดง friendly 404 UI เมื่อ page ไม่พบ

**Retest result:** ✅ Fixed — `/home`, `/about-us`, `/page-{ts}` ทุก slug render ได้ 200
**Retested on:** 2026-05-12

---

## QA Session 2026-05-12 18:00 — Gap fill: untested endpoints + frontend pages smoke test

**Test scope — endpoints ที่ยังไม่ได้ test จาก session ก่อน:**
- Health sub-endpoints: `/health/mongo`, `/health/redis`
- Orders: `GET /orders/:id` (single + auth guard + not found)
- Pages CRUD ครบ: `GET /:id`, `POST`, `PATCH`, `DELETE` + auth matrix ครบทุก role
- Frontend pages: HTTP status ทุก route (14 pages)

**Result summary:**
- Total test cases: 18
- ✅ Pass: 16
- ❌ Fail: 2 (BUG-003a, BUG-003b — **Fixed ใน session เดียวกัน**)
- ⚠️ Partial: 0
- ⏭️ Skip: 1 (POS WebSocket — ต้องใช้ socket.io client จริง)

**Bugs found:** BUG-003 (500 on duplicate key) — **Fixed ✅**

**Regression clear:** ✅ Yes

---

### Test Results (Session 2)

| # | Test Case | Result | Note |
|---|-----------|--------|------|
| 33 | GET /api/health/mongo → 200 + readyState:1 | ✅ PASS | |
| 34 | GET /api/health/redis → 200 + status:ok | ✅ PASS | |
| 35 | GET /api/orders/:id (admin) → 200 + all fields | ✅ PASS | fields: _id,items,subtotal,vat,total,status,channel,paymentMethod,receiptNumber |
| 36 | GET /api/orders/:id (no auth) → 401 | ✅ PASS | |
| 37 | GET /api/orders/:id (not found) → 404 | ✅ PASS | |
| 38 | GET /api/pages/:id (admin) → 200 | ✅ PASS | |
| 39 | GET /api/pages/:id (no auth) → 401 | ✅ PASS | |
| 40 | POST /api/pages (admin) → 201 | ✅ PASS | |
| 41 | POST /api/pages (no auth) → 401 | ✅ PASS | |
| 42 | POST /api/pages (duplicate slug) → 409 | ❌→✅ | BUG-003a, Fixed |
| 43 | PATCH /api/pages/:id (admin) → 200 updated | ✅ PASS | title+status updated |
| 44 | PATCH /api/pages/:id (no auth) → 401 | ✅ PASS | |
| 45 | DELETE /api/pages/:id (customer role) → 403 | ✅ PASS | role guard ✅ |
| 46 | DELETE /api/pages/:id (admin) → 200 | ✅ PASS | |
| 47 | POST /api/products (duplicate SKU) → 409 | ❌→✅ | BUG-003b, Fixed |
| 48 | Frontend GET / → 200 | ✅ PASS | |
| 49 | Frontend GET /login → 200 | ✅ PASS | |
| 50 | Frontend GET /cart → 200 | ✅ PASS | |
| 51 | Frontend GET /products/:id → 200 | ✅ PASS | dynamic route renders |
| 52 | Frontend GET /admin/* (no auth) → 307 | ✅ PASS | middleware redirect ✅ |
| 53 | POS WebSocket `/pos` namespace | ⏭️ SKIP | requires socket.io client |

---

### BUG-003 — Duplicate key error ส่ง HTTP 500 แทน 409

| Field | Value |
|-------|-------|
| **Severity** | 🟠 P1 — High |
| **Component** | API / Pages + API / Products |
| **Found by** | QA Agent |
| **Assigned to** | DEV |
| **Status** | ✅ Fixed |

**Affects:**
- `POST /api/pages` — duplicate `slug`
- `POST /api/products` — duplicate `sku`

**Steps to reproduce:**
1. `POST /api/pages` สร้าง page ที่มี slug ซ้ำ
2. หรือ `POST /api/products` สร้างสินค้าที่มี SKU ซ้ำ

**Expected:** HTTP 409 Conflict + `{ message: "Slug already exists" }`

**Actual:** HTTP **500 Internal Server Error** + `{ message: "Internal server error" }`

**Likely cause:** MongoDB unique index violation (error code 11000) ไม่ถูก catch ใน service layer ทำให้ NestJS default error handler รับแล้วส่ง 500

**Fix:** เพิ่ม try/catch ใน `pages.service.ts:create()` และ `products.service.ts:create()` — catch `e.code === 11000` แล้ว throw `ConflictException`

**Retest result:** ✅ Fixed
**Retested on:** 2026-05-12
**Retested by:** QA Agent

---

## QA Session 2026-05-12 17:00 — Full API regression + Docker smoke test

**Test scope (จาก HISTORY.md session 2026-05-12):**
- Feature ที่ Dev ทำ: Auth (JWT + blacklist + rate limit), Products CRUD, Orders (public checkout + admin), POS receipt, Pages CMS, Dashboard stats
- Docker compose ที่แก้ใหม่: nginx dev config, build args NEXT_PUBLIC_*, backend healthcheck

**Environment:** Docker dev stack (`docker compose -f docker-compose.yml -f docker-compose.dev.yml`)
- Backend: http://localhost/api
- Frontend: http://localhost

**Result summary:**
- Total test cases: 32
- ✅ Pass: 30
- ❌ Fail: 2
- ⚠️ Partial: 0
- ⏭️ Skip: 0

**Bugs found:** BUG-001, BUG-002 — **ทั้งคู่ Fixed ใน session เดียวกัน**

**Assigned to DEV:** ~~BUG-001 (P3)~~, ~~BUG-002 (P3)~~ — Fixed ✅

**Regression clear:** ✅ Yes — ไม่มี regression จาก Docker fix

---

### Test Results

| # | Test Case | Result | Note |
|---|-----------|--------|------|
| 1 | GET /api/health → 200 | ✅ PASS | |
| 2 | POST /api/auth/login (valid) → JWT | ✅ PASS | response key = `accessToken` |
| 3 | POST /api/auth/login (wrong password) → 401 | ✅ PASS | |
| 4 | POST /api/auth/login rate limit → 429 after 3 req/min | ✅ PASS | design behavior |
| 5 | POST /api/auth/register (new user) → 201 + JWT | ✅ PASS | role=customer |
| 6 | POST /api/auth/register (duplicate email) → 409 | ✅ PASS | |
| 7 | POST /api/auth/logout (valid token) → body empty | ❌ FAIL | HTTP 201 ← BUG-001 |
| 8 | GET /api/products (public, no auth) → 200 paginated | ✅ PASS | {items,total,page,limit,pages} |
| 9 | GET /api/products?page=2&limit=5 → 5 items | ✅ PASS | pagination ✅ |
| 10 | GET /api/products?search=น้ำผึ้ง → 1 result | ✅ PASS | Thai text search works |
| 11 | GET /api/products/:id (public) → 200 | ✅ PASS | |
| 12 | POST /api/products (no auth) → 401 | ✅ PASS | |
| 13 | POST /api/products (admin token) → 201 | ✅ PASS | |
| 14 | PATCH /api/products/:id (admin) → 200 updated | ✅ PASS | |
| 15 | DELETE /api/products/:id (admin) → 200 | ✅ PASS | |
| 16 | POST /api/orders (public checkout) → 201 + receiptNumber | ✅ PASS | receipt: KRF-YYYYMMDD-xxxxx |
| 17 | POST /api/orders (invalid paymentMethod) → 400 | ❌ FAIL | error message empty enum ← BUG-002 |
| 18 | GET /api/orders (admin) → 200 paginated | ✅ PASS | |
| 19 | GET /api/orders (no auth) → 401 | ✅ PASS | |
| 20 | PATCH /api/orders/:id/status → processing | ✅ PASS | |
| 21 | GET /api/orders/stats/dashboard → correct structure | ✅ PASS | dailySales._id.{date,channel} ✅ |
| 22 | GET /api/pos/receipt/:id (admin) → 200 HTML | ✅ PASS | |
| 23 | GET /api/pages (public) → 200 list 6 items | ✅ PASS | |
| 24 | GET /api/pages/slug/:slug → 200 | ✅ PASS | |
| 25 | Invalid JWT → 401 | ✅ PASS | |
| 26 | NoSQL injection `{"$gt":""}` in login → 400 | ✅ PASS | class-validator blocks ✅ |
| 27 | Token blacklisted after logout (GET /api/orders → 401) | ✅ PASS | Redis blacklist works |
| 28 | Frontend GET / → 200 | ✅ PASS | |
| 29 | Frontend GET /login → 200 | ✅ PASS | |
| 30 | Frontend GET /cart → 200 | ✅ PASS | |
| 31 | Frontend GET /admin (no auth) → 307 redirect to /login | ✅ PASS | middleware ✅ |
| 32 | DashboardStats TypeScript type vs API shape | ✅ PASS | topProducts/statusBreakdown match |

---

### BUG-001 — Logout endpoint returns HTTP 201 (Created)

| Field | Value |
|-------|-------|
| **Severity** | 🟢 P3 — Low |
| **Component** | API / Auth |
| **Found by** | QA Agent |
| **Assigned to** | DEV |
| **Status** | ✅ Fixed |

**Steps to reproduce:**
1. Login: `POST /api/auth/login` → get token
2. Logout: `POST /api/auth/logout` with `Authorization: Bearer <token>`
3. Observe HTTP response code

**Expected:** HTTP 200 OK (logout สำเร็จ)

**Actual:** HTTP **201 Created** (semantically ผิด — 201 แปลว่า "สร้างทรัพยากรใหม่")

**Likely cause:** NestJS `@Post()` ส่ง 201 เป็น default, ขาด `@HttpCode(200)` หรือ `@HttpCode(204)` ใน logout handler

**Fix:** เพิ่ม `@HttpCode(200)` ก่อน `@Post('logout')` ใน `auth.controller.ts`

---

### BUG-002 — Orders validation error ไม่แสดง valid values สำหรับ paymentMethod

| Field | Value |
|-------|-------|
| **Severity** | 🟢 P3 — Low |
| **Component** | API / Orders |
| **Found by** | QA Agent |
| **Assigned to** | DEV |
| **Status** | ✅ Fixed |

**Steps to reproduce:**
1. `POST /api/orders` with `paymentMethod: "cash"` (invalid value)
2. ดู error message ใน response

**Expected:** `"paymentMethod must be one of the following values: promptpay, card"`

**Actual:** `"paymentMethod must be one of the following values: "` — ไม่มีค่า enum แสดง

**Console error:**
```json
{
  "message": ["paymentMethod must be one of the following values: "],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Likely cause:** `@IsEnum(['promptpay', 'card'])` ใน DTO ใช้ plain array แทน enum object — class-validator ไม่ format message ได้ถูกต้องกับ array input

**Fix:** เปลี่ยนเป็น TypeScript enum หรือ object:
```typescript
enum PaymentMethod { PROMPTPAY = 'promptpay', CARD = 'card' }
@IsEnum(PaymentMethod) paymentMethod: PaymentMethod;
```

---

## หมายเหตุ QA (Non-bug observations)

1. **Rate limit 3 req/min บน auth** — ทำให้ automated test วิ่งยาก ควร config test environment ให้ skip rate limit หรือใช้ test token approach
2. **Search ภาษาไทย** — ใช้ `$text` index ของ MongoDB, ทำงานได้สำหรับ tag-level search (เช่น "น้ำผึ้ง") แต่ไม่ support substring ภาษาไทย (MongoDB text index tokenize by whitespace)
3. **Admin /admin/* routes → 307** — ถูกต้อง, middleware redirect unauthenticated users ไป /login
4. **Logout response body ว่าง** — ปกติสำหรับ 204 แต่เนื่องจากตอนนี้ส่ง 201 ทำให้ client อาจ confused

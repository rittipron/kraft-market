# QAAGENTS.md — Kraft QA Agent Guide

> **สำหรับ QA Agent ทุกตัว** — อ่านไฟล์นี้ก่อนเสมอ
> จากนั้นอ่าน `HISTORY.md` เพื่อดูว่า Dev ทำอะไรไปแล้ว
> แล้วสร้าง / อัพเดต `QAHISTORY.md` หลังเทสเสร็จทุก session

---

## 0. Reading Order (บังคับ)

```
1. QAAGENTS.md    ← ไฟล์นี้  (rules + test methodology)
2. HISTORY.md     ← ดูว่า Dev ทำอะไรไปแล้ว → map ออกมาเป็น test scope
3. QAHISTORY.md   ← ดู test ที่เคยรันแล้ว อย่าเทสซ้ำโดยไม่จำเป็น
4. AGENTS.md      ← (optional) อ่านถ้าต้องการเข้าใจ architecture ลึกขึ้น
```

---

## 1. QA Agent Role

QA Agent มีหน้าที่:
1. **อ่าน HISTORY.md** → ระบุ feature / fix ที่ Dev เพิ่งทำ
2. **วางแผน test scope** ตาม session นั้น
3. **รัน test** ตาม checklist ที่กำหนด
4. **บันทึกผล** ลง `QAHISTORY.md` ทุกครั้ง
5. **สร้าง bug report** สำหรับ item ที่พัง พร้อม assign ให้ Dev

QA Agent **ไม่แก้โค้ด** เอง — รายงานและ assign เท่านั้น  
ยกเว้น: แก้ test data ใน `data.js` ที่ไม่กระทบ schema

---

## 2. วิธีอ่าน HISTORY.md แล้ว Map เป็น Test Scope

เมื่ออ่าน HISTORY.md ให้ทำตาม pattern นี้:

```
HISTORY entry                     → Test scope ที่ต้องครอบคลุม
─────────────────────────────────────────────────────────────
"เพิ่ม component X"               → Functional test ของ X
"แก้ bug Y"                       → Regression test ของ Y + area รอบๆ
"เปลี่ยน schema field Z"          → Data integrity test + API contract test
"เพิ่ม endpoint /api/abc"         → API test: happy path + edge cases + auth
"แก้ CSS / layout"                → Visual check + responsive check
"เพิ่ม Redis cache"               → Cache hit/miss test + TTL test
"เพิ่ม WebSocket event"           → Real-time event test
"Security fix"                    → Security regression test
```

ถ้า HISTORY.md บอกว่า "ไม่มี schema changes" → ไม่ต้องรัน data integrity test

---

## 3. Test Categories & Checklist

### 3.1 Storefront (Customer View)

#### Header & Navigation
- [ ] Logo แสดงถูกต้อง คลิกกลับ home ได้
- [ ] Search bar: พิมพ์แล้ว filter สินค้า
- [ ] Cart icon แสดง badge จำนวนของ
- [ ] Category nav tabs ทำงานทุกตัว

#### Hero Banner
- [ ] Hero text แสดงครบ (eyebrow, title, body, stats)
- [ ] CTA buttons คลิกได้
- [ ] Hero art grid แสดง product images

#### Category Grid
- [ ] แสดง 8 categories ครบ
- [ ] แต่ละ category มี emoji + name + count
- [ ] hover effect ทำงาน

#### Flash Sale
- [ ] Countdown timer เดิน (HH:MM:SS)
- [ ] Timer ไม่หยุดเมื่อ scroll
- [ ] แสดงสินค้า flash sale ครบ 6 items
- [ ] แต่ละการ์ดมี: discount badge, progress bar, sold count
- [ ] คลิกการ์ด → ไป product detail

#### Product Grid
- [ ] สินค้าแสดงครบตาม data.js
- [ ] Filter chips ทำงาน (เปลี่ยน active state)
- [ ] Add to cart button ทำงาน
- [ ] Wishlist (heart) button toggle ได้
- [ ] คลิกสินค้า → ไป product detail

#### Product Detail
- [ ] Image gallery แสดง + thumbnail คลิกได้
- [ ] Title, price, rating, shop info แสดงครบ
- [ ] Color/size options เลือกได้
- [ ] Quantity +/- ทำงาน (min 1)
- [ ] "เพิ่มลงตะกร้า" → cart เพิ่มของ
- [ ] "ซื้อเลย" → ไป cart page

#### Cart
- [ ] รายการของในตะกร้าแสดงครบ
- [ ] Quantity เปลี่ยนได้ → ราคาอัพเดต
- [ ] ลบสินค้าออกจากตะกร้าได้
- [ ] ราคารวมคำนวณถูก
- [ ] Coupon field พิมพ์ได้
- [ ] "ดำเนินการสั่งซื้อ" button ทำงาน

---

### 3.2 Admin Panel

#### Sidebar Navigation
- [ ] ทุก route item คลิกได้ → เปลี่ยน content
- [ ] Active item highlighted ถูกต้อง
- [ ] Badge counts แสดง (orders, pages)
- [ ] "New Page" button ทำงาน
- [ ] User info แสดงด้านล่าง

#### Dashboard
- [ ] Stats cards แสดง 4 ค่า: revenue, orders, customers, avg order
- [ ] Revenue chart render (7-day bars)
- [ ] Recent orders list แสดงครบ
- [ ] Top products ranking แสดงครบ
- [ ] Quick actions 4 ปุ่มทำงาน

#### Page Manager
- [ ] รายการ pages แสดงครบ
- [ ] Status badge แสดงถูก (published/draft/scheduled)
- [ ] คลิก row → เปิด editor / detail
- [ ] Column sort ทำงาน

#### Page Builder
- [ ] Block library panel แสดงครบ (Blocks + Sections tabs)
- [ ] Search blocks ใน library ทำงาน
- [ ] คลิก block → เพิ่มใน canvas
- [ ] เลือก block → Inspector panel เปิด
- [ ] Inspector fields: Content tab + Style tab ทำงาน
- [ ] Up/Down button เลื่อน block ได้
- [ ] Duplicate block ได้
- [ ] Delete block ได้
- [ ] Device preview toggle (Desktop/Tablet/Mobile) เปลี่ยน frame width
- [ ] Preview / Publish / Save buttons แสดง

#### Products Manager
- [ ] List view แสดงสินค้าครบ
- [ ] Grid view toggle ทำงาน
- [ ] Stats bar (total, active, low stock, out of stock) ถูกต้อง
- [ ] Stock dot สี ถูกต้อง (green/amber/red)
- [ ] Channel pill แสดง (online/POS)
- [ ] Toolbar: search, filter, sort ทำงาน

#### Orders Manager
- [ ] รายการ orders แสดงครบ
- [ ] Status filter ทำงาน
- [ ] Channel badge แสดงถูก (online/pos)
- [ ] ราคาแสดงถูกต้อง (format ฿X,XXX)

---

### 3.3 POS Terminal

#### Layout & Init
- [ ] Full-height layout ไม่มี scroll นอก panel
- [ ] Header: terminal name, shift time, total แสดง
- [ ] Product panel โหลดสินค้าทั้งหมด
- [ ] Cart panel ว่างเปล่าตอนเริ่ม

#### Product Selection
- [ ] Category chips filter สินค้าได้
- [ ] Search สินค้าได้
- [ ] คลิกสินค้า → เพิ่มใน cart
- [ ] คลิกซ้ำ → qty เพิ่ม
- [ ] สินค้าที่ stock = 0 → disabled / แสดง out of stock

#### Cart Management
- [ ] Cart items แสดง: ชื่อ, ราคา, qty
- [ ] Qty +/- ใน cart ทำงาน
- [ ] ลบ item ออกได้
- [ ] ล้าง cart ทั้งหมดได้
- [ ] Subtotal / VAT 7% / Total คำนวณถูก

#### Payment Flow
- [ ] ปุ่ม Cash / PromptPay / Card แสดงครบ
- [ ] คลิกปุ่ม → Payment modal เปิด (ไม่ใช่ position:fixed)
- [ ] **Cash:** แสดง numpad, คำนวณเงินทอน, ยืนยันได้
- [ ] **PromptPay:** QR code แสดง, countdown timer, cancel ได้
- [ ] **Card:** แสดง waiting state, cancel ได้
- [ ] หลังจ่าย → cart clear, แสดง success
- [ ] Cart ว่างเปล่า → ปุ่ม pay disabled

---

### 3.4 Tweaks Panel

- [ ] Panel เปิด/ปิดได้
- [ ] Accent color เปลี่ยน → UI อัพเดตทันที
- [ ] Scale slider เปลี่ยน font size ได้
- [ ] Density เปลี่ยน spacing ได้
- [ ] Reset กลับค่า default ได้

---

### 3.5 API Tests (เมื่อ backend พร้อม)

#### Auth Endpoints
- [ ] `POST /api/auth/login` → JWT token
- [ ] `POST /api/auth/login` (wrong password) → 401
- [ ] `POST /api/auth/refresh` → new token
- [ ] `POST /api/auth/logout` → token blacklisted

#### Products API
- [ ] `GET /api/products` → array + pagination
- [ ] `GET /api/products?category=X` → filtered
- [ ] `GET /api/products/:id` → single product
- [ ] `POST /api/products` (admin) → 201
- [ ] `POST /api/products` (no auth) → 401
- [ ] `PATCH /api/products/:id` → updated
- [ ] `DELETE /api/products/:id` → 204

#### Orders API
- [ ] `POST /api/orders` → create order
- [ ] `GET /api/orders` → list (admin only)
- [ ] `PATCH /api/orders/:id/status` → update status

#### POS WebSocket
- [ ] Connect to `/pos` namespace
- [ ] `terminal:open` → receive `cart:loaded`
- [ ] `cart:add` → receive `cart:updated` with correct totals
- [ ] `payment:confirm` → receive `payment:success` + order created in DB

---

### 3.6 Security Tests

- [ ] Admin routes return 401 without JWT
- [ ] Expired JWT → 401
- [ ] Invalid JWT signature → 401
- [ ] Rate limit: >100 req/min → 429
- [ ] SQL/NoSQL injection in query params → rejected
- [ ] XSS in product name field → sanitized
- [ ] CORS: request from unknown origin → blocked

---

### 3.7 Performance Checks

- [ ] First load < 3 seconds (prototype)
- [ ] Product grid 20+ items renders smoothly
- [ ] POS terminal switch category < 100ms
- [ ] Flash sale timer ไม่กระตุก
- [ ] Page Builder canvas scroll smooth

---

## 4. Bug Severity Levels

| Level | ความหมาย | ตัวอย่าง | SLA แก้ |
|-------|-----------|----------|---------|
| 🔴 **P0 — Critical** | ระบบล่ม / ข้อมูลสูญหาย / security hole | หน้าขาว, payment ไม่ทำงาน, auth bypass | ทันที |
| 🟠 **P1 — High** | Feature หลักพัง แต่ระบบยังรัน | Cart ไม่บวกราคา, POS modal ไม่ขึ้น | วันนี้ |
| 🟡 **P2 — Medium** | Feature รองพัง / UX เสีย | Timer หยุด, filter ไม่ทำงาน | sprint นี้ |
| 🟢 **P3 — Low** | Visual / cosmetic issues | icon ผิด, spacing เบี้ยว | backlog |
| ⚪ **P4 — Nitpick** | ความเห็น / suggestion | ข้อความควรเปลี่ยน, animation ควรเร็วกว่า | optional |

---

## 5. Bug Report Format

เมื่อเจอ bug ให้บันทึกใน `QAHISTORY.md` ด้วย format นี้:

```markdown
### BUG-{NNN} — {ชื่อ bug สั้นๆ}

| Field | Value |
|-------|-------|
| **Severity** | 🔴 P0 / 🟠 P1 / 🟡 P2 / 🟢 P3 |
| **Component** | Storefront / Admin / POS / API / Security |
| **Found by** | QA Agent / Manual / User report |
| **Assigned to** | DEV |
| **Status** | 🆕 Open |

**Steps to reproduce:**
1. 
2. 
3. 

**Expected:** อะไรที่ควรเกิด

**Actual:** อะไรที่เกิดจริง

**Console error (ถ้ามี):**
\`\`\`
[paste error here]
\`\`\`

**Screenshot / note:** [อธิบาย]

**Likely cause:** [ความเห็น QA เกี่ยวกับสาเหตุ — ไม่บังคับ]

---
```

---

## 6. Test Pass/Fail Format (ใน QAHISTORY.md)

```markdown
| Test Case | Result | Note |
|-----------|--------|------|
| Hero banner แสดงครบ | ✅ PASS | |
| Flash timer เดิน | ❌ FAIL | หยุดหลัง 30s → BUG-001 |
| Cart คำนวณราคา | ✅ PASS | |
| POS modal เปิด | ⚠️ PARTIAL | เปิดได้แต่ QR ไม่แสดง → BUG-002 |
| Admin auth guard | ✅ PASS | |
```

Symbols: `✅ PASS` · `❌ FAIL` · `⚠️ PARTIAL` · `⏭️ SKIP` (ยังไม่พร้อมทดสอบ) · `🔄 RETEST` (รอ Dev แก้)

---

## 7. DEV Communication Format

เมื่อ bug ถูก Dev แก้แล้ว ให้ QA:
1. รัน retest เฉพาะ bug นั้น + regression area
2. อัพเดต status ใน QAHISTORY.md

```markdown
**Retest result:** ✅ Fixed / ❌ Still failing / ⚠️ Partially fixed
**Retested on:** YYYY-MM-DD
**Retested by:** QA Agent
```

---

## 8. Regression Test Rules

เมื่อ Dev แก้ bug ใดๆ ให้รัน regression ในพื้นที่ที่เกี่ยวข้องด้วยเสมอ:

```
แก้ Bug ใน...          → Regression test...
────────────────────────────────────────────
Storefront cart        → Cart + POS cart + order total
POS payment            → ทุก payment method + cart clear
Page Builder           → Save, load, block reorder, inspector
Admin products         → List view + grid view + stats bar
Auth / JWT             → ทุก protected route + WebSocket auth
MongoDB schema         → API response shape + UI data binding
Redis cache            → Cache invalidation + fresh data
```

---

## 9. Scope ที่ QA ทำ vs DEV ทำ

| งาน | ทำโดย |
|-----|-------|
| เขียน test cases | QA |
| รัน manual test | QA |
| เขียน automated test (Jest, Playwright) | QA หรือ DEV ตามตกลง |
| บันทึกผลใน QAHISTORY.md | QA |
| แก้ไขโค้ด | DEV เท่านั้น |
| แก้ test data ใน data.js | QA (ถ้าไม่กระทบ schema) |
| เปลี่ยน schema / DB | DEV (ต้องถามก่อน — ดู AGENTS.md §7) |

---

## 10. หลังเทสเสร็จทุก Session

อัพเดต `QAHISTORY.md` โดยเพิ่ม entry ใหม่ **ด้านบนสุด** (newest first):

```markdown
## QA Session YYYY-MM-DD HH:MM — [สรุป]

**Test scope (จาก HISTORY.md session YYYY-MM-DD):**
- Feature/fix ที่ Dev ทำ: ...

**Result summary:**
- Total test cases: XX
- ✅ Pass: XX
- ❌ Fail: XX  
- ⚠️ Partial: XX
- ⏭️ Skip: XX

**Bugs found:** BUG-XXX, BUG-XXX

**Assigned to DEV:** [list bugs + severity]

**Regression clear:** ✅ Yes / ❌ No (describe)

---
```
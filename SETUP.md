# Kraft Market — คู่มือการติดตั้งและใช้งาน

## สิ่งที่ต้องมีก่อน

| เครื่องมือ | เวอร์ชันขั้นต่ำ | ตรวจสอบ |
|-----------|--------------|--------|
| Node.js | 20.x | `node -v` |
| npm | 10.x | `npm -v` |
| Docker Desktop | 24.x | `docker -v` |
| Docker Compose | v2 | `docker compose version` |

---

## วิธีที่ 1 — รันด้วย Docker (แนะนำ)

### 1. Clone & ตั้งค่า env

```bash
cd /path/to/wordpress-pos

# สร้าง env ไฟล์จาก example
cp .env.example infra/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

แก้ไข `infra/.env`:
```env
MONGO_PASS=kraftpass
REDIS_PASS=kraftredis
JWT_SECRET=your-super-secret-256-bit-key-here
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 2. Build & Start

```bash
cd infra
docker compose up -d --build
```

รอประมาณ 2–3 นาที ให้ทุก service พร้อม

### 3. Seed ข้อมูลตัวอย่าง

```bash
cd backend
npm install
npm run seed
```

### 4. เปิดใช้งาน

| URL | คำอธิบาย |
|-----|---------|
| http://localhost | หน้าร้านค้า (ผ่าน Nginx) |
| http://localhost/admin | Admin Panel |
| http://localhost:3000 | Next.js โดยตรง |
| http://localhost:3001/api | NestJS API |
| http://localhost:3001/api/health | Health check |

---

## วิธีที่ 2 — รัน Development mode (แยก service)

### Terminal 1 — MongoDB + Redis (ผ่าน Docker)

```bash
cd infra
docker compose up mongo redis -d
```

### Terminal 2 — Backend (NestJS)

```bash
cd backend
npm install
cp .env.example .env
# แก้ MONGO_URI และ REDIS_URL ให้ชี้ localhost
npm run start:dev
```

Backend พร้อมที่: `http://localhost:3001/api`

### Terminal 3 — Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend พร้อมที่: `http://localhost:3000`

### Seed ข้อมูล (ทำครั้งแรกเท่านั้น)

```bash
cd backend
npm run seed
```

---

## บัญชีเริ่มต้น

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@kraft.market | admin1234 |

เข้าสู่ระบบได้ที่: http://localhost:3000/login

---

## โครงสร้าง URL

### หน้าร้านค้า (Customer)

| URL | หน้า |
|-----|------|
| `/` | หน้าแรก — Hero, Categories, Flash Sale, Products |
| `/products/:id` | รายละเอียดสินค้า |
| `/cart` | ตะกร้า + Checkout (3 ขั้นตอน) |
| `/login` | เข้าสู่ระบบ |

**ลอง Coupon Code:** `KRAFT10` (ลด 10%)

### Admin Panel

| URL | หน้า |
|-----|------|
| `/admin` | Dashboard — ยอดขาย, Top products, Order status |
| `/admin/products` | จัดการสินค้า — ค้นหา, กรอง, ลบ |
| `/admin/orders` | จัดการออเดอร์ — อัปเดตสถานะ |
| `/admin/pages` | จัดการหน้า CMS |
| `/admin/builder` | Page Builder — ลาก-วางบล็อก |
| `/admin/pos` | POS Terminal — real-time WebSocket |

### API Endpoints หลัก

```
GET    /api/health              — Health check
POST   /api/auth/login          — Login (จำกัด 3 req/min)
POST   /api/auth/register       — Register
POST   /api/auth/logout         — Logout (JWT blacklist)

GET    /api/products            — รายการสินค้า (public)
GET    /api/products/:id        — รายละเอียดสินค้า (public)
POST   /api/products            — สร้างสินค้า (admin/staff)
PATCH  /api/products/:id        — แก้ไขสินค้า (admin/staff)
DELETE /api/products/:id        — ลบสินค้า (admin)

POST   /api/orders              — สั่งซื้อ (public — customer checkout)
GET    /api/orders              — รายการออเดอร์ (admin/staff)
PATCH  /api/orders/:id/status   — อัปเดตสถานะ (admin/staff)
GET    /api/orders/stats/dashboard — สถิติ Dashboard (admin/staff)

GET    /api/pages               — รายการหน้า (public)
GET    /api/pages/slug/:slug    — หน้าตาม slug (public)
POST   /api/pages               — สร้างหน้า (admin/staff)
PATCH  /api/pages/:id           — แก้ไขหน้า (admin/staff)

GET    /api/pos/receipt/:id     — พิมพ์ใบเสร็จ HTML (admin/staff)
```

---

## POS Terminal — วิธีใช้

1. เข้า `/admin/pos` (ต้อง login ก่อน)
2. ระบบเชื่อมต่อ WebSocket อัตโนมัติ (Terminal ID: `POS-001`)
3. **เพิ่มสินค้า** — คลิกสินค้าในกริดซ้าย
4. **ชำระเงิน** — กดปุ่มสีส้มด้านขวา เลือกวิธีชำระ:
   - **เงินสด** — ใส่จำนวนที่รับมา ระบบคิดเงินทอนให้
   - **PromptPay** — สแกน QR Code (ใช้เบอร์ `0800000001` เป็นค่าเริ่มต้น)
   - **บัตรเครดิต** — รอสัญญาณจากเครื่องรูด
5. หลังชำระสำเร็จ กดปุ่ม **"🖨️ พิมพ์ใบเสร็จ"**

---

## Page Builder — วิธีใช้

1. เข้า `/admin/builder`
2. **เพิ่มบล็อก** — คลิกจากแถบซ้าย (Hero, Text, Image, Products, CTA, ฯลฯ)
3. **แก้ไขเนื้อหา** — คลิกบล็อก → แก้ไขในแถบขวา (Inspector)
4. **เรียงลำดับ** — ลูกศร ↑↓ ที่มุมบล็อก
5. **บันทึก** — กดปุ่ม "บันทึก" มุมขวาบน
6. ดูหน้าที่ผ่าน `/pages/slug/:slug` (ถ้า status = published)

---

## Docker — คำสั่งที่ใช้บ่อย

```bash
# ดูสถานะ services
docker compose -f infra/docker-compose.yml ps

# ดู logs
docker compose -f infra/docker-compose.yml logs -f backend
docker compose -f infra/docker-compose.yml logs -f frontend

# เข้า MongoDB shell
docker compose -f infra/docker-compose.yml exec mongo mongosh kraft

# เข้า Redis CLI
docker compose -f infra/docker-compose.yml exec redis redis-cli -a kraftredis

# หยุดทุก services
docker compose -f infra/docker-compose.yml down

# หยุดและลบ volumes (รีเซ็ตข้อมูล)
docker compose -f infra/docker-compose.yml down -v
```

---

## Debug ที่พบบ่อย (ดู SKILL.md สำหรับรายละเอียด)

| ปัญหา | วิธีแก้ |
|-------|--------|
| Backend ไม่ start | ตรวจสอบ MONGO_URI และ REDIS_URL ใน `.env` |
| `Redis connection refused` | รัน `docker compose up redis -d` |
| `MongoServerError: Authentication failed` | ตรวจสอบ user/pass ใน MONGO_URI |
| Frontend ขาว | ตรวจสอบ `NEXT_PUBLIC_API_URL` ใน `.env.local` |
| JWT token invalid | ตรวจสอบ `JWT_SECRET` ตรงกันระหว่าง `.env` |
| POS WebSocket ไม่เชื่อมต่อ | ตรวจสอบ `NEXT_PUBLIC_WS_URL` และ backend รันอยู่ |

---

## Redis Key Patterns

```bash
# ดู POS cart ทุก terminal
redis-cli -a kraftredis KEYS "pos:cart:*"

# ดู stock สินค้า
redis-cli -a kraftredis KEYS "stock:*"

# ดู JWT blacklist (logout tokens)
redis-cli -a kraftredis KEYS "blacklist:*"

# ล้าง product cache (หลังแก้ไขสินค้า)
redis-cli -a kraftredis KEYS "cache:products:*" | xargs redis-cli -a kraftredis DEL
```

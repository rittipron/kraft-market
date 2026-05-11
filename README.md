# Kraft Market

**ของดี ของจริง จากคนทำมือทั่วไทย**

Full-stack e-commerce + CMS + POS platform สำหรับร้านค้าที่ต้องการทั้ง online marketplace และระบบ POS หน้าร้าน

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Backend | NestJS 10 (REST + WebSocket) |
| Database | MongoDB 7 (Mongoose) |
| Cache / Session | Redis 7 (ioredis) |
| Infrastructure | Docker + Nginx |

---

## Quick Start

### Prerequisites

- Node.js 20.x
- Docker Desktop 24.x + Docker Compose v2

### 1. Clone & configure env

```bash
git clone https://github.com/rittipron/kraft-market.git
cd kraft-market

cp .env.example infra/.env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Edit `infra/.env`:

```env
MONGO_PASS=kraftpass
REDIS_PASS=kraftredis
JWT_SECRET=your-super-secret-256-bit-key-here
CORS_ORIGIN=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### 2. Start with Docker

```bash
cd infra
docker compose up -d --build
```

### 3. Seed sample data

```bash
cd backend
npm install
npm run seed
```

### 4. Open

| URL | Description |
|-----|-------------|
| http://localhost | Customer storefront (via Nginx) |
| http://localhost/admin | Admin panel |
| http://localhost:3000 | Next.js direct |
| http://localhost:3001/api | NestJS API |
| http://localhost:3001/api/health | Health check |

**Default admin account:** `admin@kraft.market` / `admin1234`

---

## Development Mode (without Docker app containers)

```bash
# Terminal 1 — MongoDB + Redis only
cd infra && docker compose up mongo redis -d

# Terminal 2 — Backend
cd backend && npm install && npm run start:dev

# Terminal 3 — Frontend
cd frontend && npm install && npm run dev
```

---

## Features

### Customer Storefront (`/`)
- Hero banner, category grid, flash sale countdown
- Product listing + detail pages
- Cart with 3-step checkout (cart → info → payment)
- PromptPay QR code payment
- Coupon code support (`KRAFT10` = 10% off)

### Admin Panel (`/admin`)
| Route | Feature |
|-------|---------|
| `/admin` | Dashboard — sales stats, top products, order status |
| `/admin/products` | Product management — search, filter, delete |
| `/admin/orders` | Order management — status updates |
| `/admin/pages` | CMS page management |
| `/admin/builder` | Drag-and-drop page builder |
| `/admin/pos` | POS Terminal — real-time WebSocket, PromptPay QR, receipt printing |

---

## API Reference

```
GET    /api/health
POST   /api/auth/login          (rate-limited: 3 req/min)
POST   /api/auth/register
POST   /api/auth/logout

GET    /api/products            (public)
GET    /api/products/:id        (public)
POST   /api/products            (admin/staff)
PATCH  /api/products/:id        (admin/staff)
DELETE /api/products/:id        (admin)

POST   /api/orders              (public — customer checkout)
GET    /api/orders              (admin/staff)
PATCH  /api/orders/:id/status   (admin/staff)
GET    /api/orders/stats/dashboard (admin/staff)

GET    /api/pages               (public)
GET    /api/pages/slug/:slug    (public)
POST   /api/pages               (admin/staff)
PATCH  /api/pages/:id           (admin/staff)

GET    /api/pos/receipt/:id     (admin/staff — HTML receipt for printing)
```

---

## Project Structure

```
kraft-market/
├── frontend/               # Next.js 15 App Router
│   ├── app/
│   │   ├── (store)/        # Customer routes
│   │   └── admin/          # Admin routes
│   ├── components/
│   └── lib/
├── backend/                # NestJS 10
│   └── src/
│       ├── auth/           # JWT + Redis session
│       ├── products/       # CRUD + stock
│       ├── orders/         # Order management
│       ├── pos/            # POS terminal + WebSocket
│       └── pages/          # CMS
└── infra/                  # Docker Compose + Nginx
```

---

## Common Docker Commands

```bash
# View service status
docker compose -f infra/docker-compose.yml ps

# Tail logs
docker compose -f infra/docker-compose.yml logs -f backend

# MongoDB shell
docker compose -f infra/docker-compose.yml exec mongo mongosh kraft

# Stop all services
docker compose -f infra/docker-compose.yml down

# Reset all data
docker compose -f infra/docker-compose.yml down -v
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Backend won't start | Check `MONGO_URI` and `REDIS_URL` in `backend/.env` |
| `Redis connection refused` | Run `docker compose up redis -d` |
| Frontend blank page | Check `NEXT_PUBLIC_API_URL` in `frontend/.env.local` |
| JWT token invalid | Ensure `JWT_SECRET` matches across all `.env` files |
| POS WebSocket disconnected | Check `NEXT_PUBLIC_WS_URL` and backend is running |

For detailed debugging, see [SKILL.md](SKILL.md).

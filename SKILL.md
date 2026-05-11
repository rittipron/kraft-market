# SKILL.md — Kraft Debugging & Self-Learning Playbook

> อ่านหลัง `AGENTS.md` · ใช้สำหรับ diagnose bug ด้วยตัวเอง  
> เมื่อเจอ error ใหม่ที่ไม่อยู่ใน list → ทำตาม Self-Learning Loop (section 9) แล้วบันทึกเพิ่มที่นี่

---

## 1. Stack Constraints (รู้ก่อน debug)

| Constraint | ผลกระทบ | วิธีรับมือ |
|-----------|---------|-----------|
| React UMD (ไม่มี bundler) | ไม่มี `import/export` | ใช้ `window.*` globals แทน |
| Babel Standalone (runtime) | JSX compile ช้า 1-2 วิ | รอก่อน refresh |
| `bundle.jsx` ไฟล์เดียว | ทุก section รวมกัน | แก้ใน section ที่มี `// ===== src/xxx =====` |
| ไม่มี HMR | ต้อง hard refresh | `Ctrl+Shift+R` / `Cmd+Shift+R` |
| CSS ไม่มี scoping | class name ชนกัน | ใช้ prefix ตาม convention (ดู AGENTS.md §6) |
| `useState` ซ้ำ | hook conflict | alias ต่างกันในแต่ละ section |

---

## 2. Error Lookup Table

### 🔴 CRITICAL — หน้าขาว / Blank Screen

**Diagnosis checklist (เรียงตามความน่าจะเป็น):**

```
□ 1. เปิด DevTools → Console → ดู error แรกสุด
□ 2. data.js โหลดก่อน bundle.jsx ใน index.html ไหม?
□ 3. window.KRAFT_DATA มีค่าไหม? (พิมพ์ใน console)
□ 4. มี syntax error ใน JSX ไหม? (ดู line number)
□ 5. window.ComponentName ถูก export ไหม?
□ 6. useState alias ซ้ำกันไหม?
```

---

### 🔴 `window.X is not a function` / `X is not defined`

**สาเหตุ:** component ไม่ได้ expose ผ่าน `window`

**วิธีแก้:**
```js
// เพิ่มท้าย section นั้นใน bundle.jsx
window.MyComponent = MyComponent;
// หรือ bulk
Object.assign(window, { CompA, CompB, CompC });
```

**ค้นหาใน bundle.jsx:** `window.ComponentName` — ถ้าไม่เจอ = ยังไม่ได้ export

---

### 🔴 `Cannot read properties of undefined (reading 'X')`

**สาเหตุ:** `window.KRAFT_DATA.key` ไม่มีอยู่

**วิธีหา:** `console.log(window.KRAFT_DATA)` → เช็ค key ที่ใช้กับ key ที่มีอยู่

**วิธีแก้ (quick):**
```js
// เพิ่ม optional chaining + fallback
const items = window.KRAFT_DATA?.newKey ?? [];
```

**ถ้าต้องเพิ่ม key จริงๆ → ต้องถามก่อน** (ดู AGENTS.md §7)

---

### 🔴 `useState` / Hook conflict

**สาเหตุ:** แต่ละ section ใน bundle.jsx destructure `useState` ซ้ำกัน → ต้อง alias ต่างกัน

**Pattern ที่ถูกต้อง:**
```js
// ===== src/storefront.jsx =====
const { useState, useMemo } = React;

// ===== src/admin.jsx =====
const { useState: useStateA } = React;

// ===== src/page-builder.jsx =====
const { useState: useStatePB } = React;

// ===== src/commerce.jsx =====
const { useState: useS } = React;

// ===== src/app.jsx =====
const { useState: useStateApp } = React;
```

**ห้ามเพิ่ม** `const { useState } = React;` โดยไม่ alias ในส่วนใหม่

---

### 🟡 CSS ไม่ทำงาน

**Checklist:**
```
□ CSS file โหลดใน index.html ไหม? (<link rel="stylesheet" .../>)
□ Class name ตรงกับที่ใช้ใน JSX ไหม? (copy-paste เพื่อเช็ค)
□ CSS variable ที่ใช้มีอยู่ใน :root ของ styles.css ไหม?
□ เช็ค specificity ใน DevTools → Elements → Computed
□ ใช้ prefix ถูกต้องไหม? (.store-* / .admin-* / .pos-* ฯลฯ)
```

---

### 🟡 Re-render loop / Browser ค้าง

**สาเหตุ:** `useEffect` ไม่มี dependency array หรือ dependency ผิด

**วิธีแก้:**
```js
// ❌ ผิด — วิ่งทุก render
useEffect(() => { setSomeState(compute()); });

// ✅ ถูก — มี dependency
useEffect(() => { setSomeState(compute()); }, [dep1, dep2]);

// ✅ ถูก — run once
useEffect(() => { init(); }, []);
```

---

### 🟡 POS Modal ไม่ขึ้น

**วิธีเช็ค:**
```js
// เพิ่มชั่วคราวใน POS component
console.log('paymentOpen:', paymentOpen);
```
ถ้า log บอก `false` ตลอด → ปุ่มไม่ได้ call `setPaymentOpen(true)` จริง

---

### 🟡 Page Builder block ไม่ update

**สาเหตุมักเป็น:** mutation ของ array โดยตรงแทนที่จะ return array ใหม่

```js
// ❌ ผิด — mutate in place
blocks[idx].data.title = 'new';
setBlocks(blocks);

// ✅ ถูก — immutable update
setBlocks(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, title: 'new' } } : b));
```

---

### 🟡 Flash Sale timer หยุด

**สาเหตุ:** `clearInterval` ถูก call ก่อนกำหนด หรือ component unmount

```js
useEffect(() => {
  const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
  return () => clearInterval(t);  // ← cleanup ต้องมีเสมอ
}, []);                            // ← dependency array ว่าง = run once
```

---

## 3. Next.js Specific Skills

### App Router Error Patterns

```
Error: "use client" directive missing
→ Component ใช้ useState/useEffect → ต้องเพิ่ม 'use client' บรรทัดแรก

Error: async component used in client component  
→ Server component ถูก import ใน client component → แยก fetch ออกไป

Error: hydration mismatch
→ Server render ≠ client render → เช็ค: Math.random(), Date.now(), window.*
  วิธีแก้: ใช้ useEffect + useState เพื่อ render หลัง hydrate

Error: cookies/headers used outside Server Component
→ ย้าย cookies() / headers() ไปใน Server Component หรือ Route Handler
```

### Next.js File Conventions
```
app/layout.tsx       → Root layout (fonts, providers)
app/page.tsx         → Home page (Server Component)
app/(store)/         → Route group: storefront
app/admin/           → Admin routes (protected)
app/api/             → API routes (แทน NestJS สำหรับ simple endpoints)
middleware.ts        → Auth check, redirect
```

### Data Fetching Pattern (App Router)
```tsx
// Server Component — fetch ตรงๆ
async function ProductList() {
  const products = await fetch('http://localhost:3001/api/products').then(r => r.json());
  return <ul>{products.map(p => <li key={p._id}>{p.name}</li>)}</ul>;
}

// Client Component — ใช้ SWR หรือ React Query
'use client';
import useSWR from 'swr';
function ProductGrid() {
  const { data } = useSWR('/api/products', fetcher);
  // ...
}
```

---

## 4. NestJS Specific Skills

### Module Error Patterns

```
Error: Nest can't resolve dependencies of XService
→ inject ขาดใน constructor หรือ module ไม่ได้ import provider
วิธีแก้:
  @Module({ imports: [MongooseModule.forFeature([...])], providers: [XService] })

Error: Cannot inject MongooseModel
→ ต้อง @InjectModel(Product.name) ใน constructor parameter

Error: ValidationPipe not applied
→ ต้อง app.useGlobalPipes(new ValidationPipe()) ใน main.ts
```

### NestJS Patterns ที่ใช้บ่อยในโปรเจคนี้

```typescript
// ── Controller ──
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductController {
  @Get()
  @UseInterceptors(CacheInterceptor)  // ← Redis cache
  async findAll(@Query() query: ProductQueryDto) { ... }

  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateProductDto) { ... }
}

// ── Service with Redis cache ──
@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectRedis() private redis: Redis,
  ) {}

  async findAll(query: ProductQueryDto) {
    const cacheKey = `cache:products:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const products = await this.productModel.find(query).exec();
    await this.redis.setex(cacheKey, 300, JSON.stringify(products)); // TTL: 5m
    return products;
  }
}
```

### NestJS + WebSocket (POS real-time)
```typescript
@WebSocketGateway({ namespace: 'pos' })
export class PosGateway {
  @SubscribeMessage('cart:add')
  handleCartAdd(@MessageBody() dto: CartItemDto, @ConnectedSocket() client: Socket) {
    // update Redis POS cart
    // emit back to terminal
  }
}
```

---

## 5. MongoDB / Mongoose Skills

### Schema Design สำหรับโปรเจคนี้

```typescript
// Product Schema
@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) price: number;
  @Prop({ default: 0 })     stock: number;
  @Prop({ type: Types.ObjectId, ref: 'Category' }) categoryId: Types.ObjectId;
  @Prop({ type: [String] }) tags: string[];
  @Prop({ default: 'active', enum: ['active','draft','archived'] }) status: string;
}

// Order Schema (embedded items)
@Schema({ timestamps: true })
export class Order {
  @Prop({ type: [OrderItemSchema] }) items: OrderItem[];
  @Prop({ required: true }) total: number;
  @Prop({ enum: ['pending','paid','shipped','completed','cancelled'] }) status: string;
  @Prop({ enum: ['online','pos'] }) channel: string;
  @Prop({ type: Types.ObjectId, ref: 'Customer' }) customerId: Types.ObjectId;
}
```

### Error Patterns

```
Error: Cast to ObjectId failed
→ ส่ง string ที่ไม่ใช่ valid ObjectId → ใช้ Types.ObjectId.isValid(id) เช็คก่อน

Error: E11000 duplicate key
→ unique index ชนกัน (เช่น slug ซ้ำ) → เช็ค index ด้วย db.products.getIndexes()

Error: Document validation failed
→ required field ขาด หรือ enum value ผิด → เช็ค DTO + Schema

Warning: Deprecation: findAndModify
→ ใช้ findOneAndUpdate({ returnDocument: 'after' }) แทน
```

### Aggregation Pattern (Dashboard stats)
```typescript
// ยอดขายรายวัน
const dailySales = await this.orderModel.aggregate([
  { $match: { status: 'completed', createdAt: { $gte: startDate } } },
  { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
               total: { $sum: '$total' }, count: { $sum: 1 } } },
  { $sort: { '_id': 1 } }
]);
```

---

## 6. Redis Skills

### Key Patterns สำหรับโปรเจคนี้

```
session:{userId}           → JWT session data     (TTL: 7 days)
pos:cart:{terminalId}      → POS active cart       (TTL: 4 hours)
cache:products:{hash}      → Product list cache    (TTL: 5 min)
cache:categories           → Category tree         (TTL: 1 hour)
flash:deals                → Flash sale list       (TTL: dynamic)
rate:{ip}:{endpoint}       → Rate limit counter    (TTL: 1 min)
lock:order:{orderId}       → Distributed lock      (TTL: 30 sec)
```

### Error Patterns

```
Error: Connection refused 127.0.0.1:6379
→ Redis ไม่ได้รัน → docker-compose up redis หรือ redis-server

Error: OOM command not allowed
→ Redis memory เต็ม → เช็ค maxmemory policy: allkeys-lru

Error: WRONGTYPE Operation against a key holding the wrong kind of value
→ key นั้นถูกใช้ type อื่นอยู่แล้ว (เช่น String vs Hash)
→ redis.del(key) แล้ว set ใหม่

Warning: ERR max number of clients reached
→ connection pool limit → ตรวจสอบ connection leak ใน NestJS service
```

### Redis Patterns ที่ใช้บ่อย
```typescript
// Cache-aside pattern
async getCachedOrFetch<T>(key: string, ttl: number, fetchFn: () => Promise<T>): Promise<T> {
  const cached = await this.redis.get(key);
  if (cached) return JSON.parse(cached) as T;
  const data = await fetchFn();
  await this.redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// POS cart (Hash)
await this.redis.hset(`pos:cart:${terminalId}`, productId, JSON.stringify({ qty, price }));
await this.redis.expire(`pos:cart:${terminalId}`, 14400); // 4h

// Distributed lock (สำหรับ flash sale stock)
const lock = await this.redis.set(`lock:stock:${productId}`, '1', 'NX', 'EX', 5);
if (!lock) throw new ConflictException('Stock being updated');
```

---

## 7. Security & Infrastructure Skills

### Authentication & Authorization

```typescript
// JWT Setup (NestJS)
JwtModule.registerAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: { expiresIn: '7d' },
  }),
})

// Guard pattern
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}

// Role-based access
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    const { user } = context.switchToHttp().getRequest();
    return roles.includes(user.role);
  }
}
```

### API Security Checklist
```
□ Rate limiting บน NestJS (ThrottlerModule)
□ Input validation ทุก endpoint (ValidationPipe + class-validator)
□ Sanitize MongoDB queries (ห้าม raw string interpolation)
□ CORS config เฉพาะ origin ที่อนุญาต
□ Helmet.js บน NestJS (security headers)
□ JWT secret ใน .env (ห้าม hardcode)
□ Redis session TTL ตั้งค่าถูกต้อง
□ MongoDB user permission แยก read-only/write
□ HTTPS บน production (nginx TLS termination)
□ POS terminal auth แยก token จาก admin token
```

### Environment Variables Pattern
```bash
# backend/.env
NODE_ENV=production
PORT=3001
MONGO_URI=mongodb://user:pass@mongo:27017/kraft
REDIS_URL=redis://:pass@redis:6379
JWT_SECRET=<random-256-bit>
JWT_EXPIRES=7d

# frontend/.env.local
NEXT_PUBLIC_API_URL=https://api.kraftmarket.com
NEXT_PUBLIC_WS_URL=wss://api.kraftmarket.com
```

### Docker Compose (Infrastructure)
```yaml
version: '3.9'
services:
  frontend:
    build: ./frontend
    ports: ['3000:3000']
    depends_on: [backend]

  backend:
    build: ./backend
    ports: ['3001:3001']
    depends_on: [mongo, redis]
    environment:
      MONGO_URI: mongodb://mongo:27017/kraft
      REDIS_URL: redis://redis:6379

  mongo:
    image: mongo:7
    volumes: [mongo_data:/data/db]
    ports: ['27017:27017']
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASS}

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASS} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes: [redis_data:/data]
    ports: ['6379:6379']

  nginx:
    image: nginx:alpine
    ports: ['80:80', '443:443']
    volumes: ['./infra/nginx.conf:/etc/nginx/nginx.conf', './infra/certs:/etc/nginx/certs']
    depends_on: [frontend, backend]

volumes:
  mongo_data:
  redis_data:
```

### Nginx Config Pattern
```nginx
upstream nextjs  { server frontend:3000; }
upstream nestjs  { server backend:3001; }

server {
  listen 443 ssl;
  server_name kraftmarket.com;

  location /api/ {
    proxy_pass http://nestjs;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /socket.io/ {
    proxy_pass http://nestjs;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }

  location / {
    proxy_pass http://nextjs;
  }
}
```

### Security Error Patterns
```
Error: CORS policy blocked
→ เพิ่ม origin ใน NestJS: app.enableCors({ origin: ['https://kraftmarket.com'] })

Error: jwt malformed / invalid signature  
→ JWT_SECRET ไม่ตรงกันระหว่าง sign และ verify → เช็ค .env

Error: MongoServerError: Authentication failed
→ MONGO_URI user/pass ผิด หรือ database name ผิด

Error: Redis NOAUTH Authentication required
→ Redis requirepass ตั้งไว้แต่ client ไม่ส่ง password
→ แก้ REDIS_URL เป็น redis://:password@redis:6379

Warning: helmet deprecated
→ ใช้ @nestjs/throttler แทน express-rate-limit สำหรับ NestJS
```

---

## 8. POS-Specific Skills

### POS Transaction Flow
```
1. Terminal เปิด → fetch Redis pos:cart:{terminalId}
2. สแกน/เพิ่มสินค้า → HSET pos:cart → emit WebSocket
3. กด "จ่ายเงิน" → lock stock (Redis SETNX)
4. ยืนยันชำระ → MongoDB create Order → decrement stock
5. release lock → clear Redis cart → print receipt
6. ถ้า lock timeout → rollback stock, notify terminal
```

### Race Condition (Flash Sale)
```typescript
// ใช้ Redis Lua script สำหรับ atomic decrement
const script = `
  local stock = redis.call('GET', KEYS[1])
  if tonumber(stock) >= tonumber(ARGV[1]) then
    redis.call('DECRBY', KEYS[1], ARGV[1])
    return 1
  end
  return 0
`;
const success = await this.redis.eval(script, 1, `stock:${productId}`, qty);
if (!success) throw new ConflictException('สินค้าหมด');
```

---

## 9. Self-Learning Loop (สำหรับ Error ใหม่)

เมื่อเจอ error ที่ไม่อยู่ใน list นี้:

```
Step 1: ISOLATE
  → อ่าน error message ทั้งหมด
  → หา component / file / line ที่เกิด error
  → เช็คว่า error เกิดจาก: data? state? render? network? auth?

Step 2: HYPOTHESIZE
  → error เกิดก่อนหรือหลัง component mount?
  → error เกิดทุกครั้งหรือบางครั้ง? (deterministic vs race condition)
  → มีการเปลี่ยนแปลงอะไรก่อนเกิด error?

Step 3: MINIMAL REPRODUCE
  → ลองทำให้ error เกิดซ้ำได้ใน case เล็กสุด
  → comment code ออกทีละส่วนจนหา culprit เจอ

Step 4: FIX & VERIFY
  → แก้ไข
  → เช็คว่า fix ไม่ break อย่างอื่น
  → hard refresh และทดสอบ flow ที่เกี่ยวข้อง

Step 5: DOCUMENT
  → เพิ่ม error pattern ใหม่ใน section ที่เหมาะสมของ SKILL.md นี้
  → format: ### 🔴/🟡 [Error name] + สาเหตุ + วิธีแก้
  → update HISTORY.md
```

---

## 10. Quick Reference

```bash
# รัน prototype
open index.html   # หรือใช้ live-server

# ตรวจสอบ KRAFT_DATA ใน console
window.KRAFT_DATA

# Debug component ใน console
React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

# NestJS dev
cd backend && npm run start:dev

# Next.js dev
cd frontend && npm run dev

# Docker
docker-compose up -d          # start all
docker-compose logs -f backend # tail logs
docker-compose exec mongo mongosh kraft  # mongo shell
docker-compose exec redis redis-cli      # redis cli

# Redis quick check
redis-cli KEYS "pos:*"         # ดู POS carts
redis-cli TTL "session:userId" # ดู session TTL
redis-cli FLUSHDB              # clear cache (dev only!)

# MongoDB quick check
db.products.countDocuments()
db.orders.find({ status: 'pending' }).limit(10)
db.orders.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
```
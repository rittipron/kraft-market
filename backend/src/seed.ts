import { connect, model, Schema, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/kraft';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// ── Schemas (inline for seed script) ──
const CategorySchema = new Schema({ name: String, icon: String, parentId: Schema.Types.ObjectId, count: { type: Number, default: 0 } });
const ProductSchema = new Schema({ name: String, price: Number, sku: String, stock: Number, categoryId: Schema.Types.ObjectId, tags: [String], images: [String], status: { type: String, default: 'active' }, soldCount: Number, description: String }, { timestamps: true });
const OrderSchema = new Schema({ items: [{ productId: Schema.Types.ObjectId, name: String, price: Number, qty: Number, image: String }], subtotal: Number, vat: Number, total: Number, status: String, channel: String, paymentMethod: String, receiptNumber: String, posTerminalId: String }, { timestamps: true });
const PageSchema = new Schema({ title: String, slug: String, status: String, blocks: { type: [Schema.Types.Mixed], default: [] } }, { timestamps: true, strict: false });
const UserSchema = new Schema({ email: String, password: String, name: String, role: String, isActive: { type: Boolean, default: true } }, { timestamps: true });

const CategoryModel = model('Category', CategorySchema);
const ProductModel = model('Product', ProductSchema);
const OrderModel = model('Order', OrderSchema);
const PageModel = model('Page', PageSchema);
const UserModel = model('User', UserSchema);

const categories = [
  { name: 'อาหารและเครื่องดื่ม', icon: '🍜' },
  { name: 'ผักและผลไม้', icon: '🥬' },
  { name: 'ของใช้ในบ้าน', icon: '🏠' },
  { name: 'เสื้อผ้าและแฟชั่น', icon: '👗' },
  { name: 'อิเล็กทรอนิกส์', icon: '📱' },
  { name: 'สุขภาพและความงาม', icon: '💄' },
  { name: 'กีฬาและกลางแจ้ง', icon: '⚽' },
  { name: 'งานฝีมือและของที่ระลึก', icon: '🎨' },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await connect(MONGO_URI);
  const redis = new Redis(REDIS_URL);

  // ── Users ──
  const adminPass = await bcrypt.hash('admin1234', 10);
  await UserModel.findOneAndUpdate(
    { email: 'admin@kraft.market' },
    { email: 'admin@kraft.market', password: adminPass, name: 'Admin', role: 'admin' },
    { upsert: true },
  );

  // ── Categories ──
  const catDocs = await Promise.all(
    categories.map((c) => CategoryModel.findOneAndUpdate({ name: c.name }, c, { upsert: true, new: true })),
  );

  // ── Products ──
  const products = [
    { name: 'ข้าวมันไก่ Set A', price: 65, stock: 50, tags: ['อาหาร', 'ข้าว'], soldCount: 120, categoryIdx: 0, description: 'ข้าวมันไก่พร้อมน้ำซุป น้ำจิ้มพิเศษ' },
    { name: 'ส้มตำไทย', price: 55, stock: 30, tags: ['อาหาร', 'ส้มตำ'], soldCount: 89, categoryIdx: 0, description: 'ส้มตำไทยแท้ รสเด็ด' },
    { name: 'มะม่วงน้ำดอกไม้สุก 1 กก.', price: 120, stock: 20, tags: ['ผลไม้', 'มะม่วง'], soldCount: 45, categoryIdx: 1, description: 'มะม่วงหวาน สดจากสวน' },
    { name: 'ผักออร์แกนิค Set', price: 89, stock: 15, tags: ['ผัก', 'ออร์แกนิค'], soldCount: 67, categoryIdx: 1, description: 'ผักปลอดสาร คัดสรรจากเกษตรกร' },
    { name: 'กระทะเหล็กหล่อ 28 ซม.', price: 450, stock: 10, tags: ['ครัว', 'กระทะ'], soldCount: 23, categoryIdx: 2, description: 'กระทะเหล็กหล่อทนทาน' },
    { name: 'เสื้อผ้าไหมไทย', price: 1200, stock: 8, tags: ['เสื้อผ้า', 'ผ้าไหม'], soldCount: 15, categoryIdx: 3, description: 'ผ้าไหมไทยแท้ งานทอมือ' },
    { name: 'หูฟังไร้สาย Kraft BT50', price: 1890, stock: 25, tags: ['อิเล็กทรอนิกส์', 'หูฟัง'], soldCount: 78, categoryIdx: 4, description: 'หูฟัง Bluetooth คุณภาพสูง' },
    { name: 'ครีมทาหน้าสมุนไพรไทย', price: 350, stock: 40, tags: ['สุขภาพ', 'ครีม'], soldCount: 200, categoryIdx: 5, description: 'ครีมบำรุงผิวจากสมุนไพรไทย' },
    { name: 'รองเท้าวิ่ง KraftRun', price: 2500, stock: 12, tags: ['กีฬา', 'รองเท้า'], soldCount: 34, categoryIdx: 6, description: 'รองเท้าวิ่งนุ่มเด้ง' },
    { name: 'กระเป๋าสานใบใหญ่', price: 480, stock: 6, tags: ['งานฝีมือ', 'กระเป๋า'], soldCount: 56, categoryIdx: 7, description: 'กระเป๋าสานมือจากชุมชน' },
    { name: 'น้ำผึ้งป่าแท้ 500 มล.', price: 280, stock: 18, tags: ['อาหาร', 'น้ำผึ้ง'], soldCount: 92, categoryIdx: 0, description: 'น้ำผึ้งป่าธรรมชาติ 100%' },
    { name: 'กาแฟดอยช้าง เมล็ดคั่ว', price: 380, stock: 35, tags: ['กาแฟ', 'เครื่องดื่ม'], soldCount: 145, categoryIdx: 0, description: 'กาแฟไทยพรีเมี่ยม จากดอยช้าง' },
  ];

  const productDocs = await Promise.all(
    products.map((p, i) =>
      ProductModel.findOneAndUpdate(
        { name: p.name },
        {
          name: p.name,
          price: p.price,
          stock: p.stock,
          sku: `KRF-${Date.now()}-${i}`,
          tags: p.tags,
          soldCount: p.soldCount,
          description: p.description,
          categoryId: catDocs[p.categoryIdx]?._id,
          status: 'active',
        },
        { upsert: true, new: true },
      ),
    ),
  );

  // ── Sync Redis stock ──
  for (const p of productDocs) {
    await redis.set(`stock:${p._id}`, (p as any).stock.toString());
  }
  console.log(`Synced ${productDocs.length} product stocks to Redis`);

  // ── Orders (sample) ──
  const orderSamples = [
    { status: 'completed', channel: 'online', method: 'promptpay', itemCount: 2 },
    { status: 'completed', channel: 'pos', method: 'cash', itemCount: 1 },
    { status: 'paid', channel: 'online', method: 'card', itemCount: 3 },
    { status: 'pending', channel: 'online', method: 'promptpay', itemCount: 1 },
    { status: 'completed', channel: 'pos', method: 'cash', itemCount: 2 },
    { status: 'cancelled', channel: 'online', method: 'card', itemCount: 1 },
    { status: 'shipped', channel: 'online', method: 'promptpay', itemCount: 2 },
    { status: 'completed', channel: 'pos', method: 'cash', itemCount: 3 },
  ];

  for (let i = 0; i < orderSamples.length; i++) {
    const s = orderSamples[i];
    const items = productDocs.slice(i, i + s.itemCount).map((p) => ({
      productId: p._id,
      name: (p as any).name,
      price: (p as any).price,
      qty: 1,
    }));
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const vat = Math.round(subtotal * 0.07 * 100) / 100;
    const total = subtotal + vat;

    await OrderModel.findOneAndUpdate(
      { receiptNumber: `KRF-SEED-${i + 1}` },
      {
        items,
        subtotal,
        vat,
        total,
        status: s.status,
        channel: s.channel,
        paymentMethod: s.method,
        receiptNumber: `KRF-SEED-${i + 1}`,
      },
      { upsert: true },
    );
  }

  // ── Pages ──
  const pages = [
    { title: 'หน้าแรก', slug: 'home', status: 'published', blocks: [{ id: '1', type: 'hero', data: { heading: 'ยินดีต้อนรับสู่ Kraft Market', subheading: 'ของดี ของจริง จากคนทำมือทั่วไทย' }, order: 0 }] },
    { title: 'เกี่ยวกับเรา', slug: 'about', status: 'published', blocks: [{ id: '1', type: 'heading', data: { text: 'เกี่ยวกับ Kraft Market' }, order: 0 }, { id: '2', type: 'text', data: { content: 'Kraft Market คือตลาดออนไลน์ที่รวบรวมสินค้าคุณภาพจากคนทำมือทั่วประเทศไทย' }, order: 1 }] },
    { title: 'นโยบายการคืนสินค้า', slug: 'return-policy', status: 'published', blocks: [] },
    { title: 'ติดต่อเรา', slug: 'contact', status: 'published', blocks: [] },
    { title: 'โปรโมชัน Flash Sale', slug: 'flash-sale', status: 'draft', blocks: [] },
    { title: 'หน้าดราฟต์', slug: 'draft-page', status: 'draft', blocks: [] },
  ];

  await Promise.all(
    pages.map((p) => PageModel.findOneAndUpdate({ slug: p.slug }, p, { upsert: true })),
  );

  console.log('Seed completed successfully');
  await redis.quit();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

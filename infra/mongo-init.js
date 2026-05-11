// MongoDB initialization script — runs once on first container start
db = db.getSiblingDB('kraft');

db.createUser({
  user: 'kraftapp',
  pwd: process.env.MONGO_APP_PASS || 'kraftapppass',
  roles: [{ role: 'readWrite', db: 'kraft' }],
});

db.createCollection('products');
db.createCollection('orders');
db.createCollection('customers');
db.createCollection('pages');
db.createCollection('categories');

// Indexes for products
db.products.createIndex({ status: 1, categoryId: 1 });
db.products.createIndex({ name: 'text', tags: 'text' });
db.products.createIndex({ sku: 1 }, { unique: true });

// Indexes for orders
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ customerId: 1 });
db.orders.createIndex({ receiptNumber: 1 }, { unique: true, sparse: true });

// Indexes for pages (CMS)
db.pages.createIndex({ slug: 1 }, { unique: true });
db.pages.createIndex({ status: 1 });

// Indexes for categories
db.categories.createIndex({ parentId: 1 });

print('Kraft Market database initialized');

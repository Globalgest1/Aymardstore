import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import type { Product } from './products-data';
import type { Order, CartItem } from './store';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'aymard.db');
const PRODUCTS_JSON = path.join(DATA_DIR, 'products.json');

// Global singleton to survive Next.js dev hot-reloading
const globalForDb = globalThis as unknown as { __aymard_db__?: DatabaseSync };

function initDatabase(): DatabaseSync {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);

  // Performance optimizations
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA synchronous = NORMAL;');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name_fr TEXT NOT NULL,
      name_en TEXT,
      name_es TEXT,
      brand TEXT,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      compare_price REAL,
      stock INTEGER DEFAULT 45,
      is_new INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      delivery_48h INTEGER DEFAULT 1,
      rating REAL DEFAULT 5,
      review_count INTEGER DEFAULT 0,
      badge TEXT,
      description_fr TEXT,
      description_en TEXT,
      description_es TEXT,
      images TEXT,
      colors TEXT,
      sizes TEXT,
      location_prices TEXT,
      location_compare_prices TEXT,
      variant_type TEXT,
      variant_label TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_email TEXT NOT NULL,
      total REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'EUR',
      discount_applied REAL DEFAULT 0,
      promo_code_used TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      payment_status TEXT NOT NULL DEFAULT 'UNPAID',
      payment_method TEXT DEFAULT 'COD',
      payment_transaction_id TEXT,
      shipping_address TEXT NOT NULL,
      items TEXT NOT NULL,
      tracking_number TEXT,
      carrier_name TEXT,
      carrier_phone TEXT,
      current_location TEXT,
      tracking_status_text TEXT,
      tracking_step INTEGER DEFAULT 1,
      estimated_delivery_date TEXT,
      tracking_history TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      color TEXT,
      size TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);

  // Auto-seed products from data/products.json if table is empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (countRow.count === 0 && fs.existsSync(PRODUCTS_JSON)) {
    try {
      const raw = fs.readFileSync(PRODUCTS_JSON, 'utf-8');
      const seedProducts: Product[] = JSON.parse(raw);
      if (Array.isArray(seedProducts) && seedProducts.length > 0) {
        const insertStmt = db.prepare(`
          INSERT INTO products (
            id, slug, name_fr, name_en, name_es, brand, category, price, compare_price,
            stock, is_new, is_featured, delivery_48h, rating, review_count, badge,
            description_fr, description_en, description_es, images, colors, sizes,
            location_prices, location_compare_prices, variant_type, variant_label
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        db.exec('BEGIN TRANSACTION;');
        for (const p of seedProducts) {
          insertStmt.run(
            p.id,
            p.slug,
            p.name_fr,
            p.name_en || p.name_fr,
            p.name_es || p.name_fr,
            p.brand || null,
            p.category || 'shoes',
            p.price,
            p.comparePrice || null,
            p.stock ?? 45,
            p.isNew ? 1 : 0,
            p.isFeatured ? 1 : 0,
            p.delivery48H ? 1 : 0,
            p.rating || 5,
            p.reviewCount || 0,
            p.badge || null,
            p.description_fr || '',
            p.description_en || '',
            p.description_es || '',
            JSON.stringify(p.images || []),
            JSON.stringify(p.colors || []),
            JSON.stringify(p.sizes || []),
            JSON.stringify(p.locationPrices || {}),
            JSON.stringify(p.locationComparePrices || {}),
            p.variantType || null,
            p.variantLabel || null
          );
        }
        db.exec('COMMIT;');
        console.log(`[Database] Seeding initialisé avec succès : ${seedProducts.length} produits insérés.`);
      }
    } catch (seedErr) {
      console.error('[Database] Erreur de seeding initial:', seedErr);
    }
  }

  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__aymard_db__) {
    globalForDb.__aymard_db__ = initDatabase();
  }
  return globalForDb.__aymard_db__;
}

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    slug: row.slug,
    name_fr: row.name_fr,
    name_en: row.name_en || row.name_fr,
    name_es: row.name_es || row.name_fr,
    brand: row.brand || undefined,
    category: row.category,
    price: row.price,
    comparePrice: row.compare_price || undefined,
    stock: row.stock,
    isNew: Boolean(row.is_new),
    isFeatured: Boolean(row.is_featured),
    delivery48H: Boolean(row.delivery_48h),
    rating: row.rating,
    reviewCount: row.review_count,
    badge: row.badge || null,
    description_fr: row.description_fr || '',
    description_en: row.description_en || '',
    description_es: row.description_es || '',
    images: row.images ? JSON.parse(row.images) : [],
    colors: row.colors ? JSON.parse(row.colors) : undefined,
    sizes: row.sizes ? JSON.parse(row.sizes) : undefined,
    locationPrices: row.location_prices ? JSON.parse(row.location_prices) : undefined,
    locationComparePrices: row.location_compare_prices ? JSON.parse(row.location_compare_prices) : undefined,
    variantType: row.variant_type || undefined,
    variantLabel: row.variant_label || undefined,
  };
}

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    date: row.created_at,
    customerEmail: row.customer_email,
    total: row.total,
    currency: row.currency as 'EUR' | 'FCFA',
    discountApplied: row.discount_applied || undefined,
    promoCodeUsed: row.promo_code_used || undefined,
    status: row.status as 'PENDING' | 'SHIPPED' | 'DELIVERED',
    paymentStatus: row.payment_status as any,
    paymentMethod: row.payment_method || undefined,
    paymentTransactionId: row.payment_transaction_id || undefined,
    shippingAddress: row.shipping_address ? JSON.parse(row.shipping_address) : {
      fullName: '', street: '', city: '', zipCode: '', country: '', phone: ''
    },
    items: row.items ? JSON.parse(row.items) : [],
    trackingNumber: row.tracking_number || undefined,
    carrierName: row.carrier_name || undefined,
    carrierPhone: row.carrier_phone || undefined,
    currentLocation: row.current_location || undefined,
    trackingStatusText: row.tracking_status_text || undefined,
    trackingStep: row.tracking_step || 1,
    estimatedDeliveryDate: row.estimated_delivery_date || undefined,
    trackingHistory: row.tracking_history ? JSON.parse(row.tracking_history) : undefined,
  };
}

// ===============================================
// PRODUCTS QUERIES
// ===============================================

export function getAllProducts(): Product[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM products ORDER BY is_featured DESC, id DESC').all();
  return rows.map(rowToProduct);
}

export function getProductBySlug(slug: string): Product | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug);
  return row ? rowToProduct(row) : null;
}

export function getProductById(id: string): Product | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  return row ? rowToProduct(row) : null;
}

export function upsertProducts(products: Product[]): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO products (
      id, slug, name_fr, name_en, name_es, brand, category, price, compare_price,
      stock, is_new, is_featured, delivery_48h, rating, review_count, badge,
      description_fr, description_en, description_es, images, colors, sizes,
      location_prices, location_compare_prices, variant_type, variant_label, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP
    ) ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      name_fr = excluded.name_fr,
      name_en = excluded.name_en,
      name_es = excluded.name_es,
      brand = excluded.brand,
      category = excluded.category,
      price = excluded.price,
      compare_price = excluded.compare_price,
      stock = excluded.stock,
      is_new = excluded.is_new,
      is_featured = excluded.is_featured,
      delivery_48h = excluded.delivery_48h,
      badge = excluded.badge,
      description_fr = excluded.description_fr,
      description_en = excluded.description_en,
      description_es = excluded.description_es,
      images = excluded.images,
      colors = excluded.colors,
      sizes = excluded.sizes,
      location_prices = excluded.location_prices,
      location_compare_prices = excluded.location_compare_prices,
      variant_type = excluded.variant_type,
      variant_label = excluded.variant_label,
      updated_at = CURRENT_TIMESTAMP
  `);

  db.exec('BEGIN TRANSACTION;');
  try {
    for (const p of products) {
      stmt.run(
        p.id,
        p.slug,
        p.name_fr,
        p.name_en || p.name_fr,
        p.name_es || p.name_fr,
        p.brand || null,
        p.category || 'shoes',
        p.price,
        p.comparePrice || null,
        p.stock ?? 45,
        p.isNew ? 1 : 0,
        p.isFeatured ? 1 : 0,
        p.delivery48H ? 1 : 0,
        p.rating || 5,
        p.reviewCount || 0,
        p.badge || null,
        p.description_fr || '',
        p.description_en || '',
        p.description_es || '',
        JSON.stringify(p.images || []),
        JSON.stringify(p.colors || []),
        JSON.stringify(p.sizes || []),
        JSON.stringify(p.locationPrices || {}),
        JSON.stringify(p.locationComparePrices || {}),
        p.variantType || null,
        p.variantLabel || null
      );
    }
    db.exec('COMMIT;');
    return products.length;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function clearProducts(): void {
  const db = getDb();
  db.exec('DELETE FROM products;');
}

// ===============================================
// ORDERS QUERIES
// ===============================================

export function createOrderInDb(order: Order): Order {
  const db = getDb();

  const id = order.id || `ord_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const orderNumber = order.orderNumber || `AYM-${Date.now().toString().slice(-6)}`;

  const insertOrderStmt = db.prepare(`
    INSERT INTO orders (
      id, order_number, customer_email, total, currency, discount_applied, promo_code_used,
      status, payment_status, payment_method, payment_transaction_id, shipping_address, items,
      tracking_number, carrier_name, carrier_phone, current_location, tracking_status_text,
      tracking_step, estimated_delivery_date, tracking_history
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItemStmt = db.prepare(`
    INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, color, size)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStockStmt = db.prepare(`
    UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?
  `);

  db.exec('BEGIN TRANSACTION;');
  try {
    insertOrderStmt.run(
      id,
      orderNumber,
      order.customerEmail.toLowerCase().trim(),
      order.total,
      order.currency || 'EUR',
      order.discountApplied || 0,
      order.promoCodeUsed || null,
      order.status || 'PENDING',
      order.paymentStatus || 'UNPAID',
      order.paymentMethod || 'COD',
      order.paymentTransactionId || null,
      JSON.stringify(order.shippingAddress || {}),
      JSON.stringify(order.items || []),
      order.trackingNumber || null,
      order.carrierName || null,
      order.carrierPhone || null,
      order.currentLocation || null,
      order.trackingStatusText || null,
      order.trackingStep || 1,
      order.estimatedDeliveryDate || null,
      JSON.stringify(order.trackingHistory || [])
    );

    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        insertItemStmt.run(
          itemId,
          id,
          item.product.id,
          item.product.name_fr || item.product.slug,
          item.quantity,
          item.product.price,
          item.color || null,
          item.size || null
        );

        // Atomically decrement stock
        updateStockStmt.run(item.quantity, item.product.id);
      }
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  const createdRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  return rowToOrder(createdRow);
}

export function getAllOrders(): Order[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  return rows.map(rowToOrder);
}

export function getOrdersByCustomer(email: string): Order[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC').all(email.toLowerCase().trim());
  return rows.map(rowToOrder);
}

export function getOrderById(idOrNumber: string): Order | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM orders WHERE id = ? OR order_number = ?').get(idOrNumber, idOrNumber);
  return row ? rowToOrder(row) : null;
}

export function updateOrderStatusInDb(
  idOrNumber: string,
  updates: {
    status?: 'PENDING' | 'SHIPPED' | 'DELIVERED';
    paymentStatus?: string;
    trackingNumber?: string;
    carrierName?: string;
    carrierPhone?: string;
    currentLocation?: string;
    trackingStatusText?: string;
    trackingStep?: number;
    estimatedDeliveryDate?: string;
  }
): Order | null {
  const db = getDb();
  const current = getOrderById(idOrNumber);
  if (!current) return null;

  const newStatus = updates.status || current.status;
  const newPayStatus = updates.paymentStatus || current.paymentStatus;
  const newTrackingNumber = updates.trackingNumber !== undefined ? updates.trackingNumber : current.trackingNumber;
  const newCarrierName = updates.carrierName !== undefined ? updates.carrierName : current.carrierName;
  const newCarrierPhone = updates.carrierPhone !== undefined ? updates.carrierPhone : current.carrierPhone;
  const newLocation = updates.currentLocation !== undefined ? updates.currentLocation : current.currentLocation;
  const newStatusText = updates.trackingStatusText !== undefined ? updates.trackingStatusText : current.trackingStatusText;
  const newTrackingStep = updates.trackingStep !== undefined ? updates.trackingStep : current.trackingStep;
  const newEstDate = updates.estimatedDeliveryDate !== undefined ? updates.estimatedDeliveryDate : current.estimatedDeliveryDate;

  db.prepare(`
    UPDATE orders SET
      status = ?,
      payment_status = ?,
      tracking_number = ?,
      carrier_name = ?,
      carrier_phone = ?,
      current_location = ?,
      tracking_status_text = ?,
      tracking_step = ?,
      estimated_delivery_date = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ? OR order_number = ?
  `).run(
    newStatus,
    newPayStatus,
    newTrackingNumber || null,
    newCarrierName || null,
    newCarrierPhone || null,
    newLocation || null,
    newStatusText || null,
    newTrackingStep,
    newEstDate || null,
    idOrNumber,
    idOrNumber
  );

  return getOrderById(idOrNumber);
}

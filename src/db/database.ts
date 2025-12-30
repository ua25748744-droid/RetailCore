/**
 * RetailCore Database Module
 * ===========================
 * SQLite database using wa-sqlite with IndexedDB persistence
 * Provides offline-first data storage for the POS application
 */

import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite-async.mjs';
import * as SQLite from 'wa-sqlite';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';
import { SCHEMA, INDEXES, INITIAL_SETTINGS } from './schema';

// Database configuration
const DB_NAME = 'retailcore';
const VFS_NAME = 'idb-batch-atomic';

// Database instance
let db: number | null = null;
let sqlite3: SQLiteAPI | null = null;

// SQLite API type (simplified)
interface SQLiteAPI {
    open_v2: (filename: string, flags?: number, vfs?: string) => Promise<number>;
    exec: (db: number, sql: string, callback?: (row: Record<string, SQLiteCompatibleType>, columns: string[]) => void) => Promise<number>;
    close: (db: number) => Promise<number>;
    changes: (db: number) => number;
    // Add more as needed
}

type SQLiteCompatibleType = string | number | null | Uint8Array;

/**
 * Initialize the database
 * Creates tables and indexes if they don't exist
 */
export async function initDatabase(): Promise<void> {
    if (db !== null) {
        console.log('Database already initialized');
        return;
    }

    try {
        console.log('Initializing wa-sqlite database...');

        // Load the SQLite WebAssembly module
        const module = await SQLiteESMFactory();
        const api = SQLite.Factory(module);
        sqlite3 = api as unknown as SQLiteAPI;

        // Create the VFS for IndexedDB persistence
        const vfs = new IDBBatchAtomicVFS(VFS_NAME);
        await vfs.isReady;
        // Register VFS using the same API instance
        api.vfs_register(vfs, true);

        // Open the database
        db = await sqlite3.open_v2(
            DB_NAME,
            SQLite.SQLITE_OPEN_CREATE | SQLite.SQLITE_OPEN_READWRITE,
            VFS_NAME
        );

        console.log('Database opened successfully');

        // CRITICAL: Set these PRAGMA settings immediately to prevent journal file issues
        // Run them directly without our wrapper to avoid circular issues
        await sqlite3.exec(db, 'PRAGMA journal_mode = OFF;');
        await sqlite3.exec(db, 'PRAGMA synchronous = OFF;');
        await sqlite3.exec(db, 'PRAGMA foreign_keys = ON;');

        console.log('PRAGMA settings applied');

        // Create all tables
        for (const [tableName, createSQL] of Object.entries(SCHEMA)) {
            await executeSQL(createSQL);
            console.log(`Table ${tableName} initialized`);
        }

        // Create indexes
        for (const indexSQL of INDEXES) {
            await executeSQL(indexSQL);
        }
        console.log('Indexes created');

        // Insert initial settings if not exist
        const settingsCount = await querySingle<{ count: number }>(
            'SELECT COUNT(*) as count FROM settings'
        );

        if (settingsCount && settingsCount.count === 0) {
            for (const setting of INITIAL_SETTINGS) {
                await executeSQL(
                    'INSERT INTO settings (key, value) VALUES (?, ?)',
                    [setting.key, setting.value]
                );
            }
            console.log('Initial settings inserted');
        }

        // Check if we need to seed demo data
        const productCount = await querySingle<{ count: number }>(
            'SELECT COUNT(*) as count FROM products'
        );

        if (productCount && productCount.count === 0) {
            await seedDemoData();
        }

        console.log('Database initialization complete!');
    } catch (error) {
        console.error('Database initialization failed:', error);
        throw error;
    }
}

/**
 * Execute a SQL statement (INSERT, UPDATE, DELETE, CREATE, etc.)
 */
export async function executeSQL(
    sql: string,
    params: SQLiteCompatibleType[] = []
): Promise<{ changes: number }> {
    if (!db || !sqlite3) {
        throw new Error('Database not initialized');
    }

    // Simple parameter substitution for wa-sqlite
    let processedSQL = sql;
    params.forEach((param, _index) => {
        const value = param === null ? 'NULL' :
            typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` :
                String(param);
        processedSQL = processedSQL.replace('?', value);
    });

    await sqlite3.exec(db, processedSQL);
    return { changes: sqlite3.changes(db) };
}

/**
 * Query the database and return all matching rows
 */
export async function queryAll<T>(
    sql: string,
    params: SQLiteCompatibleType[] = []
): Promise<T[]> {
    if (!db || !sqlite3) {
        throw new Error('Database not initialized');
    }

    // Simple parameter substitution
    let processedSQL = sql;
    params.forEach((param) => {
        const value = param === null ? 'NULL' :
            typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` :
                String(param);
        processedSQL = processedSQL.replace('?', value);
    });

    const results: T[] = [];
    await sqlite3.exec(db, processedSQL, (row) => {
        results.push(row as T);
    });

    return results;
}

/**
 * Query the database and return a single row
 */
export async function querySingle<T>(
    sql: string,
    params: SQLiteCompatibleType[] = []
): Promise<T | null> {
    const results = await queryAll<T>(sql, params);
    return results.length > 0 ? results[0] : null;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
    if (db && sqlite3) {
        await sqlite3.close(db);
        db = null;
        console.log('Database connection closed');
    }
}

/**
 * Check if database is initialized
 */
export function isDatabaseReady(): boolean {
    return db !== null && sqlite3 !== null;
}

/**
 * Seed demo data for development
 */
async function seedDemoData(): Promise<void> {
    console.log('Seeding demo data...');

    // Insert demo categories
    await executeSQL(`
    INSERT INTO categories (name, name_ur, description) VALUES
    ('Grocery', 'گروسری', 'Food and grocery items'),
    ('Dairy', 'ڈیری', 'Milk and dairy products'),
    ('Beverages', 'مشروبات', 'Drinks and beverages')
  `);

    // Insert demo products
    const demoProducts = [
        { name: 'Basmati Rice 5kg', name_ur: 'باسمتی چاول 5 کلو', sku: 'RICE-001', barcode: '8901234567890', category_id: 1, cost_price: 850, selling_price: 950, quantity: 50, min_stock_level: 10, unit: 'bag' },
        { name: 'Cooking Oil 5L', name_ur: 'کھانا پکانے کا تیل 5 لیٹر', sku: 'OIL-001', barcode: '8901234567891', category_id: 1, cost_price: 2200, selling_price: 2450, quantity: 30, min_stock_level: 5, unit: 'bottle' },
        { name: 'Sugar 1kg', name_ur: 'چینی 1 کلو', sku: 'SUG-001', barcode: '8901234567892', category_id: 1, cost_price: 140, selling_price: 160, quantity: 100, min_stock_level: 20, unit: 'pack' },
        { name: 'Tea 200g', name_ur: 'چائے 200 گرام', sku: 'TEA-001', barcode: '8901234567893', category_id: 3, cost_price: 380, selling_price: 420, quantity: 45, min_stock_level: 10, unit: 'pack' },
        { name: 'Flour 10kg', name_ur: 'آٹا 10 کلو', sku: 'FLR-001', barcode: '8901234567894', category_id: 1, cost_price: 950, selling_price: 1100, quantity: 8, min_stock_level: 15, unit: 'bag' },
        { name: 'Milk Powder 400g', name_ur: 'دودھ پاؤڈر 400 گرام', sku: 'MLK-001', barcode: '8901234567895', category_id: 2, cost_price: 650, selling_price: 750, quantity: 25, min_stock_level: 8, unit: 'tin' },
    ];

    for (const p of demoProducts) {
        await executeSQL(`
      INSERT INTO products (name, name_ur, sku, barcode, category_id, cost_price, selling_price, quantity, min_stock_level, wac_cost, unit, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [p.name, p.name_ur, p.sku, p.barcode, p.category_id, p.cost_price, p.selling_price, p.quantity, p.min_stock_level, p.cost_price, p.unit]);
    }

    // Insert demo customers
    const demoCustomers = [
        { name: 'Ali Khan', phone: '0300-1234567', credit_limit: 50000, credit_balance: 15000 },
        { name: 'Fatima Bibi', phone: '0321-9876543', credit_limit: 30000, credit_balance: 8500 },
        { name: 'Muhammad Usman', phone: '0333-5555555', credit_limit: 25000, credit_balance: 0 },
    ];

    for (const c of demoCustomers) {
        await executeSQL(`
      INSERT INTO customers (name, phone, credit_limit, credit_balance, is_active)
      VALUES (?, ?, ?, ?, 1)
    `, [c.name, c.phone, c.credit_limit, c.credit_balance]);
    }

    // Insert a default user
    await executeSQL(`
    INSERT INTO users (name, email, password_hash, role, is_active)
    VALUES ('Admin', 'admin@retailcore.local', 'demo', 'admin', 1)
  `);

    console.log('Demo data seeded successfully!');
}

/**
 * Get all products from database
 */
export async function getAllProducts() {
    return queryAll(`
    SELECT * FROM products WHERE is_active = 1 ORDER BY name ASC
  `);
}

/**
 * Get all customers from database
 */
export async function getAllCustomers() {
    return queryAll(`
    SELECT * FROM customers WHERE is_active = 1 ORDER BY name ASC
  `);
}

/**
 * Get customer ledger entries
 */
export async function getCustomerLedger(customerId: number) {
    return queryAll(`
    SELECT * FROM ledgers 
    WHERE customer_id = ? 
    ORDER BY created_at DESC
  `, [customerId]);
}

/**
 * Update product quantity
 */
export async function updateProductQuantity(productId: number, newQuantity: number) {
    return executeSQL(`
    UPDATE products 
    SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [newQuantity, productId]);
}

/**
 * Add a new product
 */
export async function addProduct(product: {
    name: string;
    name_ur?: string;
    sku?: string;
    barcode?: string;
    category_id?: number;
    cost_price: number;
    selling_price: number;
    quantity: number;
    min_stock_level?: number;
    unit?: string;
}) {
    return executeSQL(`
    INSERT INTO products (name, name_ur, sku, barcode, category_id, cost_price, selling_price, quantity, min_stock_level, wac_cost, unit, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `, [
        product.name,
        product.name_ur || null,
        product.sku || null,
        product.barcode || null,
        product.category_id || null,
        product.cost_price,
        product.selling_price,
        product.quantity,
        product.min_stock_level || 5,
        product.cost_price,
        product.unit || 'piece'
    ]);
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: number, product: {
    name?: string;
    name_ur?: string;
    sku?: string;
    barcode?: string;
    category_id?: number;
    cost_price?: number;
    selling_price?: number;
    quantity?: number;
    min_stock_level?: number;
    unit?: string;
    description?: string;
}) {
    const updateFields: string[] = [];
    const values: (string | number | null)[] = [];

    if (product.name !== undefined) { updateFields.push('name = ?'); values.push(product.name); }
    if (product.name_ur !== undefined) { updateFields.push('name_ur = ?'); values.push(product.name_ur || null); }
    if (product.sku !== undefined) { updateFields.push('sku = ?'); values.push(product.sku || null); }
    if (product.barcode !== undefined) { updateFields.push('barcode = ?'); values.push(product.barcode || null); }
    if (product.category_id !== undefined) { updateFields.push('category_id = ?'); values.push(product.category_id || null); }
    if (product.cost_price !== undefined) { updateFields.push('cost_price = ?'); values.push(product.cost_price); }
    if (product.selling_price !== undefined) { updateFields.push('selling_price = ?'); values.push(product.selling_price); }
    if (product.quantity !== undefined) { updateFields.push('quantity = ?'); values.push(product.quantity); }
    if (product.min_stock_level !== undefined) { updateFields.push('min_stock_level = ?'); values.push(product.min_stock_level); }
    if (product.unit !== undefined) { updateFields.push('unit = ?'); values.push(product.unit); }
    if (product.description !== undefined) { updateFields.push('description = ?'); values.push(product.description || null); }

    if (updateFields.length === 0) return { changes: 0 };

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(productId);

    return executeSQL(
        `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`,
        values
    );
}

/**
 * Delete a product (soft delete)
 */
export async function deleteProduct(productId: number) {
    return executeSQL(
        'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [productId]
    );
}

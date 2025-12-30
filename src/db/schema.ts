// Database schema for RetailCore ERP
// Using wa-sqlite (WebAssembly SQLite) for offline-first architecture

export const DB_NAME = 'retailcore.db';
export const DB_VERSION = 1;

// SQL statements for table creation
export const SCHEMA = {
    // Users table - for authentication and user management
    users: `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

    // Suppliers table - for managing product suppliers
    suppliers: `
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

    // Categories table - for product categorization
    categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ur TEXT,
      description TEXT,
      parent_id INTEGER,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `,

    // Products table - main inventory
    products: `
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ur TEXT,
      sku TEXT UNIQUE,
      barcode TEXT,
      category_id INTEGER,
      supplier_id INTEGER,
      cost_price REAL NOT NULL DEFAULT 0,
      selling_price REAL NOT NULL DEFAULT 0,
      quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 5,
      wac_cost REAL DEFAULT 0,
      unit TEXT DEFAULT 'piece',
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
    );
  `,

    // Customers table - for customer management and credit tracking
    customers: `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      credit_limit REAL DEFAULT 0,
      credit_balance REAL DEFAULT 0,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,

    // Sales table - transaction records
    sales: `
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE,
      customer_id INTEGER,
      user_id INTEGER NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      discount_percent REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL NOT NULL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'credit', 'card', 'mixed')),
      payment_received REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `,

    // Sale items table - line items for each sale
    sale_items: `
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      total REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );
  `,

    // Stock movements table - for tracking inventory changes
    stock_movements: `
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'return', 'damage')),
      quantity INTEGER NOT NULL,
      unit_cost REAL,
      reference_id INTEGER,
      reference_type TEXT,
      notes TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `,

    // Ledgers table - for customer credit (Udhaar/Khata) system
    ledgers: `
    CREATE TABLE IF NOT EXISTS ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'opening')),
      amount REAL NOT NULL,
      balance REAL NOT NULL,
      reference_id INTEGER,
      reference_type TEXT,
      description TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    );
  `,

    // Settings table - for app configuration
    settings: `
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,
};

// Indexes for performance optimization
export const INDEXES = [
    'CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);',
    'CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);',
    'CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);',
    'CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);',
    'CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);',
    'CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);',
    'CREATE INDEX IF NOT EXISTS idx_ledgers_customer ON ledgers(customer_id);',
    'CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);',
];

// Initial data for settings
export const INITIAL_SETTINGS = [
    { key: 'store_name', value: 'RetailCore Store' },
    { key: 'store_name_ur', value: 'ریٹیل کور اسٹور' },
    { key: 'currency', value: 'PKR' },
    { key: 'currency_symbol', value: 'Rs.' },
    { key: 'tax_rate', value: '0' },
    { key: 'receipt_footer', value: 'Thank you for shopping with us!' },
    { key: 'receipt_footer_ur', value: 'خریداری کا شکریہ!' },
];

// Types for TypeScript
export interface User {
    id: number;
    name: string;
    email: string;
    password_hash: string;
    role: 'admin' | 'manager' | 'cashier';
    phone?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Supplier {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    name_ur?: string;
    description?: string;
    parent_id?: number;
    is_active: boolean;
    created_at: string;
}

export interface Product {
    id: number;
    name: string;
    name_ur?: string;
    sku?: string;
    barcode?: string;
    category_id?: number;
    supplier_id?: number;
    cost_price: number;
    selling_price: number;
    quantity: number;
    min_stock_level: number;
    wac_cost: number;
    unit: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    credit_limit: number;
    credit_balance: number;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Sale {
    id: number;
    invoice_number?: string;
    customer_id?: number;
    user_id: number;
    subtotal: number;
    discount_amount: number;
    discount_percent: number;
    tax_amount: number;
    total: number;
    payment_method: 'cash' | 'credit' | 'card' | 'mixed';
    payment_received: number;
    change_amount: number;
    status: 'pending' | 'completed' | 'refunded' | 'cancelled';
    notes?: string;
    created_at: string;
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    cost_price: number;
    discount_amount: number;
    total: number;
    created_at: string;
}

export interface LedgerEntry {
    id: number;
    customer_id: number;
    type: 'credit' | 'debit' | 'opening';
    amount: number;
    balance: number;
    reference_id?: number;
    reference_type?: string;
    description?: string;
    user_id: number;
    created_at: string;
}

export interface StockMovement {
    id: number;
    product_id: number;
    type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'damage';
    quantity: number;
    unit_cost?: number;
    reference_id?: number;
    reference_type?: string;
    notes?: string;
    user_id: number;
    created_at: string;
}

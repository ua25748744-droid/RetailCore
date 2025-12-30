-- ============================================================================
-- RetailCore POS System - Complete Database Schema and Transaction Logic
-- Database: SQLite (wa-sqlite WebAssembly)
-- Version: 1.0
-- Created: 2024-12-25
-- Description: Offline-first POS system with Khata (Udhaar) credit support
-- ============================================================================

-- Enable foreign key constraints (must be enabled per connection in wa-sqlite)
PRAGMA foreign_keys = ON;

-- ============================================================================
-- SECTION 1: DATABASE SCHEMA (DDL)
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 Users Table
-- Purpose: User authentication and role-based access control
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier' 
        CHECK (role IN ('admin', 'manager', 'cashier')),
    language_pref TEXT NOT NULL DEFAULT 'en' 
        CHECK (language_pref IN ('en', 'ur')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast username lookup during login
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);


-- -----------------------------------------------------------------------------
-- 1.2 Suppliers Table
-- Purpose: Track product suppliers and their account balances
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_info TEXT, -- JSON or structured text: phone, email, etc.
    address TEXT,
    balance REAL NOT NULL DEFAULT 0, -- Positive = we owe them, Negative = they owe us
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);


-- -----------------------------------------------------------------------------
-- 1.3 Customers Table
-- Purpose: Customer management with Khata (credit/udhaar) ledger balance
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    current_ledger_balance REAL NOT NULL DEFAULT 0, -- Positive = customer owes us
    credit_limit REAL NOT NULL DEFAULT 0, -- Maximum allowed credit
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);


-- -----------------------------------------------------------------------------
-- 1.4 Products Table
-- Purpose: Inventory management with Weighted Average Cost (WAC) tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE,
    name_en TEXT NOT NULL,
    name_ur TEXT, -- Urdu name for bilingual support
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    cost_price_wac REAL NOT NULL DEFAULT 0, -- Weighted Average Cost
    sell_price REAL NOT NULL DEFAULT 0,
    min_stock_level INTEGER NOT NULL DEFAULT 5, -- Reorder alert threshold
    category_id INTEGER,
    supplier_id INTEGER,
    unit TEXT NOT NULL DEFAULT 'piece',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name_en ON products(name_en);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);


-- -----------------------------------------------------------------------------
-- 1.5 Categories Table (Supporting table for product organization)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_ur TEXT,
    parent_id INTEGER,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);


-- -----------------------------------------------------------------------------
-- 1.6 Sales Table
-- Purpose: Header record for each sale transaction
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE, -- Auto-generated invoice number
    customer_id INTEGER, -- NULL for walk-in cash customers
    user_id INTEGER NOT NULL, -- Cashier who processed the sale
    total_amount REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0, -- Total discount applied
    tax_amount REAL NOT NULL DEFAULT 0,
    net_amount REAL NOT NULL DEFAULT 0, -- total_amount - discount + tax
    payment_mode TEXT NOT NULL DEFAULT 'cash' 
        CHECK (payment_mode IN ('cash', 'credit', 'card', 'mixed')),
    payment_received REAL NOT NULL DEFAULT 0,
    change_given REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
    notes TEXT,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_mode ON sales(payment_mode);


-- -----------------------------------------------------------------------------
-- 1.7 SaleItems Table
-- Purpose: Line items for each sale with cost snapshot for profit calculation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL, -- Selling price at time of sale
    cost_at_time_of_sale REAL NOT NULL, -- WAC cost snapshot for profit calc
    discount_amount REAL NOT NULL DEFAULT 0,
    line_total REAL NOT NULL, -- (quantity * unit_price) - discount_amount
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);


-- -----------------------------------------------------------------------------
-- 1.8 Ledgers Table
-- Purpose: Complete transaction history for customer and supplier accounts
-- Used for Khata (Udhaar/Credit) tracking
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ledgers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER, -- Either customer_id OR supplier_id should be set
    supplier_id INTEGER,
    transaction_type TEXT NOT NULL 
        CHECK (transaction_type IN ('DEBIT', 'CREDIT', 'OPENING_BALANCE', 'ADJUSTMENT')),
        -- DEBIT = Customer owes more (sale on credit) / We owe supplier more (purchase)
        -- CREDIT = Customer paid / Supplier payment made
    amount REAL NOT NULL,
    running_balance REAL NOT NULL, -- Balance after this transaction
    reference_type TEXT, -- 'sale', 'payment', 'purchase', 'refund', etc.
    reference_id INTEGER, -- ID of related sale/purchase
    description TEXT,
    user_id INTEGER, -- Who created this entry
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Ensure at least one of customer_id or supplier_id is set
    CHECK ((customer_id IS NOT NULL AND supplier_id IS NULL) OR 
           (customer_id IS NULL AND supplier_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_ledgers_customer ON ledgers(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledgers_supplier ON ledgers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_ledgers_date ON ledgers(date);
CREATE INDEX IF NOT EXISTS idx_ledgers_type ON ledgers(transaction_type);


-- -----------------------------------------------------------------------------
-- 1.9 Stock Movements Table
-- Purpose: Audit trail for all inventory changes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    movement_type TEXT NOT NULL 
        CHECK (movement_type IN ('STOCK_IN', 'SALE', 'RETURN', 'ADJUSTMENT', 'DAMAGE')),
    quantity INTEGER NOT NULL, -- Positive for in, negative for out
    unit_cost REAL, -- Cost per unit for STOCK_IN movements
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    previous_wac REAL,
    new_wac REAL,
    reference_type TEXT,
    reference_id INTEGER,
    notes TEXT,
    user_id INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);


-- ============================================================================
-- SECTION 2: BUSINESS LOGIC QUERIES (DML)
-- ============================================================================

-- =============================================================================
-- 2A. INVENTORY STOCK-IN WITH WEIGHTED AVERAGE COST (WAC) CALCULATION
-- =============================================================================
-- Formula: NewWAC = ((CurrentStock * CurrentWAC) + (NewQty * NewSupplyCost)) / (CurrentStock + NewQty)
--
-- This transaction:
-- 1. Updates the product's stock_quantity
-- 2. Calculates and updates the cost_price_wac using WAC formula
-- 3. Creates an audit record in stock_movements
-- =============================================================================

-- Parameters to replace:
--   :product_id     - The product being restocked
--   :new_quantity   - Quantity being added
--   :new_unit_cost  - Cost per unit for this supply
--   :supplier_id    - Supplier providing the stock (optional)
--   :user_id        - User performing the stock-in
--   :notes          - Optional notes for the transaction

BEGIN TRANSACTION;

-- Step 1: Get current product state for audit trail
-- (In code, you would first SELECT to get current_stock and current_wac)

-- Step 2: Update product with new stock and calculated WAC
UPDATE products
SET 
    stock_quantity = stock_quantity + :new_quantity,
    cost_price_wac = CASE 
        -- Avoid division by zero: if current stock is 0, just use new cost
        WHEN stock_quantity = 0 OR stock_quantity + :new_quantity = 0 
        THEN :new_unit_cost
        -- WAC Formula: ((OldStock * OldCost) + (NewQty * NewCost)) / TotalStock
        ELSE ROUND(
            ((stock_quantity * cost_price_wac) + (:new_quantity * :new_unit_cost)) 
            / (stock_quantity + :new_quantity),
            2
        )
    END,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :product_id;

-- Step 3: Record the stock movement for audit trail
INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    unit_cost,
    previous_stock,
    new_stock,
    previous_wac,
    new_wac,
    reference_type,
    reference_id,
    notes,
    user_id
)
SELECT 
    id,
    'STOCK_IN',
    :new_quantity,
    :new_unit_cost,
    stock_quantity - :new_quantity, -- previous stock (before update)
    stock_quantity, -- new stock (after update)
    -- Calculate previous WAC (reverse the calculation)
    CASE 
        WHEN (stock_quantity - :new_quantity) = 0 THEN 0
        ELSE ROUND(
            ((stock_quantity * cost_price_wac) - (:new_quantity * :new_unit_cost)) 
            / (stock_quantity - :new_quantity),
            2
        )
    END,
    cost_price_wac, -- new WAC (after update)
    'PURCHASE',
    :supplier_id,
    :notes,
    :user_id
FROM products
WHERE id = :product_id;

COMMIT;


-- =============================================================================
-- 2B. THE "KHATA" SALE - CREDIT TRANSACTION (Udhaar)
-- =============================================================================
-- This is the complete transaction for a credit sale that:
-- 1. Creates the sales header record
-- 2. Inserts all sale line items
-- 3. Decrements stock for all products sold
-- 4. Creates a DEBIT ledger entry (customer owes this amount)
-- 5. Updates customer's current_ledger_balance
--
-- This must be executed atomically - all succeed or all fail
-- =============================================================================

-- Parameters to replace:
--   :customer_id        - Customer making the credit purchase
--   :user_id            - Cashier processing the sale
--   :invoice_number     - Generated invoice number
--   :total_amount       - Subtotal before discount
--   :discount           - Discount amount
--   :net_amount         - Final amount (total - discount + tax)
--   :notes              - Optional sale notes
--
-- For each sale item (repeated for each product):
--   :product_id_N       - Product ID
--   :quantity_N         - Quantity sold
--   :unit_price_N       - Selling price per unit
--   :cost_at_sale_N     - WAC cost at time of sale
--   :line_discount_N    - Discount on this line
--   :line_total_N       - Line total after discount

BEGIN TRANSACTION;

-- Step 1: Insert the main sale record
INSERT INTO sales (
    invoice_number,
    customer_id,
    user_id,
    total_amount,
    discount,
    net_amount,
    payment_mode,
    payment_received,
    change_given,
    status,
    notes,
    timestamp
) VALUES (
    :invoice_number,
    :customer_id,
    :user_id,
    :total_amount,
    :discount,
    :net_amount,
    'credit',  -- This is a Khata/Udhaar sale
    0,         -- No payment received for credit sale
    0,         -- No change for credit sale
    'completed',
    :notes,
    CURRENT_TIMESTAMP
);

-- Step 2: Insert sale line items (repeat for each product in the cart)
-- Example for one item - in code, loop through all cart items
INSERT INTO sale_items (
    sale_id,
    product_id,
    quantity,
    unit_price,
    cost_at_time_of_sale,
    discount_amount,
    line_total
) VALUES (
    last_insert_rowid(), -- Gets the sale_id from Step 1
    -- OR use: (SELECT MAX(id) FROM sales WHERE customer_id = :customer_id)
    :product_id_1,
    :quantity_1,
    :unit_price_1,
    :cost_at_sale_1,
    :line_discount_1,
    :line_total_1
);

-- Step 3: Decrement stock for each product sold
-- (Repeat for each product - in code, loop through all items)
UPDATE products
SET 
    stock_quantity = stock_quantity - :quantity_1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :product_id_1;

-- Record stock movement for audit
INSERT INTO stock_movements (
    product_id,
    movement_type,
    quantity,
    previous_stock,
    new_stock,
    reference_type,
    reference_id,
    user_id
)
SELECT 
    :product_id_1,
    'SALE',
    -:quantity_1,
    stock_quantity + :quantity_1, -- previous stock
    stock_quantity, -- new stock after decrement
    'SALE',
    (SELECT MAX(id) FROM sales), -- sale_id reference
    :user_id
FROM products
WHERE id = :product_id_1;

-- Step 4: Create DEBIT ledger entry (customer now owes this amount)
INSERT INTO ledgers (
    customer_id,
    supplier_id,
    transaction_type,
    amount,
    running_balance,
    reference_type,
    reference_id,
    description,
    user_id,
    date
)
SELECT 
    :customer_id,
    NULL, -- Not a supplier transaction
    'DEBIT', -- Customer OWES us (Udhaar)
    :net_amount,
    c.current_ledger_balance + :net_amount, -- New running balance
    'sale',
    (SELECT MAX(id) FROM sales),
    'Credit Sale - Invoice #' || :invoice_number,
    :user_id,
    CURRENT_TIMESTAMP
FROM customers c
WHERE c.id = :customer_id;

-- Step 5: Update customer's current ledger balance
UPDATE customers
SET 
    current_ledger_balance = current_ledger_balance + :net_amount,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :customer_id;

COMMIT;


-- =============================================================================
-- 2B (ALTERNATE): KHATA PAYMENT RECEIVED - When customer pays their credit
-- =============================================================================
-- When a customer makes a payment on their Khata (credit balance)

-- Parameters:
--   :customer_id    - Customer making the payment
--   :payment_amount - Amount being paid
--   :user_id        - User receiving the payment
--   :payment_mode   - 'cash' or 'card'
--   :description    - Payment description/reference

BEGIN TRANSACTION;

-- Create CREDIT ledger entry (customer paid, reducing their debt)
INSERT INTO ledgers (
    customer_id,
    supplier_id,
    transaction_type,
    amount,
    running_balance,
    reference_type,
    reference_id,
    description,
    user_id,
    date
)
SELECT 
    :customer_id,
    NULL,
    'CREDIT', -- Customer PAID us (reduces their Udhaar)
    :payment_amount,
    c.current_ledger_balance - :payment_amount,
    'payment',
    NULL,
    :description,
    :user_id,
    CURRENT_TIMESTAMP
FROM customers c
WHERE c.id = :customer_id;

-- Update customer balance
UPDATE customers
SET 
    current_ledger_balance = current_ledger_balance - :payment_amount,
    updated_at = CURRENT_TIMESTAMP
WHERE id = :customer_id;

COMMIT;


-- =============================================================================
-- 2C. REPORTING: NET PROFIT FOR DATE RANGE
-- =============================================================================
-- Highly optimized query to calculate net profit
-- Logic: SUM(quantity * (unit_price - cost_at_time_of_sale)) - discounts
--
-- Parameters:
--   :start_date - Beginning of date range (inclusive)
--   :end_date   - End of date range (inclusive)
-- =============================================================================

-- Option 1: Simple Net Profit (Most Used)
SELECT 
    SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) AS gross_profit,
    SUM(si.discount_amount) AS total_line_discounts,
    SUM(s.discount) AS total_sale_discounts,
    SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) 
        - COALESCE(SUM(DISTINCT s.discount), 0) AS net_profit
FROM sale_items si
INNER JOIN sales s ON si.sale_id = s.id
WHERE s.timestamp >= :start_date 
  AND s.timestamp < :end_date
  AND s.status = 'completed';


-- Option 2: Detailed Profit Report with Daily Breakdown
SELECT 
    DATE(s.timestamp) AS sale_date,
    COUNT(DISTINCT s.id) AS num_transactions,
    SUM(si.quantity) AS total_items_sold,
    SUM(si.line_total) AS total_revenue,
    SUM(si.quantity * si.cost_at_time_of_sale) AS total_cost,
    SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) AS gross_profit,
    SUM(si.discount_amount) + SUM(DISTINCT s.discount) AS total_discounts,
    SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) 
        - SUM(DISTINCT s.discount) AS net_profit,
    ROUND(
        ((SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) - SUM(DISTINCT s.discount)) 
        / NULLIF(SUM(si.line_total), 0)) * 100,
        2
    ) AS profit_margin_percent
FROM sale_items si
INNER JOIN sales s ON si.sale_id = s.id
WHERE s.timestamp >= :start_date 
  AND s.timestamp < :end_date
  AND s.status = 'completed'
GROUP BY DATE(s.timestamp)
ORDER BY sale_date DESC;


-- Option 3: Profit by Product Category
SELECT 
    COALESCE(c.name, 'Uncategorized') AS category,
    SUM(si.quantity) AS total_sold,
    SUM(si.line_total) AS total_revenue,
    SUM(si.quantity * si.cost_at_time_of_sale) AS total_cost,
    SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) AS gross_profit,
    ROUND(
        (SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) 
        / NULLIF(SUM(si.line_total), 0)) * 100,
        2
    ) AS profit_margin_percent
FROM sale_items si
INNER JOIN sales s ON si.sale_id = s.id
INNER JOIN products p ON si.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE s.timestamp >= :start_date 
  AND s.timestamp < :end_date
  AND s.status = 'completed'
GROUP BY c.id, c.name
ORDER BY gross_profit DESC;


-- Option 4: Top Profitable Products
SELECT 
    p.id AS product_id,
    p.barcode,
    p.name_en,
    p.name_ur,
    SUM(si.quantity) AS total_sold,
    SUM(si.line_total) AS total_revenue,
    SUM(si.quantity * si.cost_at_time_of_sale) AS total_cost,
    SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) AS gross_profit,
    ROUND(
        (SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) 
        / NULLIF(SUM(si.line_total), 0)) * 100,
        2
    ) AS profit_margin_percent
FROM sale_items si
INNER JOIN sales s ON si.sale_id = s.id
INNER JOIN products p ON si.product_id = p.id
WHERE s.timestamp >= :start_date 
  AND s.timestamp < :end_date
  AND s.status = 'completed'
GROUP BY p.id
ORDER BY gross_profit DESC
LIMIT 20;


-- =============================================================================
-- ADDITIONAL USEFUL QUERIES
-- =============================================================================

-- Customer Khata (Ledger) Statement
SELECT 
    l.date,
    l.transaction_type,
    l.description,
    CASE WHEN l.transaction_type = 'DEBIT' THEN l.amount ELSE NULL END AS debit,
    CASE WHEN l.transaction_type = 'CREDIT' THEN l.amount ELSE NULL END AS credit,
    l.running_balance
FROM ledgers l
WHERE l.customer_id = :customer_id
ORDER BY l.date DESC, l.id DESC;


-- Low Stock Alert
SELECT 
    id, barcode, name_en, name_ur, 
    stock_quantity, min_stock_level,
    (min_stock_level - stock_quantity) AS units_below_minimum
FROM products
WHERE stock_quantity <= min_stock_level
  AND is_active = 1
ORDER BY (min_stock_level - stock_quantity) DESC;


-- Daily Sales Summary
SELECT 
    DATE(timestamp) AS sale_date,
    COUNT(*) AS num_sales,
    SUM(CASE WHEN payment_mode = 'cash' THEN net_amount ELSE 0 END) AS cash_sales,
    SUM(CASE WHEN payment_mode = 'credit' THEN net_amount ELSE 0 END) AS credit_sales,
    SUM(CASE WHEN payment_mode = 'card' THEN net_amount ELSE 0 END) AS card_sales,
    SUM(net_amount) AS total_sales,
    SUM(discount) AS total_discounts
FROM sales
WHERE status = 'completed'
  AND timestamp >= :start_date
  AND timestamp < :end_date
GROUP BY DATE(timestamp)
ORDER BY sale_date DESC;


-- Outstanding Customer Balances (All customers who owe money)
SELECT 
    id, name, phone, 
    current_ledger_balance AS amount_owed,
    credit_limit,
    (credit_limit - current_ledger_balance) AS remaining_credit
FROM customers
WHERE current_ledger_balance > 0
  AND is_active = 1
ORDER BY current_ledger_balance DESC;

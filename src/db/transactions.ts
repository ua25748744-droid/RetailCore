/**
 * RetailCore Transaction Logic
 * ===========================
 * Business logic SQL transactions for wa-sqlite (WebAssembly SQLite)
 * Implements: WAC Inventory, Khata Sales, and Profit Reporting
 */

// Type definitions for transaction parameters
export interface StockInParams {
  productId: number;
  newQuantity: number;
  newUnitCost: number;
  supplierId?: number;
  userId: number;
  notes?: string;
}

export interface SaleItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
  costAtSale: number;
  discountAmount: number;
  lineTotal: number;
}

export interface KhataSaleParams {
  customerId: number;
  userId: number;
  invoiceNumber: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
  items: SaleItemInput[];
  notes?: string;
}

export interface KhataPaymentParams {
  customerId: number;
  paymentAmount: number;
  userId: number;
  paymentMode: 'cash' | 'card';
  description?: string;
}

export interface DateRangeParams {
  startDate: string; // ISO format: YYYY-MM-DD HH:MM:SS
  endDate: string;
}

export interface ProfitResult {
  grossProfit: number;
  totalLineDiscounts: number;
  totalSaleDiscounts: number;
  netProfit: number;
}

export interface DailyProfitResult {
  saleDate: string;
  numTransactions: number;
  totalItemsSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  totalDiscounts: number;
  netProfit: number;
  profitMarginPercent: number;
}

// =============================================================================
// SQL QUERY TEMPLATES
// =============================================================================

/**
 * 2A: Inventory Stock-In with Weighted Average Cost (WAC) Calculation
 * 
 * Formula: NewWAC = ((CurrentStock * CurrentWAC) + (NewQty * NewCost)) / TotalStock
 * 
 * Returns array of SQL statements to execute in transaction
 */
export function getStockInQueries(params: StockInParams): string[] {
  const { productId, newQuantity, newUnitCost, supplierId, userId, notes } = params;

  return [
    // Step 1: Update product with new stock and calculated WAC
    `UPDATE products
     SET 
       stock_quantity = stock_quantity + ${newQuantity},
       cost_price_wac = CASE 
         WHEN stock_quantity = 0 OR stock_quantity + ${newQuantity} = 0 
         THEN ${newUnitCost}
         ELSE ROUND(
           ((stock_quantity * cost_price_wac) + (${newQuantity} * ${newUnitCost})) 
           / (stock_quantity + ${newQuantity}),
           2
         )
       END,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ${productId}`,

    // Step 2: Record stock movement audit trail
    `INSERT INTO stock_movements (
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
       ${newQuantity},
       ${newUnitCost},
       stock_quantity - ${newQuantity},
       stock_quantity,
       CASE 
         WHEN (stock_quantity - ${newQuantity}) = 0 THEN 0
         ELSE ROUND(
           ((stock_quantity * cost_price_wac) - (${newQuantity} * ${newUnitCost})) 
           / (stock_quantity - ${newQuantity}),
           2
         )
       END,
       cost_price_wac,
       'PURCHASE',
       ${supplierId || 'NULL'},
       ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
       ${userId}
     FROM products
     WHERE id = ${productId}`
  ];
}

/**
 * 2B: Khata (Credit/Udhaar) Sale Transaction
 * 
 * Complete atomic transaction that:
 * 1. Inserts sale record
 * 2. Inserts all sale items
 * 3. Decrements stock for each product
 * 4. Creates DEBIT ledger entry
 * 5. Updates customer's current_ledger_balance
 * 
 * Returns array of SQL statements to execute in transaction
 */
export function getKhataSaleQueries(params: KhataSaleParams): string[] {
  const { customerId, userId, invoiceNumber, totalAmount, discount, netAmount, items, notes } = params;

  const queries: string[] = [];

  // Step 1: Insert main sale record
  queries.push(`
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
      '${invoiceNumber}',
      ${customerId},
      ${userId},
      ${totalAmount},
      ${discount},
      ${netAmount},
      'credit',
      0,
      0,
      'completed',
      ${notes ? `'${notes.replace(/'/g, "''")}'` : 'NULL'},
      CURRENT_TIMESTAMP
    )`);

  // Step 2 & 3: For each item - insert sale item and decrement stock
  items.forEach((item) => {
    // Insert sale item
    queries.push(`
      INSERT INTO sale_items (
        sale_id,
        product_id,
        quantity,
        unit_price,
        cost_at_time_of_sale,
        discount_amount,
        line_total
      ) VALUES (
        (SELECT MAX(id) FROM sales WHERE customer_id = ${customerId}),
        ${item.productId},
        ${item.quantity},
        ${item.unitPrice},
        ${item.costAtSale},
        ${item.discountAmount},
        ${item.lineTotal}
      )`);

    // Decrement product stock
    queries.push(`
      UPDATE products
      SET 
        stock_quantity = stock_quantity - ${item.quantity},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${item.productId}`);

    // Record stock movement
    queries.push(`
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
        ${item.productId},
        'SALE',
        -${item.quantity},
        stock_quantity + ${item.quantity},
        stock_quantity,
        'SALE',
        (SELECT MAX(id) FROM sales),
        ${userId}
      FROM products
      WHERE id = ${item.productId}`);
  });

  // Step 4: Create DEBIT ledger entry
  queries.push(`
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
      ${customerId},
      NULL,
      'DEBIT',
      ${netAmount},
      c.current_ledger_balance + ${netAmount},
      'sale',
      (SELECT MAX(id) FROM sales),
      'Credit Sale - Invoice #${invoiceNumber}',
      ${userId},
      CURRENT_TIMESTAMP
    FROM customers c
    WHERE c.id = ${customerId}`);

  // Step 5: Update customer's ledger balance
  queries.push(`
    UPDATE customers
    SET 
      current_ledger_balance = current_ledger_balance + ${netAmount},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${customerId}`);

  return queries;
}

/**
 * Khata Payment Received - When customer pays their credit balance
 */
export function getKhataPaymentQueries(params: KhataPaymentParams): string[] {
  const { customerId, paymentAmount, userId, description } = params;

  return [
    // Create CREDIT ledger entry
    `INSERT INTO ledgers (
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
      ${customerId},
      NULL,
      'CREDIT',
      ${paymentAmount},
      c.current_ledger_balance - ${paymentAmount},
      'payment',
      NULL,
      ${description ? `'${description.replace(/'/g, "''")}'` : "'Payment received'"},
      ${userId},
      CURRENT_TIMESTAMP
    FROM customers c
    WHERE c.id = ${customerId}`,

    // Update customer balance
    `UPDATE customers
     SET 
       current_ledger_balance = current_ledger_balance - ${paymentAmount},
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ${customerId}`
  ];
}

// =============================================================================
// REPORTING QUERIES
// =============================================================================

/**
 * 2C: Net Profit for Date Range
 * 
 * Highly optimized query for profit calculation
 * Logic: SUM(quantity * (unit_price - cost_at_time_of_sale)) - discounts
 */
export function getNetProfitQuery(params: DateRangeParams): string {
  return `
    SELECT 
      COALESCE(SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)), 0) AS grossProfit,
      COALESCE(SUM(si.discount_amount), 0) AS totalLineDiscounts,
      COALESCE(SUM(DISTINCT s.discount), 0) AS totalSaleDiscounts,
      COALESCE(SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)), 0)
        - COALESCE(SUM(DISTINCT s.discount), 0) AS netProfit
    FROM sale_items si
    INNER JOIN sales s ON si.sale_id = s.id
    WHERE s.timestamp >= '${params.startDate}' 
      AND s.timestamp < '${params.endDate}'
      AND s.status = 'completed'`;
}

/**
 * Daily Profit Breakdown Report
 */
export function getDailyProfitQuery(params: DateRangeParams): string {
  return `
    SELECT 
      DATE(s.timestamp) AS saleDate,
      COUNT(DISTINCT s.id) AS numTransactions,
      SUM(si.quantity) AS totalItemsSold,
      SUM(si.line_total) AS totalRevenue,
      SUM(si.quantity * si.cost_at_time_of_sale) AS totalCost,
      SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) AS grossProfit,
      SUM(si.discount_amount) + COALESCE(SUM(DISTINCT s.discount), 0) AS totalDiscounts,
      SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) 
        - COALESCE(SUM(DISTINCT s.discount), 0) AS netProfit,
      ROUND(
        ((SUM(si.quantity * (si.unit_price - si.cost_at_time_of_sale)) - COALESCE(SUM(DISTINCT s.discount), 0)) 
        / NULLIF(SUM(si.line_total), 0)) * 100,
        2
      ) AS profitMarginPercent
    FROM sale_items si
    INNER JOIN sales s ON si.sale_id = s.id
    WHERE s.timestamp >= '${params.startDate}' 
      AND s.timestamp < '${params.endDate}'
      AND s.status = 'completed'
    GROUP BY DATE(s.timestamp)
    ORDER BY saleDate DESC`;
}

/**
 * Customer Khata (Ledger) Statement
 */
export function getCustomerLedgerQuery(customerId: number): string {
  return `
    SELECT 
      l.id,
      l.date,
      l.transaction_type AS type,
      l.description,
      CASE WHEN l.transaction_type = 'DEBIT' THEN l.amount ELSE NULL END AS debit,
      CASE WHEN l.transaction_type = 'CREDIT' THEN l.amount ELSE NULL END AS credit,
      l.running_balance AS balance
    FROM ledgers l
    WHERE l.customer_id = ${customerId}
    ORDER BY l.date DESC, l.id DESC`;
}

/**
 * Low Stock Alert Query
 */
export function getLowStockQuery(): string {
  return `
    SELECT 
      id, barcode, name_en, name_ur, 
      stock_quantity, min_stock_level,
      (min_stock_level - stock_quantity) AS unitsBelowMinimum
    FROM products
    WHERE stock_quantity <= min_stock_level
      AND is_active = 1
    ORDER BY (min_stock_level - stock_quantity) DESC`;
}

/**
 * Outstanding Customer Balances
 */
export function getOutstandingBalancesQuery(): string {
  return `
    SELECT 
      id, name, phone, 
      current_ledger_balance AS amountOwed,
      credit_limit,
      (credit_limit - current_ledger_balance) AS remainingCredit
    FROM customers
    WHERE current_ledger_balance > 0
      AND is_active = 1
    ORDER BY current_ledger_balance DESC`;
}

/**
 * Daily Sales Summary
 */
export function getDailySalesSummaryQuery(params: DateRangeParams): string {
  return `
    SELECT 
      DATE(timestamp) AS saleDate,
      COUNT(*) AS numSales,
      SUM(CASE WHEN payment_mode = 'cash' THEN net_amount ELSE 0 END) AS cashSales,
      SUM(CASE WHEN payment_mode = 'credit' THEN net_amount ELSE 0 END) AS creditSales,
      SUM(CASE WHEN payment_mode = 'card' THEN net_amount ELSE 0 END) AS cardSales,
      SUM(net_amount) AS totalSales,
      SUM(discount) AS totalDiscounts
    FROM sales
    WHERE status = 'completed'
      AND timestamp >= '${params.startDate}'
      AND timestamp < '${params.endDate}'
    GROUP BY DATE(timestamp)
    ORDER BY saleDate DESC`;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate invoice number based on date and sequence
 * Format: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(sequence: number): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = String(sequence).padStart(4, '0');
  return `INV-${dateStr}-${seqStr}`;
}

/**
 * Execute transaction with proper BEGIN/COMMIT wrapping
 * For use with wa-sqlite executor
 */
export function wrapInTransaction(queries: string[]): string[] {
  return [
    'BEGIN TRANSACTION',
    ...queries,
    'COMMIT'
  ];
}

/**
 * Create parameterized query with safe value escaping
 * Helps prevent SQL injection for dynamic values
 */
export function escapeString(value: string): string {
  return value.replace(/'/g, "''");
}

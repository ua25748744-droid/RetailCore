/**
 * Sales Service
 * =============
 * Handles all sales-related transactions including Khata (credit) sales
 */

import type { Sale, SaleItem, Product, Customer, LedgerEntry } from '../schema';

// Types for cart and sales
export interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
    discount: number;
}

export interface SaleParams {
    customerId?: number; // Optional for cash sales
    userId: number;
    items: CartItem[];
    discount: number;
    paymentMode: 'cash' | 'credit' | 'card' | 'mixed';
    amountPaid: number;
    notes?: string;
}

export interface KhataSaleParams extends SaleParams {
    customerId: number; // Required for credit sales
    paymentMode: 'credit';
}

export interface SaleResult {
    success: boolean;
    sale: Sale;
    saleItems: SaleItem[];
    invoiceNumber: string;
    change: number;
    ledgerEntry?: LedgerEntry;
}

/**
 * Generate invoice number
 * Format: INV-YYYYMMDD-XXXX
 */
export function generateInvoiceNumber(sequence?: number): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const seqStr = (sequence || Math.floor(Math.random() * 10000)).toString().padStart(4, '0');
    return `INV-${dateStr}-${seqStr}`;
}

/**
 * Calculate sale totals
 */
export function calculateSaleTotals(items: CartItem[], discount: number = 0) {
    const subtotal = items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice) - item.discount,
        0
    );

    const netAmount = subtotal - discount;
    const totalCost = items.reduce(
        (sum, item) => sum + (item.quantity * item.product.wac_cost),
        0
    );
    const grossProfit = netAmount - totalCost;

    return {
        subtotal,
        discount,
        netAmount,
        totalCost,
        grossProfit,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
}

/**
 * Create a cash sale
 */
export function createCashSale(
    params: SaleParams,
    products: Product[]
): { sale: SaleResult; updatedProducts: Product[] } {
    const { items, discount, amountPaid, userId, notes, customerId } = params;

    const invoiceNumber = generateInvoiceNumber();
    const totals = calculateSaleTotals(items, discount);
    const change = Math.max(0, amountPaid - totals.netAmount);

    // Create sale record
    const sale: Sale = {
        id: Date.now(),
        invoice_number: invoiceNumber,
        customer_id: customerId,
        user_id: userId,
        subtotal: totals.subtotal,
        discount_amount: discount,
        discount_percent: discount > 0 ? (discount / totals.subtotal) * 100 : 0,
        tax_amount: 0,
        total: totals.netAmount,
        payment_method: 'cash',
        payment_received: amountPaid,
        change_amount: change,
        status: 'completed',
        notes,
        created_at: new Date().toISOString(),
    };

    // Create sale items
    const saleItems: SaleItem[] = items.map((item, index) => ({
        id: Date.now() + index,
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.product.wac_cost, // Capture WAC at time of sale
        discount_amount: item.discount,
        total: (item.quantity * item.unitPrice) - item.discount,
        created_at: new Date().toISOString(),
    }));

    // Update product quantities
    const updatedProducts = products.map(p => {
        const soldItem = items.find(item => item.product.id === p.id);
        if (!soldItem) return p;

        return {
            ...p,
            quantity: Math.max(0, p.quantity - soldItem.quantity),
            updated_at: new Date().toISOString(),
        };
    });

    return {
        sale: {
            success: true,
            sale,
            saleItems,
            invoiceNumber,
            change,
        },
        updatedProducts,
    };
}

/**
 * Create a Khata (credit) sale
 * This is the complete transaction that:
 * 1. Creates the sale record
 * 2. Creates sale items
 * 3. Updates product quantities
 * 4. Creates a DEBIT ledger entry
 * 5. Updates customer balance
 */
export function createKhataSale(
    params: KhataSaleParams,
    products: Product[],
    customers: Customer[],
    ledgerEntries: LedgerEntry[]
): {
    sale: SaleResult;
    updatedProducts: Product[];
    updatedCustomers: Customer[];
    newLedgerEntry: LedgerEntry;
} {
    const { customerId, items, discount, userId, notes } = params;

    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
    }

    const invoiceNumber = generateInvoiceNumber();
    const totals = calculateSaleTotals(items, discount);

    // Create sale record
    const sale: Sale = {
        id: Date.now(),
        invoice_number: invoiceNumber,
        customer_id: customerId,
        user_id: userId,
        subtotal: totals.subtotal,
        discount_amount: discount,
        discount_percent: discount > 0 ? (discount / totals.subtotal) * 100 : 0,
        tax_amount: 0,
        total: totals.netAmount,
        payment_method: 'credit',
        payment_received: 0, // Credit sale - no payment received
        change_amount: 0,
        status: 'completed',
        notes,
        created_at: new Date().toISOString(),
    };

    // Create sale items with cost snapshot
    const saleItems: SaleItem[] = items.map((item, index) => ({
        id: Date.now() + index,
        sale_id: sale.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        cost_price: item.product.wac_cost, // Capture WAC at time of sale
        discount_amount: item.discount,
        total: (item.quantity * item.unitPrice) - item.discount,
        created_at: new Date().toISOString(),
    }));

    // Update product quantities
    const updatedProducts = products.map(p => {
        const soldItem = items.find(item => item.product.id === p.id);
        if (!soldItem) return p;

        return {
            ...p,
            quantity: Math.max(0, p.quantity - soldItem.quantity),
            updated_at: new Date().toISOString(),
        };
    });

    // Create DEBIT ledger entry (customer now owes this amount)
    const newBalance = customer.credit_balance + totals.netAmount;
    const newLedgerEntry: LedgerEntry = {
        id: Math.max(...ledgerEntries.map(e => e.id), 0) + 1,
        customer_id: customerId,
        type: 'credit', // In the existing schema, 'credit' means customer owes (sale on credit)
        amount: totals.netAmount,
        balance: newBalance,
        reference_id: sale.id,
        reference_type: 'sale',
        description: `Credit Sale - Invoice #${invoiceNumber}`,
        user_id: userId,
        created_at: new Date().toISOString(),
    };

    // Update customer balance
    const updatedCustomers = customers.map(c => {
        if (c.id !== customerId) return c;
        return {
            ...c,
            credit_balance: newBalance,
            updated_at: new Date().toISOString(),
        };
    });

    return {
        sale: {
            success: true,
            sale,
            saleItems,
            invoiceNumber,
            change: 0,
            ledgerEntry: newLedgerEntry,
        },
        updatedProducts,
        updatedCustomers,
        newLedgerEntry,
    };
}

/**
 * Record a payment on customer's Khata
 */
export function recordKhataPayment(
    customerId: number,
    amount: number,
    userId: number,
    customers: Customer[],
    ledgerEntries: LedgerEntry[],
    description?: string
): {
    updatedCustomers: Customer[];
    newLedgerEntry: LedgerEntry;
} {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
    }

    const newBalance = customer.credit_balance - amount;

    // Create CREDIT ledger entry (customer paid, reducing debt)
    const newLedgerEntry: LedgerEntry = {
        id: Math.max(...ledgerEntries.map(e => e.id), 0) + 1,
        customer_id: customerId,
        type: 'debit', // In the existing schema, 'debit' means customer paid
        amount: amount,
        balance: newBalance,
        reference_type: 'payment',
        description: description || 'Payment received',
        user_id: userId,
        created_at: new Date().toISOString(),
    };

    // Update customer balance
    const updatedCustomers = customers.map(c => {
        if (c.id !== customerId) return c;
        return {
            ...c,
            credit_balance: newBalance,
            updated_at: new Date().toISOString(),
        };
    });

    return {
        updatedCustomers,
        newLedgerEntry,
    };
}

// SQL Query generators for wa-sqlite
export const SQL_QUERIES = {
    khataSale: (
        sale: Sale,
        items: SaleItem[],
        customerId: number,
        netAmount: number,
        invoiceNumber: string,
        userId: number
    ) => {
        const itemInserts = items.map(item => `
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, discount_amount, total)
      VALUES ((SELECT MAX(id) FROM sales), ${item.product_id}, ${item.quantity}, 
              ${item.unit_price}, ${item.cost_price}, ${item.discount_amount}, ${item.total});
      
      UPDATE products 
      SET quantity = quantity - ${item.quantity}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${item.product_id};
    `).join('\n');

        return `
      BEGIN TRANSACTION;
      
      INSERT INTO sales (invoice_number, customer_id, user_id, subtotal, discount_amount, 
                        total, payment_method, payment_received, status)
      VALUES ('${sale.invoice_number}', ${customerId}, ${userId}, ${sale.subtotal}, 
              ${sale.discount_amount}, ${sale.total}, 'credit', 0, 'completed');
      
      ${itemInserts}
      
      INSERT INTO ledgers (customer_id, type, amount, balance, reference_type, 
                          reference_id, description, user_id)
      SELECT ${customerId}, 'DEBIT', ${netAmount}, credit_balance + ${netAmount},
             'sale', (SELECT MAX(id) FROM sales), 
             'Credit Sale - Invoice #${invoiceNumber}', ${userId}
      FROM customers WHERE id = ${customerId};
      
      UPDATE customers 
      SET credit_balance = credit_balance + ${netAmount}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${customerId};
      
      COMMIT;
    `;
    },
};

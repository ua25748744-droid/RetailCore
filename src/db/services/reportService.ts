/**
 * Report Service
 * ==============
 * Handles all reporting and analytics queries
 * Provides profit calculations, sales summaries, and alerts
 */

import type { Product, Sale, SaleItem, Customer, LedgerEntry } from '../schema';

// Types for reports
export interface DateRange {
    startDate: Date;
    endDate: Date;
}

export interface ProfitReport {
    grossProfit: number;
    totalRevenue: number;
    totalCost: number;
    totalDiscounts: number;
    netProfit: number;
    profitMargin: number;
    transactionCount: number;
    itemsSold: number;
}

export interface DailyProfitEntry {
    date: string;
    revenue: number;
    cost: number;
    grossProfit: number;
    netProfit: number;
    transactionCount: number;
    profitMargin: number;
}

export interface ProductProfitEntry {
    productId: number;
    productName: string;
    productNameUr?: string;
    quantitySold: number;
    revenue: number;
    cost: number;
    profit: number;
    profitMargin: number;
}

export interface StockAlertItem {
    productId: number;
    barcode?: string;
    productName: string;
    productNameUr?: string;
    currentStock: number;
    minStockLevel: number;
    unitsBelowMinimum: number;
    status: 'out_of_stock' | 'critical' | 'low_stock';
}

export interface CustomerBalanceEntry {
    customerId: number;
    name: string;
    phone?: string;
    amountOwed: number;
    creditLimit: number;
    remainingCredit: number;
}

export interface SalesSummary {
    totalSales: number;
    cashSales: number;
    creditSales: number;
    cardSales: number;
    totalDiscounts: number;
    transactionCount: number;
}

/**
 * Calculate Net Profit for a date range
 * Logic: SUM(quantity * (unit_price - cost_at_time_of_sale)) - discounts
 */
export function calculateNetProfit(
    sales: Sale[],
    saleItems: SaleItem[],
    dateRange?: DateRange
): ProfitReport {
    // Filter sales by date range if provided
    let filteredSales = sales.filter(s => s.status === 'completed');

    if (dateRange) {
        filteredSales = filteredSales.filter(s => {
            const saleDate = new Date(s.created_at);
            return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
        });
    }

    const saleIds = new Set(filteredSales.map(s => s.id));
    const filteredItems = saleItems.filter(item => saleIds.has(item.sale_id));

    // Calculate totals
    let totalRevenue = 0;
    let totalCost = 0;
    let totalItemDiscounts = 0;
    let itemsSold = 0;

    filteredItems.forEach(item => {
        totalRevenue += item.quantity * item.unit_price;
        totalCost += item.quantity * item.cost_price;
        totalItemDiscounts += item.discount_amount;
        itemsSold += item.quantity;
    });

    const totalSaleDiscounts = filteredSales.reduce((sum, s) => sum + s.discount_amount, 0);
    const totalDiscounts = totalItemDiscounts + totalSaleDiscounts;
    const grossProfit = totalRevenue - totalCost - totalItemDiscounts;
    const netProfit = grossProfit - totalSaleDiscounts;
    const profitMargin = totalRevenue > 0
        ? Math.round((netProfit / totalRevenue) * 10000) / 100
        : 0;

    return {
        grossProfit,
        totalRevenue,
        totalCost,
        totalDiscounts,
        netProfit,
        profitMargin,
        transactionCount: filteredSales.length,
        itemsSold,
    };
}

/**
 * Get daily profit breakdown
 */
export function getDailyProfitBreakdown(
    sales: Sale[],
    saleItems: SaleItem[],
    dateRange?: DateRange
): DailyProfitEntry[] {
    // Filter sales
    let filteredSales = sales.filter(s => s.status === 'completed');

    if (dateRange) {
        filteredSales = filteredSales.filter(s => {
            const saleDate = new Date(s.created_at);
            return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
        });
    }

    // Group by date
    const dailyData: Map<string, DailyProfitEntry> = new Map();

    filteredSales.forEach(sale => {
        const dateKey = sale.created_at.slice(0, 10); // YYYY-MM-DD
        const saleItemsForSale = saleItems.filter(item => item.sale_id === sale.id);

        let existing = dailyData.get(dateKey);
        if (!existing) {
            existing = {
                date: dateKey,
                revenue: 0,
                cost: 0,
                grossProfit: 0,
                netProfit: 0,
                transactionCount: 0,
                profitMargin: 0,
            };
        }

        let revenue = 0;
        let cost = 0;
        saleItemsForSale.forEach(item => {
            revenue += item.quantity * item.unit_price - item.discount_amount;
            cost += item.quantity * item.cost_price;
        });

        existing.revenue += revenue;
        existing.cost += cost;
        existing.grossProfit += revenue - cost;
        existing.netProfit += revenue - cost - (sale.discount_amount || 0);
        existing.transactionCount += 1;

        dailyData.set(dateKey, existing);
    });

    // Calculate profit margins and sort by date
    return Array.from(dailyData.values())
        .map(entry => ({
            ...entry,
            profitMargin: entry.revenue > 0
                ? Math.round((entry.netProfit / entry.revenue) * 10000) / 100
                : 0,
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Get profit by product
 */
export function getProductProfitReport(
    products: Product[],
    saleItems: SaleItem[],
    _dateRange?: DateRange,
    limit: number = 20
): ProductProfitEntry[] {
    const productStats: Map<number, ProductProfitEntry> = new Map();

    saleItems.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (!product) return;

        let existing = productStats.get(item.product_id);
        if (!existing) {
            existing = {
                productId: product.id,
                productName: product.name,
                productNameUr: product.name_ur,
                quantitySold: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                profitMargin: 0,
            };
        }

        const revenue = item.quantity * item.unit_price - item.discount_amount;
        const cost = item.quantity * item.cost_price;

        existing.quantitySold += item.quantity;
        existing.revenue += revenue;
        existing.cost += cost;
        existing.profit += revenue - cost;

        productStats.set(item.product_id, existing);
    });

    return Array.from(productStats.values())
        .map(entry => ({
            ...entry,
            profitMargin: entry.revenue > 0
                ? Math.round((entry.profit / entry.revenue) * 10000) / 100
                : 0,
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, limit);
}

/**
 * Get low stock alerts
 */
export function getLowStockAlerts(products: Product[]): StockAlertItem[] {
    return products
        .filter(p => p.is_active && p.quantity <= p.min_stock_level)
        .map(p => ({
            productId: p.id,
            barcode: p.barcode,
            productName: p.name,
            productNameUr: p.name_ur,
            currentStock: p.quantity,
            minStockLevel: p.min_stock_level,
            unitsBelowMinimum: p.min_stock_level - p.quantity,
            status: (p.quantity === 0
                ? 'out_of_stock'
                : p.quantity <= p.min_stock_level / 2
                    ? 'critical'
                    : 'low_stock') as StockAlertItem['status'],
        }))
        .sort((a, b) => a.currentStock - b.currentStock);
}

/**
 * Get outstanding customer balances
 */
export function getOutstandingBalances(customers: Customer[]): CustomerBalanceEntry[] {
    return customers
        .filter(c => c.is_active && c.credit_balance > 0)
        .map(c => ({
            customerId: c.id,
            name: c.name,
            phone: c.phone,
            amountOwed: c.credit_balance,
            creditLimit: c.credit_limit,
            remainingCredit: c.credit_limit - c.credit_balance,
        }))
        .sort((a, b) => b.amountOwed - a.amountOwed);
}

/**
 * Get customer ledger statement
 */
export function getCustomerLedgerStatement(
    customerId: number,
    ledgerEntries: LedgerEntry[]
): LedgerEntry[] {
    return ledgerEntries
        .filter(e => e.customer_id === customerId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Get daily sales summary
 */
export function getDailySalesSummary(
    sales: Sale[],
    dateRange?: DateRange
): SalesSummary {
    let filteredSales = sales.filter(s => s.status === 'completed');

    if (dateRange) {
        filteredSales = filteredSales.filter(s => {
            const saleDate = new Date(s.created_at);
            return saleDate >= dateRange.startDate && saleDate <= dateRange.endDate;
        });
    }

    return {
        totalSales: filteredSales.reduce((sum, s) => sum + s.total, 0),
        cashSales: filteredSales
            .filter(s => s.payment_method === 'cash')
            .reduce((sum, s) => sum + s.total, 0),
        creditSales: filteredSales
            .filter(s => s.payment_method === 'credit')
            .reduce((sum, s) => sum + s.total, 0),
        cardSales: filteredSales
            .filter(s => s.payment_method === 'card')
            .reduce((sum, s) => sum + s.total, 0),
        totalDiscounts: filteredSales.reduce((sum, s) => sum + s.discount_amount, 0),
        transactionCount: filteredSales.length,
    };
}

// SQL Query generators for wa-sqlite
export const SQL_QUERIES = {
    netProfit: (startDate: string, endDate: string) => `
    SELECT 
      COALESCE(SUM(si.quantity * (si.unit_price - si.cost_price)), 0) AS grossProfit,
      COALESCE(SUM(si.quantity * si.unit_price), 0) AS totalRevenue,
      COALESCE(SUM(si.quantity * si.cost_price), 0) AS totalCost,
      COALESCE(SUM(si.discount_amount), 0) AS itemDiscounts,
      COALESCE(SUM(DISTINCT s.discount_amount), 0) AS saleDiscounts,
      COUNT(DISTINCT s.id) AS transactionCount,
      SUM(si.quantity) AS itemsSold
    FROM sale_items si
    INNER JOIN sales s ON si.sale_id = s.id
    WHERE s.created_at >= '${startDate}' 
      AND s.created_at < '${endDate}'
      AND s.status = 'completed';
  `,

    dailyBreakdown: (startDate: string, endDate: string) => `
    SELECT 
      DATE(s.created_at) AS date,
      SUM(si.total) AS revenue,
      SUM(si.quantity * si.cost_price) AS cost,
      SUM(si.total - (si.quantity * si.cost_price)) AS grossProfit,
      COUNT(DISTINCT s.id) AS transactionCount
    FROM sale_items si
    INNER JOIN sales s ON si.sale_id = s.id
    WHERE s.created_at >= '${startDate}' 
      AND s.created_at < '${endDate}'
      AND s.status = 'completed'
    GROUP BY DATE(s.created_at)
    ORDER BY date DESC;
  `,

    lowStockAlerts: `
    SELECT 
      id, barcode, name, name_ur, 
      quantity, min_stock_level,
      (min_stock_level - quantity) AS unitsBelowMinimum
    FROM products
    WHERE is_active = 1 
      AND quantity <= min_stock_level
    ORDER BY quantity ASC;
  `,

    outstandingBalances: `
    SELECT 
      id, name, phone, 
      credit_balance AS amountOwed,
      credit_limit,
      (credit_limit - credit_balance) AS remainingCredit
    FROM customers
    WHERE credit_balance > 0 AND is_active = 1
    ORDER BY credit_balance DESC;
  `,
};

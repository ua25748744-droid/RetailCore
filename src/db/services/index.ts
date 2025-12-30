/**
 * Database Services
 * =================
 * Export all service modules for easy importing
 */

// Inventory Service
export {
    performStockIn,
    reduceStock,
    calculateNewWAC,
    getLowStockProducts,
    calculateInventoryValue,
    SQL_QUERIES as INVENTORY_SQL,
} from './inventoryService';
export type {
    StockInParams,
    StockInResult,
} from './inventoryService';

// Sales Service
export {
    createCashSale,
    createKhataSale,
    recordKhataPayment,
    generateInvoiceNumber,
    calculateSaleTotals,
    SQL_QUERIES as SALES_SQL,
} from './salesService';
export type {
    CartItem,
    SaleParams,
    KhataSaleParams,
    SaleResult,
} from './salesService';

// Report Service
export {
    calculateNetProfit,
    getDailyProfitBreakdown,
    getProductProfitReport,
    getLowStockAlerts,
    getOutstandingBalances,
    getCustomerLedgerStatement,
    getDailySalesSummary,
    SQL_QUERIES as REPORT_SQL,
} from './reportService';
export type {
    DateRange,
    ProfitReport,
    DailyProfitEntry,
    ProductProfitEntry,
    StockAlertItem,
    CustomerBalanceEntry,
    SalesSummary,
} from './reportService';

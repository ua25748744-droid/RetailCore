import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useInventory } from './InventoryContext';
import { useLedger } from './LedgerContext';

// Report types
export interface SalesSummary {
    totalSales: number;
    totalCost: number;
    grossProfit: number;
    netProfit: number;
    itemsSold: number;
    transactionCount: number;
}

export interface StockAlert {
    productId: number;
    productName: string;
    productNameUr?: string;
    currentStock: number;
    minStock: number;
    status: 'out_of_stock' | 'low_stock' | 'critical';
}

export interface ReportData {
    salesSummary: SalesSummary;
    stockAlerts: StockAlert[];
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryValue: number;
    totalReceivables: number;
}

interface ReportsContextType {
    reportData: ReportData;
    getLocalizedMonth: (monthIndex: number, isUrdu: boolean) => string;
    formatCurrency: (amount: number) => string;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

// Month names in both languages
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_UR = ['جنوری', 'فروری', 'مارچ', 'اپریل', 'مئی', 'جون',
    'جولائی', 'اگست', 'ستمبر', 'اکتوبر', 'نومبر', 'دسمبر'];

export const ReportsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { products } = useInventory();
    const { totalReceivables } = useLedger();

    // Calculate report data
    const reportData = useMemo((): ReportData => {
        // Demo sales data (in production, this would come from sales table)
        const demoSalesData: SalesSummary = {
            totalSales: 125000,
            totalCost: 87500,
            grossProfit: 37500,
            netProfit: 32000, // After expenses
            itemsSold: 245,
            transactionCount: 48,
        };

        // Calculate stock alerts
        const stockAlerts: StockAlert[] = products
            .filter(p => p.is_active && p.quantity <= p.min_stock_level)
            .map(p => ({
                productId: p.id,
                productName: p.name,
                productNameUr: p.name_ur,
                currentStock: p.quantity,
                minStock: p.min_stock_level,
                status: (p.quantity === 0
                    ? 'out_of_stock'
                    : p.quantity <= p.min_stock_level / 2
                        ? 'critical'
                        : 'low_stock') as StockAlert['status'],
            }))
            .sort((a, b) => a.currentStock - b.currentStock);

        const lowStockCount = stockAlerts.filter(a => a.status !== 'out_of_stock').length;
        const outOfStockCount = stockAlerts.filter(a => a.status === 'out_of_stock').length;

        // Calculate inventory value
        const totalInventoryValue = products
            .filter(p => p.is_active)
            .reduce((sum, p) => sum + (p.quantity * p.wac_cost), 0);

        return {
            salesSummary: demoSalesData,
            stockAlerts,
            lowStockCount,
            outOfStockCount,
            totalInventoryValue,
            totalReceivables,
        };
    }, [products, totalReceivables]);

    // Get localized month name
    const getLocalizedMonth = (monthIndex: number, isUrdu: boolean): string => {
        return isUrdu ? MONTHS_UR[monthIndex] : MONTHS_EN[monthIndex];
    };

    // Format currency
    const formatCurrency = (amount: number): string => {
        return `Rs. ${amount.toLocaleString()}`;
    };

    const value = useMemo(() => ({
        reportData,
        getLocalizedMonth,
        formatCurrency,
    }), [reportData]);

    return (
        <ReportsContext.Provider value={value}>
            {children}
        </ReportsContext.Provider>
    );
};

export const useReports = (): ReportsContextType => {
    const context = useContext(ReportsContext);
    if (!context) {
        throw new Error('useReports must be used within a ReportsProvider');
    }
    return context;
};

export default ReportsContext;

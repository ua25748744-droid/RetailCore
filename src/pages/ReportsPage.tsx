import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useInventory } from '../contexts/InventoryContext';
import { pdfExport } from '../services/pdfExport';
import { FileDown, Calendar } from 'lucide-react';
import {
    OverviewStats,
    SalesSummaryCard,
    StockAlertsCard,
    MonthlyChart
} from '../components/reports';

export const ReportsPage: React.FC = () => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { products } = useInventory();

    // Date range state
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [startDate, setStartDate] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);

    // Format selected date range for display
    const formatDateRange = () => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const formatter = new Intl.DateTimeFormat(isRTL ? 'ur-PK' : 'en-US', {
            month: 'short',
            day: 'numeric',
        });
        return `${formatter.format(start)} - ${formatter.format(end)}`;
    };

    // Export handlers
    const handleExportSales = () => {
        pdfExport.salesReport({
            dateRange: formatDateRange(),
            totalSales: 125000,
            totalTransactions: 45,
            averageOrderValue: 2778,
            topProducts: [
                { name: 'Basmati Rice 5kg', quantity: 25, revenue: 35000 },
                { name: 'Cooking Oil 5L', quantity: 18, revenue: 28000 },
                { name: 'Sugar 1kg', quantity: 50, revenue: 12500 },
            ],
        });
    };

    const handleExportInventory = () => {
        const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.selling_price), 0);
        const lowStockCount = products.filter(p => p.quantity <= p.min_stock_level).length;

        pdfExport.inventoryReport({
            products,
            totalValue,
            lowStockCount,
        });
    };

    const handleExportLowStock = () => {
        pdfExport.lowStockReport(products);
    };

    return (
        <div className="min-h-screen py-8 px-6 pb-24 md:pb-8" style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-brand-primary))' }}>
                            {t('navigation.reports')}
                        </h1>
                        <p className="mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            {isRTL ? 'کاروباری بصیرت اور تجزیات' : 'Business insights and analytics'}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Range Picker */}
                        <div className="card py-2 px-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted" />
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    max={endDate}
                                    className="bg-transparent border-none text-sm text-foreground focus:outline-none cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                />
                                <span className="text-muted">→</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate}
                                    max={today.toISOString().split('T')[0]}
                                    className="bg-transparent border-none text-sm text-foreground focus:outline-none cursor-pointer"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>
                        </div>
                        <button onClick={handleExportSales} className="btn-primary flex items-center gap-2">
                            <FileDown className="w-4 h-4" />
                            {t('reports.export_pdf')}
                        </button>
                    </div>
                </div>

                {/* Overview Stats */}
                <OverviewStats />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Summary */}
                    <SalesSummaryCard />

                    {/* Stock Alerts */}
                    <StockAlertsCard />
                </div>

                {/* Monthly Chart */}
                <MonthlyChart />

                {/* Quick Actions - Export Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={handleExportSales} className="card hover:border-primary-500/50 transition-all group text-start">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgb(var(--color-brand-primary) / 0.15)' }}>
                                <svg className="w-6 h-6" style={{ color: 'rgb(var(--color-brand-primary))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">{t('reports.sales_report')}</h4>
                                <p className="text-sm text-muted">{isRTL ? 'تفصیلی فروخت رپورٹ' : 'Download sales PDF'}</p>
                            </div>
                        </div>
                    </button>

                    <button onClick={handleExportInventory} className="card hover:border-accent-500/50 transition-all group text-start">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgb(var(--color-brand-accent) / 0.15)' }}>
                                <svg className="w-6 h-6" style={{ color: 'rgb(var(--color-brand-accent))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">{t('reports.stock_report')}</h4>
                                <p className="text-sm text-muted">{isRTL ? 'اسٹاک کی مکمل رپورٹ' : 'Download inventory PDF'}</p>
                            </div>
                        </div>
                    </button>

                    <button onClick={handleExportLowStock} className="card hover:border-amber-500/50 transition-all group text-start">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgb(var(--color-warning) / 0.15)' }}>
                                <svg className="w-6 h-6" style={{ color: 'rgb(var(--color-warning))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-medium text-foreground">{isRTL ? 'کم اسٹاک رپورٹ' : 'Low Stock Report'}</h4>
                                <p className="text-sm text-muted">{isRTL ? 'کم اسٹاک الرٹس' : 'Download alerts PDF'}</p>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;


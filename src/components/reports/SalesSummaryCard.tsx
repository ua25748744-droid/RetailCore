import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReports } from '../../contexts/ReportsContext';

export const SalesSummaryCard: React.FC = () => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { reportData, formatCurrency } = useReports();
    const { salesSummary } = reportData;

    const profitMargin = salesSummary.totalSales > 0
        ? ((salesSummary.grossProfit / salesSummary.totalSales) * 100).toFixed(1)
        : '0';

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    {isRTL ? 'فروخت کا خلاصہ' : 'Sales Summary'}
                </h3>
                <span className="text-xs text-slate-500">
                    {isRTL ? 'اس ماہ' : 'This Month'}
                </span>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-xl p-4 border border-primary-500/20">
                    <p className="text-xs text-slate-400 mb-1">{t('reports.daily_sales')}</p>
                    <p className="text-2xl font-bold text-white">{formatCurrency(salesSummary.totalSales)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-4 border border-green-500/20">
                    <p className="text-xs text-slate-400 mb-1">{t('reports.net_profit')}</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(salesSummary.netProfit)}</p>
                </div>
            </div>

            {/* Detailed Stats */}
            <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                    <span className="text-sm text-slate-400">{t('reports.gross_profit')}</span>
                    <span className="font-medium text-white">{formatCurrency(salesSummary.grossProfit)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                    <span className="text-sm text-slate-400">{isRTL ? 'لاگت' : 'Total Cost'}</span>
                    <span className="font-medium text-slate-300">{formatCurrency(salesSummary.totalCost)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                    <span className="text-sm text-slate-400">{isRTL ? 'فروخت شدہ اشیاء' : 'Items Sold'}</span>
                    <span className="font-medium text-white">{salesSummary.itemsSold}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                    <span className="text-sm text-slate-400">{isRTL ? 'ٹرانزیکشنز' : 'Transactions'}</span>
                    <span className="font-medium text-white">{salesSummary.transactionCount}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-400">{isRTL ? 'منافع مارجن' : 'Profit Margin'}</span>
                    <span className="font-medium text-accent-400">{profitMargin}%</span>
                </div>
            </div>
        </div>
    );
};

export default SalesSummaryCard;

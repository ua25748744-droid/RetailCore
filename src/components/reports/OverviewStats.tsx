import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReports } from '../../contexts/ReportsContext';

export const OverviewStats: React.FC = () => {
    const { isRTL } = useLanguage();
    const { reportData, formatCurrency } = useReports();
    const { totalInventoryValue, totalReceivables, salesSummary } = reportData;

    const stats = [
        {
            label: isRTL ? 'اسٹاک کی قیمت' : 'Inventory Value',
            value: formatCurrency(totalInventoryValue),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            color: 'primary',
        },
        {
            label: isRTL ? 'وصول طلب رقم' : 'Total Receivables',
            value: formatCurrency(totalReceivables),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'amber',
        },
        {
            label: isRTL ? 'ماہانہ آمدنی' : 'Monthly Revenue',
            value: formatCurrency(salesSummary.totalSales),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'accent',
        },
        {
            label: isRTL ? 'خالص منافع' : 'Net Profit',
            value: formatCurrency(salesSummary.netProfit),
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            color: 'green',
        },
    ];

    const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
        primary: { bg: 'from-primary-500/10 to-primary-600/5', icon: 'bg-primary-500/20 text-primary-400', border: 'border-primary-500/20' },
        accent: { bg: 'from-accent-500/10 to-accent-600/5', icon: 'bg-accent-500/20 text-accent-400', border: 'border-accent-500/20' },
        amber: { bg: 'from-amber-500/10 to-amber-600/5', icon: 'bg-amber-500/20 text-amber-400', border: 'border-amber-500/20' },
        green: { bg: 'from-green-500/10 to-green-600/5', icon: 'bg-green-500/20 text-green-400', border: 'border-green-500/20' },
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
                const colors = colorClasses[stat.color];
                return (
                    <div
                        key={index}
                        className={`card bg-gradient-to-br ${colors.bg} ${colors.border}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${colors.icon}`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">{stat.label}</p>
                                <p className="text-xl font-bold text-white">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default OverviewStats;

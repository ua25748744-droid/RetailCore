import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReports } from '../../contexts/ReportsContext';

export const MonthlyChart: React.FC = () => {
    const { isRTL } = useLanguage();
    const { getLocalizedMonth, formatCurrency } = useReports();

    // Demo monthly data (in production, this would come from actual sales data)
    const monthlyData = [
        { month: 6, sales: 98000, profit: 24500 },
        { month: 7, sales: 112000, profit: 28000 },
        { month: 8, sales: 95000, profit: 23750 },
        { month: 9, sales: 118000, profit: 29500 },
        { month: 10, sales: 135000, profit: 33750 },
        { month: 11, sales: 125000, profit: 32000 },
    ];

    const maxSales = Math.max(...monthlyData.map(d => d.sales));

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    {isRTL ? 'ماہانہ رجحان' : 'Monthly Trend'}
                </h3>
                <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-primary-500"></span>
                        {isRTL ? 'فروخت' : 'Sales'}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded bg-green-500"></span>
                        {isRTL ? 'منافع' : 'Profit'}
                    </span>
                </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="h-48 flex items-end justify-between gap-2">
                {monthlyData.map((data, index) => {
                    const salesHeight = (data.sales / maxSales) * 100;
                    const profitHeight = (data.profit / maxSales) * 100;

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full flex items-end justify-center gap-1 h-36">
                                <div
                                    className="w-5 bg-gradient-to-t from-primary-600 to-primary-400 rounded-t transition-all hover:opacity-80"
                                    style={{ height: `${salesHeight}%` }}
                                    title={formatCurrency(data.sales)}
                                />
                                <div
                                    className="w-5 bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all hover:opacity-80"
                                    style={{ height: `${profitHeight}%` }}
                                    title={formatCurrency(data.profit)}
                                />
                            </div>
                            <span className="text-xs text-slate-500 truncate w-full text-center">
                                {getLocalizedMonth(data.month, isRTL).slice(0, 3)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-xs text-slate-500 mb-1">{isRTL ? 'اوسط ماہانہ فروخت' : 'Avg Monthly Sales'}</p>
                    <p className="text-lg font-bold text-primary-400">
                        {formatCurrency(Math.round(monthlyData.reduce((s, d) => s + d.sales, 0) / monthlyData.length))}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-slate-500 mb-1">{isRTL ? 'اوسط ماہانہ منافع' : 'Avg Monthly Profit'}</p>
                    <p className="text-lg font-bold text-green-400">
                        {formatCurrency(Math.round(monthlyData.reduce((s, d) => s + d.profit, 0) / monthlyData.length))}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MonthlyChart;

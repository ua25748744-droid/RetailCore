import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useReports } from '../../contexts/ReportsContext';
import type { StockAlert } from '../../contexts/ReportsContext';

export const StockAlertsCard: React.FC = () => {
    const { isRTL, currentLanguage } = useLanguage();
    const { reportData } = useReports();
    const { stockAlerts, lowStockCount, outOfStockCount } = reportData;

    const getStatusStyle = (status: StockAlert['status']) => {
        switch (status) {
            case 'out_of_stock':
                return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400', label: isRTL ? 'اسٹاک ختم' : 'Out of Stock' };
            case 'critical':
                return { bg: 'bg-orange-500/20', border: 'border-orange-500/30', text: 'text-orange-400', label: isRTL ? 'انتہائی کم' : 'Critical' };
            case 'low_stock':
                return { bg: 'bg-amber-500/20', border: 'border-amber-500/30', text: 'text-amber-400', label: isRTL ? 'کم اسٹاک' : 'Low' };
        }
    };

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {isRTL ? 'اسٹاک انتباہات' : 'Stock Alerts'}
                </h3>
                <div className="flex items-center gap-2">
                    {outOfStockCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                            {outOfStockCount} {isRTL ? 'ختم' : 'out'}
                        </span>
                    )}
                    {lowStockCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                            {lowStockCount} {isRTL ? 'کم' : 'low'}
                        </span>
                    )}
                </div>
            </div>

            {stockAlerts.length === 0 ? (
                <div className="py-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-green-400 font-medium">
                        {isRTL ? 'سب اسٹاک ٹھیک ہے' : 'All stock levels OK'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                        {isRTL ? 'کوئی انتباہ نہیں' : 'No alerts at this time'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {stockAlerts.map((alert) => {
                        const style = getStatusStyle(alert.status);
                        return (
                            <div
                                key={alert.productId}
                                className={`flex items-center justify-between p-3 rounded-xl ${style.bg} border ${style.border}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center`}>
                                        <span className={`text-sm font-bold ${style.text}`}>
                                            {alert.currentStock}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {currentLanguage === 'ur' && alert.productNameUr
                                                ? alert.productNameUr
                                                : alert.productName}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {isRTL ? `کم از کم: ${alert.minStock}` : `Min: ${alert.minStock}`}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-xs font-medium ${style.text} px-2 py-1 rounded-full ${style.bg}`}>
                                    {style.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default StockAlertsCard;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useLedger } from '../../contexts/LedgerContext';
import type { Customer, LedgerEntry } from '../../db/schema';

interface CustomerDetailProps {
    customer: Customer;
    onBack: () => void;
    onAddPayment: () => void;
    onAddCredit: () => void;
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
    customer,
    onBack,
    onAddPayment,
    onAddCredit
}) => {
    useTranslation();
    const { isRTL } = useLanguage();
    const { getCustomerLedger } = useLedger();

    const ledgerEntries = getCustomerLedger(customer.id);

    // Note: formatDate is available in LedgerEntryRow component

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onBack}
                    className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
                >
                    <svg className={`w-5 h-5 text-slate-400 ${isRTL ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">{customer.name}</h1>
                    <p className="text-sm text-slate-400">{customer.phone} • {customer.address}</p>
                </div>
            </div>

            {/* Balance Card */}
            <div className="card bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">
                            {isRTL ? 'کل ادھار بقایا' : 'Total Credit Balance'}
                        </p>
                        <p className={`text-4xl font-bold ${customer.credit_balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            Rs. {customer.credit_balance.toLocaleString()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">
                            {isRTL ? 'ادھار حد' : 'Credit Limit'}
                        </p>
                        <p className="text-xl font-semibold text-slate-300">
                            Rs. {customer.credit_limit.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                    <button
                        onClick={onAddPayment}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                        </svg>
                        {isRTL ? 'رقم وصول کریں' : 'Receive Payment'}
                    </button>
                    <button
                        onClick={onAddCredit}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                        </svg>
                        {isRTL ? 'ادھار شامل کریں' : 'Add Credit'}
                    </button>
                </div>
            </div>

            {/* Ledger History */}
            <div className="card">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {isRTL ? 'کھاتہ تفصیل' : 'Ledger History'}
                </h3>

                {ledgerEntries.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                        <p>{isRTL ? 'کوئی اندراج نہیں' : 'No entries yet'}</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {ledgerEntries.map((entry) => (
                            <LedgerEntryRow key={entry.id} entry={entry} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// Ledger Entry Row Component
const LedgerEntryRow: React.FC<{ entry: LedgerEntry }> = ({ entry }) => {
    const { isRTL } = useLanguage();

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-PK', {
            month: 'short',
            day: 'numeric',
        });
    };

    const isCredit = entry.type === 'credit';

    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCredit ? 'bg-red-500/20' : 'bg-green-500/20'
                    }`}>
                    {isCredit ? (
                        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-white">
                        {isCredit ? (isRTL ? 'ادھار' : 'Credit') : (isRTL ? 'وصولی' : 'Payment')}
                    </p>
                    <p className="text-xs text-slate-500">{entry.description}</p>
                </div>
            </div>

            <div className="text-right">
                <p className={`font-semibold ${isCredit ? 'text-red-400' : 'text-green-400'}`}>
                    {isCredit ? '+' : '-'} Rs. {entry.amount.toLocaleString()}
                </p>
                <p className="text-xs text-slate-500">
                    {formatDate(entry.created_at)} • {isRTL ? 'بقایا' : 'Bal'}: Rs. {entry.balance.toLocaleString()}
                </p>
            </div>
        </div>
    );
};

export default CustomerDetail;

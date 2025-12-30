import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Customer } from '../../db/schema';

interface PaymentModalProps {
    customer: Customer;
    type: 'payment' | 'credit';
    onClose: () => void;
    onSubmit: (amount: number, description: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ customer, type, onClose, onSubmit }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    const isPayment = type === 'payment';
    const amountNum = parseFloat(amount) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amountNum <= 0) return;
        onSubmit(amountNum, description);
    };

    // Quick amounts
    const quickAmounts = [500, 1000, 2000, 5000, 10000];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isPayment ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                            {isPayment ? (
                                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {isPayment
                                    ? (isRTL ? 'رقم وصول کریں' : 'Receive Payment')
                                    : (isRTL ? 'ادھار شامل کریں' : 'Add Credit')
                                }
                            </h2>
                            <p className="text-sm text-slate-400">{customer.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Current Balance */}
                <div className="bg-slate-700/30 rounded-xl p-4 mb-6 text-center">
                    <p className="text-sm text-slate-400 mb-1">
                        {isRTL ? 'موجودہ بقایا' : 'Current Balance'}
                    </p>
                    <p className={`text-2xl font-bold ${customer.credit_balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        Rs. {customer.credit_balance.toLocaleString()}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {isRTL ? 'رقم' : 'Amount'} (Rs.) *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="input-field text-2xl text-center font-bold"
                            placeholder="0"
                            autoFocus
                            min="1"
                        />

                        {/* Quick Amount Buttons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {isPayment && customer.credit_balance > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setAmount(customer.credit_balance.toString())}
                                    className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-sm font-medium hover:bg-green-500/30 transition-colors"
                                >
                                    {isRTL ? 'پوری رقم' : 'Full Amount'}
                                </button>
                            )}
                            {quickAmounts.map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setAmount(amt.toString())}
                                    className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                                >
                                    {amt.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* New Balance Preview */}
                    {amountNum > 0 && (
                        <div className={`p-3 rounded-xl border ${isPayment ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                            }`}>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-400">
                                    {isRTL ? 'نیا بقایا' : 'New Balance'}
                                </span>
                                <span className={`text-xl font-bold ${isPayment
                                        ? 'text-green-400'
                                        : 'text-red-400'
                                    }`}>
                                    Rs. {(isPayment
                                        ? customer.credit_balance - amountNum
                                        : customer.credit_balance + amountNum
                                    ).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {isRTL ? 'تفصیل' : 'Description'}
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-field"
                            placeholder={isPayment
                                ? (isRTL ? 'رقم وصولی...' : 'Payment received...')
                                : (isRTL ? 'ادھار پر فروخت...' : 'Sale on credit...')
                            }
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-700/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 btn-secondary"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={amountNum <= 0}
                            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isPayment
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                }`}
                        >
                            {isPayment
                                ? (isRTL ? 'وصول کریں' : 'Receive')
                                : (isRTL ? 'شامل کریں' : 'Add')
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PaymentModal;

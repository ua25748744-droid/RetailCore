import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';
import { useInventory } from '../../contexts/InventoryContext';

interface CheckoutModalProps {
    onClose: () => void;
    onComplete: (paymentMethod: string, amountPaid: number) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ onClose, onComplete }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { cartTotal } = useInventory();

    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit' | 'card'>('cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [customerName, setCustomerName] = useState('');

    const amountReceivedNum = parseFloat(amountReceived) || 0;
    const changeAmount = amountReceivedNum - cartTotal;
    const isValidPayment = paymentMethod === 'credit' || amountReceivedNum >= cartTotal;

    const handleComplete = () => {
        if (!isValidPayment) return;
        onComplete(paymentMethod, amountReceivedNum);
    };

    // Quick amount buttons
    const quickAmounts = [100, 500, 1000, 2000, 5000];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-white">
                        {t('sale.checkout')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-xl p-4 mb-6 text-center">
                    <p className="text-slate-400 text-sm mb-1">{t('common.total')}</p>
                    <p className="text-4xl font-bold text-white">Rs. {cartTotal.toLocaleString()}</p>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                        {t('sale.payment_method')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { key: 'cash', icon: '💵', labelEn: 'Cash', labelUr: 'نقد' },
                            { key: 'credit', icon: '📒', labelEn: 'Credit', labelUr: 'ادھار' },
                            { key: 'card', icon: '💳', labelEn: 'Card', labelUr: 'کارڈ' },
                        ].map((method) => (
                            <button
                                key={method.key}
                                onClick={() => setPaymentMethod(method.key as any)}
                                className={`p-3 rounded-xl border transition-all ${paymentMethod === method.key
                                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-400'
                                    : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500/50'
                                    }`}
                            >
                                <span className="text-2xl block mb-1">{method.icon}</span>
                                <span className="text-sm font-medium">
                                    {isRTL ? method.labelUr : method.labelEn}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Customer Name for Credit */}
                {paymentMethod === 'credit' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('sale.customer')} *
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="input-field"
                            placeholder={isRTL ? 'گاہک کا نام...' : 'Customer name...'}
                        />
                    </div>
                )}

                {/* Amount Received for Cash/Card */}
                {paymentMethod !== 'credit' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {isRTL ? 'وصول شدہ رقم' : 'Amount Received'} (Rs.)
                        </label>
                        <input
                            type="number"
                            value={amountReceived}
                            onChange={(e) => setAmountReceived(e.target.value)}
                            className="input-field text-2xl text-center font-bold"
                            placeholder="0"
                            autoFocus
                        />

                        {/* Quick Amount Buttons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            <button
                                onClick={() => setAmountReceived(cartTotal.toString())}
                                className="px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-400 text-sm font-medium hover:bg-accent-500/30 transition-colors"
                            >
                                {isRTL ? 'پوری رقم' : 'Exact'}
                            </button>
                            {quickAmounts.map((amount) => (
                                <button
                                    key={amount}
                                    onClick={() => setAmountReceived((amountReceivedNum + amount).toString())}
                                    className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                                >
                                    +{amount.toLocaleString()}
                                </button>
                            ))}
                        </div>

                        {/* Change Amount */}
                        {amountReceivedNum > 0 && (
                            <div className={`mt-4 p-3 rounded-xl border ${changeAmount >= 0
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-red-500/10 border-red-500/30'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <span className={changeAmount >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {changeAmount >= 0
                                            ? (isRTL ? 'واپسی' : 'Change')
                                            : (isRTL ? 'باقی رقم' : 'Remaining')}
                                    </span>
                                    <span className={`text-xl font-bold ${changeAmount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        Rs. {Math.abs(changeAmount).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                        onClick={handleComplete}
                        disabled={!isValidPayment || (paymentMethod === 'credit' && !customerName.trim())}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t('sale.complete_sale')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;

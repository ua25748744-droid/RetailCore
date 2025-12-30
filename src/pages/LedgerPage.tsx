import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useLedger } from '../contexts/LedgerContext';
import { CustomerList, CustomerDetail, PaymentModal, CustomerForm } from '../components/ledger';
import type { Customer } from '../db/schema';

export const LedgerPage: React.FC = () => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();
    const { addCustomer, addLedgerEntry, getCustomerBalance } = useLedger();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerForm, setShowCustomerForm] = useState(false);
    const [paymentType, setPaymentType] = useState<'payment' | 'credit' | null>(null);

    // Handle add customer
    const handleAddCustomer = (data: {
        name: string;
        phone: string;
        address: string;
        credit_limit: number;
    }) => {
        addCustomer({
            name: data.name,
            phone: data.phone,
            address: data.address,
            credit_limit: data.credit_limit,
            credit_balance: 0,
            is_active: true,
        });
        setShowCustomerForm(false);
    };

    // Handle payment/credit submission
    const handlePaymentSubmit = (amount: number, description: string) => {
        if (!selectedCustomer) return;

        const currentBalance = getCustomerBalance(selectedCustomer.id);
        const isPayment = paymentType === 'payment';

        addLedgerEntry({
            customer_id: selectedCustomer.id,
            type: isPayment ? 'debit' : 'credit',
            amount: amount,
            balance: isPayment ? currentBalance - amount : currentBalance + amount,
            description: description || (isPayment ? 'Payment received' : 'Sale on credit'),
            user_id: 1, // Default user
        });

        // Update selected customer with new balance
        setSelectedCustomer(prev => prev ? {
            ...prev,
            credit_balance: isPayment ? prev.credit_balance - amount : prev.credit_balance + amount,
        } : null);

        setPaymentType(null);
    };

    return (
        <div className="min-h-screen py-8 px-6 pb-24 md:pb-8" style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header - only show when not viewing customer detail */}
                {!selectedCustomer && (
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-brand-primary))' }}>
                            {t('navigation.ledger')}
                        </h1>
                        <p className="mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            {isRTL ? 'گاہکوں کا کھاتہ اور ادھار کا انتظام' : 'Manage customer accounts and credit'}
                        </p>
                    </div>
                )}

                {/* Content */}
                {selectedCustomer ? (
                    <CustomerDetail
                        customer={selectedCustomer}
                        onBack={() => setSelectedCustomer(null)}
                        onAddPayment={() => setPaymentType('payment')}
                        onAddCredit={() => setPaymentType('credit')}
                    />
                ) : (
                    <CustomerList
                        onSelectCustomer={setSelectedCustomer}
                        onAddCustomer={() => setShowCustomerForm(true)}
                    />
                )}
            </div>

            {/* Customer Form Modal */}
            {showCustomerForm && (
                <CustomerForm
                    onClose={() => setShowCustomerForm(false)}
                    onSave={handleAddCustomer}
                />
            )}

            {/* Payment/Credit Modal */}
            {paymentType && selectedCustomer && (
                <PaymentModal
                    customer={selectedCustomer}
                    type={paymentType}
                    onClose={() => setPaymentType(null)}
                    onSubmit={handlePaymentSubmit}
                />
            )}
        </div>
    );
};

export default LedgerPage;

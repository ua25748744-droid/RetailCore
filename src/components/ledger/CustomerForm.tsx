import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

interface CustomerFormProps {
    onClose: () => void;
    onSave: (data: {
        name: string;
        phone: string;
        address: string;
        credit_limit: number;
    }) => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({ onClose, onSave }) => {
    const { t } = useTranslation();
    const { isRTL } = useLanguage();

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        credit_limit: '10000',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        onSave({
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            credit_limit: parseFloat(formData.credit_limit) || 0,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-white">
                        {t('customer.add_customer')}
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

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('customer.customer_name')} *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input-field"
                            placeholder={isRTL ? 'گاہک کا نام' : 'Customer name'}
                            autoFocus
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('customer.phone')}
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="0300-1234567"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('customer.address')}
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="input-field min-h-[80px] resize-y"
                            placeholder={isRTL ? 'پتہ...' : 'Address...'}
                        />
                    </div>

                    {/* Credit Limit */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            {t('customer.credit_limit')} (Rs.)
                        </label>
                        <input
                            type="number"
                            name="credit_limit"
                            value={formData.credit_limit}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="10000"
                            min="0"
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
                            disabled={!formData.name.trim()}
                            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomerForm;

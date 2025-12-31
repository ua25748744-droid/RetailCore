import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Supplier } from '../../db/schema';

interface SupplierFormProps {
    supplier?: Supplier | null;
    onClose: () => void;
    onSave: (data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ supplier, onClose, onSave }) => {
    const { isRTL } = useLanguage();

    const [formData, setFormData] = useState({
        name: supplier?.name || '',
        phone: supplier?.phone || '',
        email: supplier?.email || '',
        address: supplier?.address || '',
        balance: supplier?.balance?.toString() || '0',
        notes: supplier?.notes || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) {
            newErrors.name = isRTL ? 'نام درکار ہے' : 'Name is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        onSave({
            name: formData.name,
            phone: formData.phone || undefined,
            email: formData.email || undefined,
            address: formData.address || undefined,
            balance: parseFloat(formData.balance) || 0,
            notes: formData.notes || undefined,
            is_active: true,
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
                    <h2 className="text-xl font-bold text-foreground">
                        {supplier ? (isRTL ? 'سپلائر میں ترمیم کریں' : 'Edit Supplier') : (isRTL ? 'نیا سپلائر' : 'Add Supplier')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    >
                        <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                            {isRTL ? 'نام' : 'Name'} *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`input-field ${errors.name ? 'border-red-500/50' : ''}`}
                            placeholder={isRTL ? 'سپلائر کا نام' : 'Supplier name'}
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                    </div>

                    {/* Phone & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">
                                {isRTL ? 'فون' : 'Phone'}
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
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">
                                {isRTL ? 'ای میل' : 'Email'}
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="supplier@email.com"
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                            {isRTL ? 'پتہ' : 'Address'}
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="input-field"
                            placeholder={isRTL ? 'مکمل پتہ' : 'Full address'}
                        />
                    </div>

                    {/* Balance */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                            {isRTL ? 'بقایا رقم' : 'Balance (Rs.)'}
                        </label>
                        <input
                            type="number"
                            name="balance"
                            value={formData.balance}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="0"
                            step="0.01"
                        />
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-muted mb-2">
                            {isRTL ? 'نوٹس' : 'Notes'}
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="input-field min-h-[80px] resize-y"
                            placeholder={isRTL ? 'اضافی معلومات...' : 'Additional notes...'}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            {isRTL ? 'منسوخ کریں' : 'Cancel'}
                        </button>
                        <button type="submit" className="btn-primary">
                            {isRTL ? 'محفوظ کریں' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SupplierForm;

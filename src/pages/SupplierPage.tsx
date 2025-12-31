import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSupplier } from '../contexts/SupplierContext';
import { SupplierList, SupplierForm } from '../components/supplier';
import type { Supplier } from '../db/schema';
import { Plus } from 'lucide-react';

export const SupplierPage: React.FC = () => {
    const { isRTL } = useLanguage();
    const { selectedSupplier, setSelectedSupplier, addSupplier, updateSupplier, deleteSupplier } = useSupplier();

    const [showForm, setShowForm] = useState(false);

    // Handle edit
    const handleEdit = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setShowForm(true);
    };

    // Handle delete
    const handleDelete = (supplier: Supplier) => {
        if (window.confirm(isRTL ? 'کیا آپ واقعی اس سپلائر کو حذف کرنا چاہتے ہیں؟' : 'Are you sure you want to delete this supplier?')) {
            deleteSupplier(supplier.id);
        }
    };

    // Handle save
    const handleSave = (data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
        if (selectedSupplier) {
            updateSupplier(selectedSupplier.id, data);
        } else {
            addSupplier(data);
        }
        setShowForm(false);
        setSelectedSupplier(null);
    };

    return (
        <div className="min-h-screen py-8 px-6 pb-24 md:pb-8" style={{ backgroundColor: 'rgb(var(--color-bg-primary))' }}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-brand-primary))' }}>
                            {isRTL ? 'سپلائرز' : 'Suppliers'}
                        </h1>
                        <p className="mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            {isRTL ? 'اپنے سپلائرز کا انتظام کریں' : 'Manage your suppliers and vendors'}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            setSelectedSupplier(null);
                            setShowForm(true);
                        }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        {isRTL ? 'نیا سپلائر' : 'Add Supplier'}
                    </button>
                </div>

                {/* Supplier List */}
                <SupplierList onEdit={handleEdit} onDelete={handleDelete} />
            </div>

            {/* Supplier Form Modal */}
            {showForm && (
                <SupplierForm
                    supplier={selectedSupplier}
                    onClose={() => {
                        setShowForm(false);
                        setSelectedSupplier(null);
                    }}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

export default SupplierPage;

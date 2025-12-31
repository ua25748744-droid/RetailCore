import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSupplier } from '../../contexts/SupplierContext';
import type { Supplier } from '../../db/schema';
import { Search, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';

interface SupplierListProps {
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplier: Supplier) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({ onEdit, onDelete }) => {
    const { isRTL } = useLanguage();
    const { suppliers } = useSupplier();
    const [searchTerm, setSearchTerm] = useState('');

    // Filtered suppliers
    const filteredSuppliers = useMemo(() => {
        if (!searchTerm) return suppliers.filter(s => s.is_active);
        const term = searchTerm.toLowerCase();
        return suppliers.filter(
            (s) =>
                s.is_active &&
                (s.name.toLowerCase().includes(term) ||
                    s.phone?.includes(searchTerm) ||
                    s.email?.toLowerCase().includes(term))
        );
    }, [suppliers, searchTerm]);

    // Stats
    const totalSuppliers = suppliers.filter(s => s.is_active).length;
    const totalBalance = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-gradient-to-br from-primary-500/10 to-primary-600/5 border-primary-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-primary-500/20">
                            <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-muted">{isRTL ? 'کل سپلائرز' : 'Total Suppliers'}</p>
                            <p className="text-2xl font-bold text-foreground">{totalSuppliers}</p>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/20">
                            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-muted">{isRTL ? 'کل بقایا' : 'Total Balance'}</p>
                            <p className="text-2xl font-bold text-foreground">Rs. {totalBalance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-muted ${isRTL ? 'right-4' : 'left-4'}`} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`input-field w-full ${isRTL ? 'pr-12' : 'pl-12'}`}
                    placeholder={isRTL ? 'سپلائر تلاش کریں...' : 'Search suppliers...'}
                />
            </div>

            {/* Supplier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map((supplier) => (
                    <div key={supplier.id} className="card hover:border-primary-500/50 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-foreground text-lg">{supplier.name}</h3>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit(supplier)}
                                    className="p-1.5 rounded-lg hover:bg-primary-500/20 text-muted hover:text-primary-400 transition-colors"
                                    title={isRTL ? 'ترمیم' : 'Edit'}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(supplier)}
                                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted hover:text-red-400 transition-colors"
                                    title={isRTL ? 'حذف' : 'Delete'}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2 text-sm">
                            {supplier.phone && (
                                <div className="flex items-center gap-2 text-muted">
                                    <Phone className="w-4 h-4" />
                                    <span>{supplier.phone}</span>
                                </div>
                            )}
                            {supplier.email && (
                                <div className="flex items-center gap-2 text-muted">
                                    <Mail className="w-4 h-4" />
                                    <span>{supplier.email}</span>
                                </div>
                            )}
                            {supplier.address && (
                                <div className="flex items-center gap-2 text-muted">
                                    <MapPin className="w-4 h-4" />
                                    <span className="line-clamp-1">{supplier.address}</span>
                                </div>
                            )}
                        </div>

                        {supplier.balance !== 0 && (
                            <div className="mt-4 pt-3 border-t border-border">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">{isRTL ? 'بقایا' : 'Balance'}</span>
                                    <span className={`font-semibold ${supplier.balance > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                                        Rs. {Math.abs(supplier.balance).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredSuppliers.length === 0 && (
                <div className="py-12 text-center text-muted">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p>{isRTL ? 'کوئی سپلائر نہیں ملا' : 'No suppliers found'}</p>
                </div>
            )}
        </div>
    );
};

export default SupplierList;

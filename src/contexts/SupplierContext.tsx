import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Supplier } from '../db/schema';

// Supplier context type
interface SupplierContextType {
    suppliers: Supplier[];
    isLoading: boolean;
    selectedSupplier: Supplier | null;
    setSelectedSupplier: (supplier: Supplier | null) => void;
    addSupplier: (supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => void;
    updateSupplier: (id: number, updates: Partial<Supplier>) => void;
    deleteSupplier: (id: number) => void;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

// Demo suppliers
const DEMO_SUPPLIERS: Supplier[] = [
    {
        id: 1,
        name: 'Punjab Traders',
        phone: '0300-1234567',
        email: 'punjab@traders.pk',
        address: 'Main Market, Lahore',
        balance: 0,
        notes: 'Main supplier for grocery items',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 2,
        name: 'Karachi Wholesale',
        phone: '0321-9876543',
        email: 'karachi@wholesale.pk',
        address: 'Jodia Bazaar, Karachi',
        balance: 5000,
        notes: 'Dairy and beverages supplier',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];

const STORAGE_KEY = 'retailcore_suppliers';

// Load from localStorage
const loadFromLocalStorage = (): Supplier[] | null => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored) as Supplier[];
        }
    } catch (error) {
        console.error('Failed to load suppliers from localStorage:', error);
    }
    return null;
};

// Save to localStorage
const saveToLocalStorage = (suppliers: Supplier[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(suppliers));
    } catch (error) {
        console.error('Failed to save suppliers to localStorage:', error);
    }
};

export const SupplierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
        const stored = loadFromLocalStorage();
        return stored !== null && stored.length > 0 ? stored : DEMO_SUPPLIERS;
    });
    const [isLoading] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Save to localStorage whenever suppliers change
    useEffect(() => {
        saveToLocalStorage(suppliers);
    }, [suppliers]);

    // Add supplier
    const addSupplier = useCallback((supplierData: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>) => {
        const maxId = suppliers.length > 0
            ? Math.max(...suppliers.map((s) => s.id ?? 0))
            : 0;
        const newSupplier: Supplier = {
            ...supplierData,
            id: maxId + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setSuppliers((prev) => [...prev, newSupplier]);
        console.log('Supplier added:', newSupplier.name);
    }, [suppliers]);

    // Update supplier
    const updateSupplier = useCallback((id: number, updates: Partial<Supplier>) => {
        setSuppliers((prev) =>
            prev.map((s) =>
                s.id === id
                    ? { ...s, ...updates, updated_at: new Date().toISOString() }
                    : s
            )
        );
        console.log('Supplier updated:', id);
    }, []);

    // Delete supplier (soft delete)
    const deleteSupplier = useCallback((id: number) => {
        setSuppliers((prev) => prev.filter((s) => s.id !== id));
        console.log('Supplier deleted:', id);
    }, []);

    const value = useMemo(
        () => ({
            suppliers,
            isLoading,
            selectedSupplier,
            setSelectedSupplier,
            addSupplier,
            updateSupplier,
            deleteSupplier,
        }),
        [suppliers, isLoading, selectedSupplier, addSupplier, updateSupplier, deleteSupplier]
    );

    return (
        <SupplierContext.Provider value={value}>
            {children}
        </SupplierContext.Provider>
    );
};

export const useSupplier = (): SupplierContextType => {
    const context = useContext(SupplierContext);
    if (!context) {
        throw new Error('useSupplier must be used within a SupplierProvider');
    }
    return context;
};

export default SupplierContext;

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useInventory } from '../contexts/InventoryContext';
import { useLedger } from '../contexts/LedgerContext';
import {
    TrendingUp,
    Package,
    AlertCircle,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    ShoppingBag
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export const DashboardPage: React.FC = () => {
    const { t } = useTranslation();
    const { products } = useInventory();
    const { totalReceivables, customersWithCredit } = useLedger();

    // Mock Data for Charts (In a real app, this would come from ReportsContext or API)
    const salesData = [
        { name: 'Mon', sales: 4000 },
        { name: 'Tue', sales: 3000 },
        { name: 'Wed', sales: 2000 },
        { name: 'Thu', sales: 2780 },
        { name: 'Fri', sales: 1890 },
        { name: 'Sat', sales: 2390 },
        { name: 'Sun', sales: 3490 },
    ];

    const lowStockItems = products.filter(p => p.quantity <= p.min_stock_level).length;
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.cost_price * p.quantity), 0);

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {t('dashboard.greeting')} 📊
                    </h1>
                    <p className="text-muted">
                        {t('dashboard.welcome')}
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="px-4 py-2 rounded-xl bg-surface border border-border text-sm text-muted">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title={t('dashboard.total_sales_today')}
                    value="Rs. 25,400"
                    change="+12.5%"
                    isPositive={true}
                    icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
                    color="emerald"
                />
                <StatsCard
                    title={t('dashboard.total_receivables')}
                    value={`Rs. ${totalReceivables.toLocaleString()}`}
                    subtitle={`${customersWithCredit} ${t('dashboard.customers')}`}
                    icon={<Wallet className="w-6 h-6 text-amber-400" />}
                    color="amber"
                />
                <StatsCard
                    title={t('dashboard.low_stock_items')}
                    value={lowStockItems.toString()}
                    change={t('dashboard.needs_attention')}
                    isPositive={false}
                    icon={<AlertCircle className="w-6 h-6 text-rose-400" />}
                    color="rose"
                />
                <StatsCard
                    title={t('dashboard.inventory_value')}
                    value={`Rs. ${(totalInventoryValue / 100000).toFixed(2)} Lakh`}
                    change="+2 New Items"
                    isPositive={true}
                    icon={<Package className="w-6 h-6 text-blue-400" />}
                    color="blue"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <div className="card lg:col-span-2 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-400" />
                            {t('dashboard.sales_trends')}
                        </h3>
                        <select className="bg-surface border border-border text-muted text-sm rounded-lg px-3 py-1 outline-none focus:border-primary-500">
                            <option>{t('dashboard.last_7_days')}</option>
                            <option>{t('dashboard.last_30_days')}</option>
                        </select>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="rgb(var(--color-brand-primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="rgb(var(--color-brand-primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="rgb(var(--color-brand-primary))"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-accent-400" />
                        {t('dashboard.top_products')}
                    </h3>
                    <div className="space-y-4">
                        {products.slice(0, 5).map((product, index) => (
                            <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/5 transition-colors cursor-pointer group">
                                <div className="h-10 w-10 rounded-lg bg-surface flex items-center justify-center font-bold text-muted group-hover:text-primary-400 group-hover:bg-primary-500/10 transition-colors">
                                    {index + 1}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                                    <p className="text-xs text-muted">{product.quantity} {t('dashboard.in_stock')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-foreground">Rs. {product.selling_price}</p>
                                    <p className="text-xs text-green-400">+12%</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
                        {t('dashboard.view_all')}
                    </button>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Can add quick actions here if needed */}
            </div>
        </div>
    );
};

interface StatsCardProps {
    title: string;
    value: string;
    subtitle?: string;
    change?: string;
    isPositive?: boolean;
    icon: React.ReactNode;
    color: 'emerald' | 'amber' | 'rose' | 'blue';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, change, isPositive, icon, color }) => {
    const colorStyles = {
        emerald: { bg: 'rgb(var(--color-success) / 0.1)', border: 'rgb(var(--color-success) / 0.2)', iconBg: 'rgb(var(--color-success) / 0.15)' },
        amber: { bg: 'rgb(var(--color-warning) / 0.1)', border: 'rgb(var(--color-warning) / 0.2)', iconBg: 'rgb(var(--color-warning) / 0.15)' },
        rose: { bg: 'rgb(var(--color-error) / 0.1)', border: 'rgb(var(--color-error) / 0.2)', iconBg: 'rgb(var(--color-error) / 0.15)' },
        blue: { bg: 'rgb(var(--color-brand-accent) / 0.1)', border: 'rgb(var(--color-brand-accent) / 0.2)', iconBg: 'rgb(var(--color-brand-accent) / 0.15)' },
    };

    const styles = colorStyles[color];

    return (
        <div
            className="card group transition-all duration-300"
            style={{ backgroundColor: styles.bg, borderColor: styles.border }}
        >
            <div className="flex justify-between items-start mb-4">
                <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: styles.iconBg }}
                >
                    {icon}
                </div>
                {change && (
                    <div
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full
                        ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}
                        style={{ backgroundColor: 'rgb(var(--color-bg-secondary))' }}
                    >
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {change}
                    </div>
                )}
            </div>
            <div>
                <p className="text-muted text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">{value}</h3>
                {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
            </div>
        </div>
    );
};


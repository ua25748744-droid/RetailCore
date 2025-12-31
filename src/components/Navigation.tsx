import React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, ShoppingCart, BookOpen, BarChart3, Settings, Bell, Truck } from 'lucide-react';
import { useLowStockCount } from './InventoryAlerts';

type Page = 'dashboard' | 'inventory' | 'pos' | 'ledger' | 'reports' | 'settings' | 'suppliers';

interface NavigationProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
    onAlertsClick?: () => void;
}

const navItems: { key: Page; icon: React.ReactNode }[] = [
    {
        key: 'dashboard',
        icon: <LayoutDashboard />,
    },
    {
        key: 'inventory',
        icon: <Package />,
    },
    {
        key: 'suppliers',
        icon: <Truck />,
    },
    {
        key: 'pos',
        icon: <ShoppingCart />,
    },
    {
        key: 'ledger',
        icon: <BookOpen />,
    },
    {
        key: 'reports',
        icon: <BarChart3 />,
    },
    {
        key: 'settings',
        icon: <Settings />,
    },
];

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onNavigate, onAlertsClick }) => {
    const { t } = useTranslation();
    const lowStockCount = useLowStockCount();

    return (
        <nav className="fixed z-40 transition-all duration-300
                        md:relative md:w-20 md:hover:w-64 md:h-screen md:border-r
                        bottom-0 left-0 right-0 h-16 border-t md:border-t-0 flex md:flex-col shadow-lg md:shadow-none group sidebar"
            style={{ backgroundColor: 'rgb(var(--color-sidebar-bg))', borderColor: 'rgb(var(--color-border))' }}>

            {/* Logo Area (Desktop Only) */}
            <div className="hidden md:flex items-center justify-center h-16 mb-2 border-b border-border/50 w-full overflow-hidden group-hover:justify-start group-hover:px-6 transition-all">
                <div className="relative h-9 w-9 min-w-[2.25rem] rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 p-0.5 mr-3 shadow-lg shadow-primary-500/20">
                    <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-card text-xs font-bold text-foreground">
                        RC
                    </div>
                </div>
                <span className="font-heading font-bold text-xl text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap duration-200 absolute left-20">
                    RetailCore
                </span>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 flex md:flex-col items-center justify-around md:justify-start md:p-3 gap-1 md:gap-2 w-full">
                {navItems.map((item) => (
                    <button
                        key={item.key}
                        onClick={() => onNavigate(item.key)}
                        className={`group/btn relative flex items-center md:w-full p-2 md:p-3 rounded-xl transition-all duration-300
                            ${currentPage === item.key
                                ? 'bg-primary-500/10 text-primary-500'
                                : 'text-muted hover:text-foreground hover:bg-foreground/5'
                            }`}
                        title={t(`navigation.${item.key}`)}
                    >
                        {/* Active Indicator (Desktop) */}
                        {currentPage === item.key && (
                            <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary-500 rounded-r-full hidden md:block" />
                        )}

                        {/* Icon */}
                        <div className={`relative transition-transform duration-300 ${currentPage === item.key ? 'scale-110' : 'group-hover/btn:scale-110'}`}>
                            {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, {
                                className: `w-6 h-6 stroke-[1.5] ${currentPage === item.key ? 'drop-shadow-[0_0_8px_rgba(var(--color-brand-primary)/0.5)]' : ''}`
                            })}
                        </div>

                        {/* Label (Desktop - Hover Reveal) */}
                        <span className={`hidden md:block ml-3 text-sm font-medium transition-all duration-200 opacity-0 group-hover:opacity-100 whitespace-nowrap absolute left-14
                                         ${currentPage === item.key ? 'text-primary-400' : ''}`}>
                            {t(`navigation.${item.key}`)}
                        </span>

                        {/* Label (Mobile - SR only) */}
                        <span className="md:hidden text-[10px] font-medium mt-1 sr-only">
                            {t(`navigation.${item.key}`)}</ span>
                    </button>
                ))}

                {/* Alerts Button */}
                {onAlertsClick && (
                    <button
                        onClick={onAlertsClick}
                        className="group/btn relative flex items-center md:w-full p-2 md:p-3 rounded-xl transition-all duration-300 text-muted hover:text-foreground hover:bg-foreground/5"
                        title={t('navigation.alerts', 'Alerts')}
                    >
                        <div className="relative transition-transform duration-300 group-hover/btn:scale-110">
                            <Bell className="w-6 h-6 stroke-[1.5]" />
                            {/* Alert Badge */}
                            {lowStockCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                                    {lowStockCount > 99 ? '99+' : lowStockCount}
                                </span>
                            )}
                        </div>

                        <span className="hidden md:block ml-3 text-sm font-medium transition-all duration-200 opacity-0 group-hover:opacity-100 whitespace-nowrap absolute left-14">
                            Alerts
                        </span>
                    </button>
                )}
            </div>

            {/* Bottom User Info (Desktop) */}
            <div className="hidden md:flex flex-col p-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-8 w-8 rounded-full bg-surface border border-border flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-muted">US</span>
                    </div>
                    <div className="text-xs whitespace-nowrap overflow-hidden">
                        <p className="font-medium text-foreground">User Admin</p>
                        <p className="text-muted">View Profile</p>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;

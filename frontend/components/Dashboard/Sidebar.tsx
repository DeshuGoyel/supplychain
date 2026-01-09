'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  AlertCircle, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Package,
  Users,
  TrendingUp,
  MapPin,
  PieChart,
  Palette,
  ClipboardList,
  KeyRound
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/components/Common/Button';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const { theme } = useTheme();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Inventory', icon: Package, href: '/dashboard/inventory' },
    { name: 'Suppliers', icon: Users, href: '/dashboard/suppliers' },
    { name: 'Demand Planning', icon: TrendingUp, href: '/dashboard/demand' },
    { name: 'Visibility', icon: MapPin, href: '/dashboard/visibility' },
    { name: 'Analytics', icon: PieChart, href: '/dashboard/analytics' },
    { name: 'Issues', icon: AlertCircle, href: '/dashboard/issues' },
    { name: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
    { name: 'Settings', icon: Settings, href: '/dashboard/settings' },
    { name: 'Two-Factor Auth', icon: KeyRound, href: '/settings/2fa' },
    ...(user?.role === 'MANAGER'
      ? [
          { name: 'White Label', icon: Palette, href: '/admin/white-label' },
          { name: 'Audit Logs', icon: ClipboardList, href: '/admin/audit-logs' },
        ]
      : []),
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className={cn("flex items-center space-x-2 transition-all", collapsed && "opacity-0 invisible w-0")}>
          {theme.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={theme.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
          ) : (
            <ShieldAlert className="h-8 w-8 text-brand" />
          )}
          <span className="text-xl font-bold tracking-tight">{theme.headerText || 'SCACA'}</span>
        </div>
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(true)}
            className="hidden lg:flex p-1 rounded-md hover:bg-slate-800 text-slate-400"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {collapsed && (
          <button 
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex mx-auto p-1 rounded-md hover:bg-slate-800 text-slate-400"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium transition-colors relative group",
                isActive 
                  ? "bg-brand text-white" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center"
              )}
            >
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.name}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
              {isActive && !collapsed && (
                <div className="absolute right-0 w-1 h-full bg-white rounded-l-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        {!collapsed ? (
          <div className="flex flex-col">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Organization</p>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-sm font-medium text-white truncate">{user?.companyId || 'Company Name'}</p>
              <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter font-bold">{user?.role}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
              {user?.role?.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden transition-opacity duration-300",
        mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
      )}>
        <div 
          className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        ></div>
        <div className={cn(
          "absolute inset-y-0 left-0 w-64 transition-transform duration-300 transform",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 z-30",
        collapsed ? "w-16" : "w-64"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;

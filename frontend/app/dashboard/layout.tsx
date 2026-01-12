'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/Auth/ProtectedRoute';
import Header from '@/components/Dashboard/Header';
import Sidebar from '@/components/Dashboard/Sidebar';
import { cn } from '@/components/Common/Button';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar 
          collapsed={collapsed} 
          setCollapsed={setCollapsed}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300",
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}>
          <Header
            onMenuClick={() => setMobileOpen(true)}
            title={
              settings?.enabled && (settings.brandName || settings.companyName)
                ? settings.brandName || settings.companyName || 'Dashboard'
                : 'Supply Chain AI Control'
            }
          />
          
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          
          <footer className="py-4 px-6 bg-white border-t border-gray-200 text-center text-xs text-gray-400">
            {settings?.enabled && settings.footerText
              ? settings.footerText
              : settings?.enabled && settings.hideSupplyChainBranding
                ? `© ${new Date().getFullYear()} ${settings.brandName || settings.companyName || 'SCACA'}`
                : `© ${new Date().getFullYear()} SCACA - Supply Chain AI Control Assistant. All rights reserved.`}
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  );
}

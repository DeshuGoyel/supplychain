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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme } = useTheme();

  const year = new Date().getFullYear();
  const footerCopy = theme.footerText
    ? theme.footerText
    : theme.removedBranding
      ? 'All rights reserved.'
      : 'SCACA - Supply Chain AI Control Assistant. All rights reserved.';

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
            title={theme.headerText || "Supply Chain AI Control"}
          />
          
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          
          <footer className="py-4 px-6 bg-white border-t border-gray-200 text-center text-xs text-gray-400">
            &copy; {year} {footerCopy}
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  );
}

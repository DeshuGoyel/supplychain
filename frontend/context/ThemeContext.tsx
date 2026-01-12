'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export type WhiteLabelSettings = {
  enabled: boolean;
  brandName?: string | null;
  companyName?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  customDomain?: string | null;
  supportEmail?: string | null;
  privacyPolicyUrl?: string | null;
  termsOfServiceUrl?: string | null;
  footerText?: string | null;
  hideSupplyChainBranding?: boolean | null;
};

interface ThemeContextType {
  settings: WhiteLabelSettings | null;
  loading: boolean;
  updateTheme: (next: Partial<WhiteLabelSettings>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const absoluteAssetUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url}`;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_URL}/api/white-label`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (response.data?.success) {
          setSettings(response.data.config || null);
        }
      } catch (error) {
        console.error('Error loading white-label settings:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateTheme = (next: Partial<WhiteLabelSettings>) => {
    setSettings((prev) => ({
      enabled: prev?.enabled ?? false,
      ...prev,
      ...next,
    }));
  };

  const colors = useMemo(() => {
    const primary = settings?.enabled ? settings.primaryColor || '#3b82f6' : '#3b82f6';
    const secondary = settings?.enabled ? settings.secondaryColor || '#1e40af' : '#1e40af';
    return { primary, secondary };
  }, [settings]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    // legacy vars used in a few places
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
  }, [colors]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const titleBase = 'Supply Chain AI Control Assistant';
    const brand = settings?.enabled ? settings.brandName || settings.companyName : null;
    document.title = brand ? `${brand} | ${titleBase}` : `SCACA | ${titleBase}`;

    const favicon = settings?.enabled ? absoluteAssetUrl(settings.faviconUrl || null) : null;
    if (favicon) {
      const existing = document.querySelector<HTMLLinkElement>("link[rel='icon']") || document.createElement('link');
      existing.rel = 'icon';
      existing.href = favicon;
      document.head.appendChild(existing);
    }
  }, [settings]);

  const value: ThemeContextType = {
    settings,
    loading,
    updateTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

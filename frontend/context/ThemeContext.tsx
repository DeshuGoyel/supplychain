'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '@/utils/api';

export type WhiteLabelTheme = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  fontFamily?: string | null;
  headerText?: string | null;
  footerText?: string | null;
  removedBranding?: boolean | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  customHelpCenterUrl?: string | null;
};

type ThemeContextValue = {
  theme: WhiteLabelTheme;
  refresh: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyCssVars = (theme: WhiteLabelTheme) => {
  const root = document.documentElement;
  if (theme.primaryColor) root.style.setProperty('--brand-primary', theme.primaryColor);
  if (theme.secondaryColor) root.style.setProperty('--brand-secondary', theme.secondaryColor);
  if (theme.fontFamily) root.style.setProperty('--brand-font-family', theme.fontFamily);
};

const applyFavicon = (url: string) => {
  const existing = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (existing) {
    existing.href = url;
    return;
  }
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = url;
  document.head.appendChild(link);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<WhiteLabelTheme>({});

  const refresh = async () => {
    try {
      const res = await apiClient.get('/api/white-label/public', {
        params: { domain: window.location.hostname },
      });
      const config = res.data?.config;

      const next: WhiteLabelTheme = {
        primaryColor: config?.primaryColor,
        secondaryColor: config?.secondaryColor,
        fontFamily: config?.fontFamily,
        headerText: config?.headerText,
        footerText: config?.footerText,
        removedBranding: config?.removedBranding,
        logoUrl: config?.logoUrl,
        faviconUrl: config?.faviconUrl,
        customHelpCenterUrl: config?.customHelpCenterUrl,
      };

      setTheme(next);
      applyCssVars(next);
      if (next.faviconUrl) applyFavicon(next.faviconUrl);
    } catch {
      // Keep defaults
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ theme, refresh }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

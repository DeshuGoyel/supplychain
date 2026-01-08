'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoUrl?: string;
  faviconUrl?: string;
  headerText?: string;
  footerText?: string;
  removedBranding: boolean;
  customHelpCenterUrl?: string;
}

interface ThemeContextType {
  theme: ThemeConfig | null;
  loading: boolean;
  error: string | null;
  applyTheme: () => void;
}

const defaultTheme: ThemeConfig = {
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  fontFamily: 'Inter, sans-serif',
  removedBranding: false
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setTheme(defaultTheme);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/white-label/theme', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const themeData = data.data;

        if (themeData) {
          setTheme({
            primaryColor: themeData.primaryColor || '#3B82F6',
            secondaryColor: themeData.secondaryColor || '#10B981',
            fontFamily: themeData.fontFamily || 'Inter, sans-serif',
            logoUrl: themeData.logoUrl,
            faviconUrl: themeData.faviconUrl,
            headerText: themeData.headerText,
            footerText: themeData.footerText,
            removedBranding: themeData.removedBranding || false,
            customHelpCenterUrl: themeData.customHelpCenterUrl
          });
        } else {
          setTheme(defaultTheme);
        }
      } else {
        setTheme(defaultTheme);
      }
    } catch (err) {
      setError('Failed to load theme');
      setTheme(defaultTheme);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = () => {
    if (!theme) return;

    const root = document.documentElement;

    root.style.setProperty('--brand-primary', theme.primaryColor);
    root.style.setProperty('--brand-secondary', theme.secondaryColor);
    root.style.setProperty('--brand-font', theme.fontFamily);

    document.body.style.fontFamily = theme.fontFamily;

    if (theme.faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = theme.faviconUrl;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = theme.faviconUrl;
        document.head.appendChild(newLink);
      }
    }
  };

  useEffect(() => {
    if (theme && !loading) {
      applyTheme();
    }
  }, [theme, loading]);

  return (
    <ThemeContext.Provider value={{ theme, loading, error, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

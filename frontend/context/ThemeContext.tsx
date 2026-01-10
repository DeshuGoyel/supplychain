'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

interface WhiteLabelSettings {
  enabled: boolean;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  companyName?: string;
  customFooterText: string | null;
}

interface ThemeContextType {
  settings: WhiteLabelSettings | null;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  settings: null,
  loading: true,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<WhiteLabelSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/whitelabel/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          const s = response.data.settings;
          setSettings(s);
          applyTheme(s);
        }
      } catch (error) {
        console.error('Failed to fetch white-label settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const applyTheme = (s: WhiteLabelSettings) => {
    if (!s.enabled) return;

    const root = document.documentElement;
    if (s.primaryColor) {
      root.style.setProperty('--primary-color', s.primaryColor);
    }
    if (s.secondaryColor) {
      root.style.setProperty('--secondary-color', s.secondaryColor);
    }

    // Update favicon
    if (s.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = s.faviconUrl.startsWith('http') ? s.faviconUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${s.faviconUrl}`;
    }
  };

  return (
    <ThemeContext.Provider value={{ settings, loading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

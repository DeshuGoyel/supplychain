'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface ThemeColors {
  primary: string;
  secondary: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  logoUrl: string | null;
  companyName: string | null;
  hideBranding: boolean;
  loading: boolean;
  updateTheme: (settings: any) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ThemeColors>({
    primary: '#3b82f6', // Default blue
    secondary: '#1e40af' // Default dark blue
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [hideBranding, setHideBranding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWhiteLabelSettings();
  }, []);

  const loadWhiteLabelSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/whitelabel/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.settings) {
        const settings = response.data.settings;
        if (settings.enabled) {
          setColors({
            primary: settings.primaryColor || '#3b82f6',
            secondary: settings.secondaryColor || '#1e40af'
          });
          setLogoUrl(settings.logoUrl ? `${process.env.NEXT_PUBLIC_API_URL}${settings.logoUrl}` : null);
          setHideBranding(settings.hideSupplyChainBranding || false);
        }
      }
    } catch (error) {
      console.error('Error loading white-label settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = (settings: any) => {
    if (settings.enabled) {
      setColors({
        primary: settings.primaryColor || '#3b82f6',
        secondary: settings.secondaryColor || '#1e40af'
      });
      setLogoUrl(settings.logoUrl ? `${process.env.NEXT_PUBLIC_API_URL}${settings.logoUrl}` : null);
      setHideBranding(settings.hideSupplyChainBranding || false);
    } else {
      setColors({
        primary: '#3b82f6',
        secondary: '#1e40af'
      });
      setLogoUrl(null);
      setHideBranding(false);
    }
  };

  // Apply CSS variables to document
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
  }, [colors]);

  const value: ThemeContextType = {
    colors,
    logoUrl,
    companyName,
    hideBranding,
    loading,
    updateTheme
  };

  return (
    <ThemeContext.Provider value={value}>
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
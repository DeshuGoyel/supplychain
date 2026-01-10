'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WhiteLabelSettings } from '../types/sprint5';

interface ThemeContextType {
  theme: WhiteLabelSettings;
  updateTheme: (theme: WhiteLabelSettings) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<WhiteLabelSettings>({
    enabled: false,
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    hideSupplyChainBranding: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load theme from domain or localStorage
    const loadTheme = async () => {
      try {
        // Check for custom domain
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          // Try to load theme from API based on domain
          const response = await fetch(`/api/whitelabel/theme/${hostname}`);
          if (response.ok) {
            const themeData = await response.json();
            if (themeData.success) {
              setTheme(themeData.data);
            }
          }
        }
        
        // Fallback to localStorage
        const savedTheme = localStorage.getItem('whitelabel-theme');
        if (savedTheme) {
          setTheme(JSON.parse(savedTheme));
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTheme();
  }, []);

  useEffect(() => {
    // Apply CSS variables when theme changes
    const root = document.documentElement;
    
    if (theme.enabled) {
      root.style.setProperty('--color-primary', theme.primaryColor);
      root.style.setProperty('--color-secondary', theme.secondaryColor);
      
      if (theme.logoUrl) {
        root.style.setProperty('--logo-url', `url(${theme.logoUrl})`);
      }
      
      if (theme.faviconUrl) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          favicon.href = theme.faviconUrl;
        }
      }
      
      // Add custom CSS classes if needed
      document.body.classList.add('whitelabel-enabled');
    } else {
      document.body.classList.remove('whitelabel-enabled');
    }
  }, [theme]);

  const updateTheme = (newTheme: WhiteLabelSettings) => {
    setTheme(newTheme);
    localStorage.setItem('whitelabel-theme', JSON.stringify(newTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, isLoading }}>
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
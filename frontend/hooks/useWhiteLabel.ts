import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

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

export function useWhiteLabel() {
  const { token } = useAuth();
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTheme = async () => {
    try {
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/white-label/theme', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch theme');
      }

      const data = await response.json();
      setTheme(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch theme');
    } finally {
      setLoading(false);
    }
  };

  const updateTheme = async (config: Partial<ThemeConfig>) => {
    try {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/white-label/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        throw new Error('Failed to update theme');
      }

      const data = await response.json();
      setTheme(data.data);
      return data.data;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update theme');
    }
  };

  const getThemeCSS = async () => {
    try {
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/white-label/theme/css', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch theme CSS');
      }

      return await response.text();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch theme CSS');
    }
  };

  useEffect(() => {
    fetchTheme();
  }, [token]);

  return {
    theme,
    loading,
    error,
    refetch: fetchTheme,
    updateTheme,
    getThemeCSS
  };
}

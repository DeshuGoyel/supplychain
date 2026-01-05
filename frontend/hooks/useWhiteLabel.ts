'use client';

import { useState } from 'react';
import axios from 'axios';

interface ThemeConfig {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerText: string;
  footerText: string;
  removedBranding: boolean;
  customHelpCenterUrl?: string;
}

export const useWhiteLabel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTheme = async (config: Partial<ThemeConfig>) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/white-label/theme`,
        config,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to update theme';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const setupDomain = async (domain: string) => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/white-label/domain`,
        { domain },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to setup domain';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const verifyDomain = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/white-label/verify-domain`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to verify domain';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const getDomainConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/white-label/domain`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      const message = err.response?.data?.message || 'Failed to fetch domain config';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const deleteDomain = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/white-label/domain`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete domain';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateTheme,
    setupDomain,
    verifyDomain,
    getDomainConfig,
    deleteDomain,
  };
};

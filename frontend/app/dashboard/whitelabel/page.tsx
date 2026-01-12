'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

type SettingsState = {
  enabled: boolean;
  brandName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain: string;
  supportEmail: string;
  footerText: string;
  hideSupplyChainBranding: boolean;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
};

export default function WhitelabelSettings() {
  const { user } = useAuth();
  const { updateTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    enabled: false,
    brandName: '',
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    customDomain: '',
    supportEmail: '',
    footerText: '',
    hideSupplyChainBranding: false,
    termsOfServiceUrl: '',
    privacyPolicyUrl: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/whitelabel/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.settings) {
          const s = response.data.settings;
          setSettings({
            enabled: Boolean(s.enabled),
            brandName: s.brandName || '',
            logoUrl: s.logoUrl || '',
            faviconUrl: s.faviconUrl || '',
            primaryColor: s.primaryColor || '#3b82f6',
            secondaryColor: s.secondaryColor || '#1e40af',
            customDomain: s.customDomain || '',
            supportEmail: s.supportEmail || '',
            footerText: s.footerText || s.customFooterText || '',
            hideSupplyChainBranding: Boolean(s.hideSupplyChainBranding),
            termsOfServiceUrl: s.termsOfServiceUrl || '',
            privacyPolicyUrl: s.privacyPolicyUrl || '',
          });
        }
      } catch (error) {
        console.error('Error fetching whitelabel settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const syncThemeContext = (next: SettingsState) => {
    updateTheme({
      enabled: next.enabled,
      brandName: next.brandName,
      companyName: next.brandName,
      primaryColor: next.primaryColor,
      secondaryColor: next.secondaryColor,
      logoUrl: next.logoUrl,
      faviconUrl: next.faviconUrl,
      customDomain: next.customDomain,
      supportEmail: next.supportEmail,
      footerText: next.footerText,
      hideSupplyChainBranding: next.hideSupplyChainBranding,
      termsOfServiceUrl: next.termsOfServiceUrl,
      privacyPolicyUrl: next.privacyPolicyUrl,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/whitelabel/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && response.data?.settings) {
        const saved = response.data.settings;
        const next: SettingsState = {
          enabled: Boolean(saved.enabled),
          brandName: saved.brandName || '',
          logoUrl: saved.logoUrl || '',
          faviconUrl: saved.faviconUrl || '',
          primaryColor: saved.primaryColor || '#3b82f6',
          secondaryColor: saved.secondaryColor || '#1e40af',
          customDomain: saved.customDomain || '',
          supportEmail: saved.supportEmail || '',
          footerText: saved.footerText || saved.customFooterText || '',
          hideSupplyChainBranding: Boolean(saved.hideSupplyChainBranding),
          termsOfServiceUrl: saved.termsOfServiceUrl || '',
          privacyPolicyUrl: saved.privacyPolicyUrl || '',
        };
        setSettings(next);
        syncThemeContext(next);
      }

      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    if (!e.target.files?.[0]) return;

    const formData = new FormData();
    formData.append(type, e.target.files[0]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/whitelabel/upload-${type}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const url = response.data[`${type}Url`] as string;
        const next = { ...settings, [`${type}Url`]: url } as SettingsState;
        setSettings(next);
        syncThemeContext(next);
        toast.success(`${type} uploaded`);
      }
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (user?.role !== 'MANAGER') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-yellow-800">Access Restricted</h3>
          <p className="mt-2 text-sm text-yellow-700">Only managers can configure white-label settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">White-label Settings</h1>

      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium">Enable White-labeling</h2>
            <p className="text-gray-500">Enable custom branding for your platform</p>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
            className="h-6 w-6 text-blue-600 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brand Name</label>
          <input
            type="text"
            value={settings.brandName}
            onChange={(e) => setSettings({ ...settings, brandName: e.target.value })}
            placeholder="Your company / product name"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center space-x-4">
              {settings.logoUrl && (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${settings.logoUrl}`}
                  alt="Logo"
                  className="h-12 object-contain"
                />
              )}
              <input type="file" onChange={(e) => handleFileUpload(e, 'logo')} className="text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
            <div className="flex items-center space-x-4">
              {settings.faviconUrl && (
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL}${settings.faviconUrl}`}
                  alt="Favicon"
                  className="h-8 w-8"
                />
              )}
              <input type="file" onChange={(e) => handleFileUpload(e, 'favicon')} className="text-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
            <div className="mt-1 flex items-center">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="h-10 w-20 border rounded"
              />
              <span className="ml-3 text-sm text-gray-600">{settings.primaryColor}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
            <div className="mt-1 flex items-center">
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="h-10 w-20 border rounded"
              />
              <span className="ml-3 text-sm text-gray-600">{settings.secondaryColor}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Custom Domain</label>
          <input
            type="text"
            value={settings.customDomain}
            onChange={(e) => setSettings({ ...settings, customDomain: e.target.value })}
            placeholder="app.yourcompany.com"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Support Email</label>
          <input
            type="email"
            value={settings.supportEmail}
            onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
            placeholder="support@yourcompany.com"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Footer Text</label>
          <input
            type="text"
            value={settings.footerText}
            onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Terms of Service URL</label>
            <input
              type="url"
              value={settings.termsOfServiceUrl}
              onChange={(e) => setSettings({ ...settings, termsOfServiceUrl: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Privacy Policy URL</label>
            <input
              type="url"
              value={settings.privacyPolicyUrl}
              onChange={(e) => setSettings({ ...settings, privacyPolicyUrl: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={settings.hideSupplyChainBranding}
            onChange={(e) => setSettings({ ...settings, hideSupplyChainBranding: e.target.checked })}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label className="text-sm font-medium text-gray-700">Hide Supply Chain AI Branding</label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

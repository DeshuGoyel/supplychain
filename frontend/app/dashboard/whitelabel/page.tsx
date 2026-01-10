'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function WhitelabelSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#1e40af',
    customDomain: '',
    hideSupplyChainBranding: false,
    customFooterText: '',
    termsOfServiceUrl: '',
    privacyPolicyUrl: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/whitelabel/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setSettings(response.data.settings);
        }
      } catch (error) {
        console.error('Error fetching whitelabel settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/whitelabel/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/whitelabel/upload-${type}`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setSettings({ ...settings, [`${type}Url`]: response.data[`${type}Url`] });
        toast.success(`${type} uploaded`);
      }
    } catch (error) {
      toast.error(`Failed to upload ${type}`);
    }
  };

  if (loading) return <div>Loading...</div>;

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
            onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
            className="h-6 w-6 text-blue-600 rounded"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center space-x-4">
              {settings.logoUrl && (
                <img src={`${process.env.NEXT_PUBLIC_API_URL}${settings.logoUrl}`} alt="Logo" className="h-12 object-contain" />
              )}
              <input type="file" onChange={(e) => handleFileUpload(e, 'logo')} className="text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
            <div className="flex items-center space-x-4">
              {settings.faviconUrl && (
                <img src={`${process.env.NEXT_PUBLIC_API_URL}${settings.faviconUrl}`} alt="Favicon" className="h-8 w-8" />
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
                onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
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
                onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
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
            onChange={(e) => setSettings({...settings, customDomain: e.target.value})}
            placeholder="app.yourcompany.com"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Custom Footer Text</label>
          <input 
            type="text" 
            value={settings.customFooterText || ''} 
            onChange={(e) => setSettings({...settings, customFooterText: e.target.value})}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input 
            type="checkbox" 
            checked={settings.hideSupplyChainBranding} 
            onChange={(e) => setSettings({...settings, hideSupplyChainBranding: e.target.checked})}
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

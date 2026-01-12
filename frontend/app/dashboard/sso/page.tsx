'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';

export default function SSOConfigurationPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    provider: '',
    clientId: '',
    clientSecret: '',
    enabled: true
  });

  useEffect(() => {
    fetchSSOIntegrations();
  }, []);

  const fetchSSOIntegrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/sso/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIntegrations(response.data.integrations || []);
    } catch (error) {
      console.error('Error fetching SSO integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.provider || !formData.clientId || !formData.clientSecret) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/sso/configure`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('SSO configuration saved successfully');
      setFormData({ provider: '', clientId: '', clientSecret: '', enabled: true });
      fetchSSOIntegrations();
    } catch (error) {
      toast.error('Failed to save SSO configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (integrationId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/sso/test/${integrationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success('SSO connection test successful');
      } else {
        toast.error('SSO connection test failed');
      }
    } catch (error) {
      toast.error('Failed to test SSO connection');
    }
  };

  const handleToggle = async (integrationId: string, enabled: boolean) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/sso/integrations/${integrationId}`, 
        { enabled }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`SSO ${enabled ? 'enabled' : 'disabled'} successfully`);
      fetchSSOIntegrations();
    } catch (error) {
      toast.error('Failed to update SSO integration');
    }
  };

  if (loading) return <div>Loading...</div>;

  // Check if user has permission (MANAGER only)
  if (user?.role !== 'MANAGER') {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Access Restricted
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                Only managers can configure SSO settings.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">SSO Configuration</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Configure SSO Provider</h2>
        
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SSO Provider</label>
            <select
              value={formData.provider}
              onChange={(e) => setFormData({...formData, provider: e.target.value})}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="">Select a provider</option>
              <option value="google">Google</option>
              <option value="microsoft">Microsoft</option>
              <option value="okta">Okta</option>
              <option value="saml">SAML</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
            <input
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Enter your client ID"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
            <input
              type="password"
              value={formData.clientSecret}
              onChange={(e) => setFormData({...formData, clientSecret: e.target.value})}
              className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Enter your client secret"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={formData.enabled}
              onChange={(e) => setFormData({...formData, enabled: e.target.checked})}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="enabled" className="ml-2 text-sm text-gray-700">
              Enable this SSO provider
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Current SSO Integrations</h2>
        
        {integrations.length > 0 ? (
          <div className="space-y-4">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium capitalize">{integration.provider}</h3>
                  <p className="text-sm text-gray-500">Client ID: {integration.clientId}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={integration.enabled}
                      onChange={(e) => handleToggle(integration.id, e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {integration.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleTest(integration.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No SSO integrations configured yet.</p>
        )}
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useWhiteLabel } from '@/hooks/useWhiteLabel';
import { useTheme } from '@/context/ThemeContext';

export default function WhiteLabelSettingsPage() {
  const { updateTheme, setupDomain, verifyDomain, getDomainConfig, deleteDomain, loading } = useWhiteLabel();
  const { theme, refreshTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    logoUrl: '',
    faviconUrl: '',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    fontFamily: 'Inter, sans-serif',
    headerText: 'Supply Chain Control',
    footerText: 'Powered by Supply Chain AI',
    removedBranding: false,
    customHelpCenterUrl: '',
  });

  const [domain, setDomain] = useState('');
  const [domainConfig, setDomainConfig] = useState<{ domain: string; status: string; verifiedAt?: string; expiresAt?: string; cnameRecord?: { host: string; value: string; type: string } } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDomainConfig = async () => {
    try {
      const config = await getDomainConfig();
      setDomainConfig(config);
    } catch {
      // No domain configured
    }
  };

  useEffect(() => {
    if (theme) {
      setFormData({
        logoUrl: theme.logoUrl || '',
        faviconUrl: theme.faviconUrl || '',
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        fontFamily: theme.fontFamily,
        headerText: theme.headerText,
        footerText: theme.footerText,
        removedBranding: theme.removedBranding,
        customHelpCenterUrl: theme.customHelpCenterUrl || '',
      });
    }
    loadDomainConfig();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await updateTheme(formData);
      await refreshTheme();
      setSuccess('White-label configuration updated successfully!');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  const handleSetupDomain = async () => {
    setError(null);
    setSuccess(null);

    try {
      const result = await setupDomain(domain);
      setDomainConfig(result);
      setSuccess('Domain setup initiated! Please add the CNAME record to your DNS provider.');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  const handleVerifyDomain = async () => {
    setError(null);
    setSuccess(null);

    try {
      const result = await verifyDomain();
      setDomainConfig(result);
      setSuccess('Domain verified successfully! SSL certificate has been provisioned.');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  const handleDeleteDomain = async () => {
    if (!confirm('Are you sure you want to remove your custom domain?')) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await deleteDomain();
      setDomainConfig(null);
      setDomain('');
      setSuccess('Custom domain removed successfully');
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">White-Label Configuration</h1>
        <p className="text-gray-600 mt-2">
          Customize the look and feel of your Supply Chain Control Assistant
        </p>
        <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded inline-block">
          Enterprise Feature
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Configuration */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Theme Customization</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">PNG or SVG, max 2MB</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Favicon URL
              </label>
              <input
                type="url"
                value={formData.faviconUrl}
                onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                placeholder="https://example.com/favicon.ico"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-10 w-20"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="h-10 w-20"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Family
              </label>
              <select
                value={formData.fontFamily}
                onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Inter, sans-serif">Inter</option>
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="Open Sans, sans-serif">Open Sans</option>
                <option value="Lato, sans-serif">Lato</option>
                <option value="Montserrat, sans-serif">Montserrat</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Header Text (max 50 chars)
              </label>
              <input
                type="text"
                value={formData.headerText}
                onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                maxLength={50}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Footer Text (max 200 chars)
              </label>
              <textarea
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custom Help Center URL
              </label>
              <input
                type="url"
                value={formData.customHelpCenterUrl}
                onChange={(e) => setFormData({ ...formData, customHelpCenterUrl: e.target.value })}
                placeholder="https://help.yourcompany.com"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="removedBranding"
                checked={formData.removedBranding}
                onChange={(e) => setFormData({ ...formData, removedBranding: e.target.checked })}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="removedBranding" className="ml-2 text-sm text-gray-700">
                Remove &quot;Powered by&quot; branding
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Theme Configuration'}
            </button>
          </form>
        </div>

        {/* Custom Domain Configuration */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Custom Domain</h2>
            
            {!domainConfig ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Setup a custom domain for your white-labeled instance (e.g., supply.yourcompany.com)
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Domain
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="supply.yourcompany.com"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <button
                  onClick={handleSetupDomain}
                  disabled={loading || !domain}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Setup Custom Domain
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Domain:</p>
                  <p className="text-lg">{domainConfig.domain}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Status:</p>
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    domainConfig.status === 'active' ? 'bg-green-100 text-green-800' :
                    domainConfig.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {domainConfig.status.toUpperCase()}
                  </span>
                </div>

                {domainConfig.status === 'pending' && (
                  <>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-2">
                        Add this CNAME record to your DNS provider:
                      </p>
                      <div className="bg-white p-3 rounded font-mono text-sm">
                        <div><strong>Type:</strong> CNAME</div>
                        <div><strong>Host:</strong> {domainConfig.cnameRecord?.host}</div>
                        <div><strong>Value:</strong> {domainConfig.cnameRecord?.value}</div>
                      </div>
                    </div>

                    <button
                      onClick={handleVerifyDomain}
                      disabled={loading}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Verify Domain
                    </button>
                  </>
                )}

                {domainConfig.verifiedAt && (
                  <div>
                    <p className="text-sm text-gray-600">
                      Verified on {new Date(domainConfig.verifiedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleDeleteDomain}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Remove Custom Domain
                </button>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="border rounded-lg p-4 space-y-3">
              {formData.logoUrl && (
                <Image src={formData.logoUrl} alt="Logo Preview" className="h-12" width={200} height={48} style={{ objectFit: 'contain' }} />
              )}
              <div>
                <h3 className="font-semibold" style={{ color: formData.primaryColor, fontFamily: formData.fontFamily }}>
                  {formData.headerText}
                </h3>
              </div>
              <button
                className="px-4 py-2 rounded text-white"
                style={{ backgroundColor: formData.primaryColor }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded text-white ml-2"
                style={{ backgroundColor: formData.secondaryColor }}
              >
                Secondary Button
              </button>
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600" style={{ fontFamily: formData.fontFamily }}>
                  {formData.footerText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

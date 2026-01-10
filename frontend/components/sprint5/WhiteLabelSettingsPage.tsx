'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ColorPicker } from '@/components/ui/color-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Upload, Eye, Save } from 'lucide-react';
import { WhiteLabelSettings } from '@/types/sprint5';
import { sprint5API } from '@/services/sprint5';

interface WhiteLabelSettingsProps {
  companyId: string;
  isManager: boolean;
}

export function WhiteLabelSettingsPage({ companyId, isManager }: WhiteLabelSettingsProps) {
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    enabled: false,
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    hideSupplyChainBranding: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [companyId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await sprint5API.getWhiteLabelSettings(companyId);
      setSettings(data);
    } catch (err) {
      setError('Failed to load white-label settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      await sprint5API.updateWhiteLabelSettings(companyId, settings);
      setSuccess('Settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const logoUrl = await sprint5API.uploadLogo(companyId, file);
        setSettings(prev => ({ ...prev, logoUrl }));
        setSuccess('Logo uploaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to upload logo');
      }
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setError(null);
        const faviconUrl = await sprint5API.uploadFavicon(companyId, file);
        setSettings(prev => ({ ...prev, faviconUrl }));
        setSuccess('Favicon uploaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to upload favicon');
      }
    }
  };

  const validateDomain = async () => {
    if (!settings.customDomain) return;
    
    try {
      const result = await sprint5API.validateCustomDomain(settings.customDomain);
      if (!result.available) {
        setError(`Domain "${settings.customDomain}" is already taken`);
      } else {
        setSuccess(`Domain "${settings.customDomain}" is available`);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to validate domain');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isManager) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertDescription>
              Only managers can access white-label settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">White-Label Settings</h1>
        <p className="text-muted-foreground">
          Customize your company's branding and appearance
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Enable White-Labeling</CardTitle>
          <CardDescription>
            Turn on white-labeling to customize your company's branding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="whitelabel-enabled"
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
            />
            <Label htmlFor="whitelabel-enabled">Enable White-Labeling</Label>
          </div>
        </CardContent>
      </Card>

      {settings.enabled && (
        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="domain">Custom Domain</TabsTrigger>
            <TabsTrigger value="legal">Legal Links</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Company Branding</CardTitle>
                <CardDescription>
                  Upload your company logo and favicon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center space-x-4">
                    {settings.logoUrl && (
                      <img 
                        src={settings.logoUrl} 
                        alt="Company Logo" 
                        className="h-12 w-12 object-contain border rounded"
                      />
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="w-64"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, JPG up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex items-center space-x-4">
                    {settings.faviconUrl && (
                      <img 
                        src={settings.faviconUrl} 
                        alt="Favicon" 
                        className="h-8 w-8 object-contain border rounded"
                      />
                    )}
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleFaviconUpload}
                        className="w-64"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        PNG, ICO up to 2MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hide-branding"
                    checked={settings.hideSupplyChainBranding}
                    onCheckedChange={(hide) => setSettings(prev => ({ ...prev, hideSupplyChainBranding: hide }))}
                  />
                  <Label htmlFor="hide-branding">
                    Hide Supply Chain AI branding
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footer-text">Custom Footer Text</Label>
                  <Textarea
                    id="footer-text"
                    value={settings.customFooterText || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, customFooterText: e.target.value }))}
                    placeholder="Enter custom footer text..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="colors">
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>
                  Customize the primary and secondary colors for your brand
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 border rounded"
                      style={{ backgroundColor: settings.primaryColor }}
                    />
                    <Input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      placeholder="#3B82F6"
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-12 h-12 border rounded"
                      style={{ backgroundColor: settings.secondaryColor }}
                    />
                    <Input
                      type="color"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-20"
                    />
                    <Input
                      type="text"
                      value={settings.secondaryColor}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      placeholder="#1E40AF"
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Color Preview</h4>
                  <div className="flex space-x-4">
                    <div 
                      className="px-4 py-2 rounded text-white text-sm"
                      style={{ backgroundColor: settings.primaryColor }}
                    >
                      Primary
                    </div>
                    <div 
                      className="px-4 py-2 rounded text-white text-sm"
                      style={{ backgroundColor: settings.secondaryColor }}
                    >
                      Secondary
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domain">
            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>
                  Set up a custom domain for your white-labeled application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-domain">Custom Domain</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="custom-domain"
                      type="text"
                      value={settings.customDomain || ''}
                      onChange={(e) => setSettings(prev => ({ ...prev, customDomain: e.target.value }))}
                      placeholder="app.yourcompany.com"
                      className="flex-1"
                    />
                    <Button onClick={validateDomain} variant="outline">
                      Validate
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    DNS records will need to be configured to point to our servers
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legal">
            <Card>
              <CardHeader>
                <CardTitle>Legal Links</CardTitle>
                <CardDescription>
                  Configure links to your company's legal documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="terms-url">Terms of Service URL</Label>
                  <Input
                    id="terms-url"
                    type="url"
                    value={settings.termsOfServiceUrl || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, termsOfServiceUrl: e.target.value }))}
                    placeholder="https://yourcompany.com/terms"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy-url">Privacy Policy URL</Label>
                  <Input
                    id="privacy-url"
                    type="url"
                    value={settings.privacyPolicyUrl || ''}
                    onChange={(e) => setSettings(prev => ({ ...prev, privacyPolicyUrl: e.target.value }))}
                    placeholder="https://yourcompany.com/privacy"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  Preview how your white-labeled application will look
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-center space-x-4">
                    {settings.logoUrl && (
                      <img 
                        src={settings.logoUrl} 
                        alt="Company Logo" 
                        className="h-8 w-auto"
                      />
                    )}
                    <h3 className="text-lg font-semibold">Your Company</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div 
                      className="h-2 rounded"
                      style={{ backgroundColor: settings.primaryColor, width: '60%' }}
                    />
                    <div 
                      className="h-2 rounded"
                      style={{ backgroundColor: settings.secondaryColor, width: '40%' }}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      style={{ backgroundColor: settings.primaryColor }}
                      className="text-white"
                    >
                      Primary Action
                    </Button>
                    <Button 
                      variant="outline"
                      style={{ borderColor: settings.secondaryColor, color: settings.secondaryColor }}
                    >
                      Secondary
                    </Button>
                  </div>
                  
                  {settings.customFooterText && (
                    <p className="text-sm text-muted-foreground border-t pt-4">
                      {settings.customFooterText}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="flex justify-end space-x-2">
        <Button onClick={handleSave} disabled={saving || !isManager}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
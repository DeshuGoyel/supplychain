'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Settings, CheckCircle, XCircle, Eye } from 'lucide-react';
import { SSOProvider, SSOStatus } from '@/types/sprint5';
import { sprint5API } from '@/services/sprint5';

interface SSOConfigurationProps {
  companyId: string;
  isManager: boolean;
}

export function SSOConfiguration({ companyId, isManager }: SSOConfigurationProps) {
  const [status, setStatus] = useState<SSOStatus | null>(null);
  const [providers, setProviders] = useState<SSOProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<{ [key: string]: boolean }>({});

  // Configuration state for each provider
  const [configs, setConfigs] = useState<{
    [key: string]: {
      clientId: string;
      clientSecret: string;
      enabled: boolean;
    }
  }>({});

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statusData, providersData] = await Promise.all([
        sprint5API.getSSOStatus(companyId),
        sprint5API.getAvailableSSOProviders()
      ]);
      setStatus(statusData);
      setProviders(providersData);
      
      // Initialize configs from status
      const initialConfigs: any = {};
      Object.keys(statusData).forEach(provider => {
        initialConfigs[provider] = {
          clientId: statusData[provider as keyof SSOStatus].clientId || '',
          clientSecret: '',
          enabled: statusData[provider as keyof SSOStatus].enabled || false
        };
      });
      setConfigs(initialConfigs);
    } catch (err) {
      setError('Failed to load SSO configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (provider: string, field: string, value: string | boolean) => {
    setConfigs(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const saveConfiguration = async (provider: string) => {
    if (!configs[provider]) return;

    try {
      setConfiguring(provider);
      setError(null);
      
      await sprint5API.configureSSO(
        companyId,
        provider,
        configs[provider].clientId,
        configs[provider].clientSecret,
        configs[provider].enabled
      );
      
      setSuccess(`${provider.charAt(0).toUpperCase() + provider.slice(1)} SSO configuration saved`);
      await loadData(); // Reload to get updated status
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to save ${provider} configuration`);
    } finally {
      setConfiguring(null);
    }
  };

  const testConnection = async (provider: string) => {
    try {
      setTesting(provider);
      setError(null);
      await sprint5API.testSSOConnection(companyId, provider);
      setSuccess(`${provider.charAt(0).toUpperCase() + provider.slice(1)} connection test successful`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to test ${provider} connection`);
    } finally {
      setTesting(null);
    }
  };

  const disableSSO = async (provider: string) => {
    if (!confirm(`Are you sure you want to disable ${provider} SSO?`)) return;

    try {
      await sprint5API.disableSSO(companyId, provider);
      setSuccess(`${provider.charAt(0).toUpperCase() + provider.slice(1)} SSO disabled`);
      await loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to disable ${provider} SSO`);
    }
  };

  const toggleSecret = (provider: string) => {
    setShowSecret(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
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
              Only managers can access SSO configuration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">SSO Configuration</h1>
        <p className="text-muted-foreground">
          Configure Single Sign-On providers for your organization
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

      <div className="grid gap-6">
        {providers.map((provider) => {
          const providerStatus = status?.[provider.id as keyof SSOStatus] as any;
          const config = configs[provider.id] || { clientId: '', clientSecret: '', enabled: false };
          
          return (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      {provider.id === 'google' && 'G'}
                      {provider.id === 'microsoft' && 'M'}
                      {provider.id === 'saml' && 'S'}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {providerStatus?.enabled && (
                      <Badge variant="secondary" className="text-green-700 bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Enabled
                      </Badge>
                    )}
                    {providerStatus?.configured && !providerStatus?.enabled && (
                      <Badge variant="outline">
                        <Settings className="w-3 h-3 mr-1" />
                        Configured
                      </Badge>
                    )}
                    {!providerStatus?.configured && (
                      <Badge variant="outline" className="text-gray-500">
                        <XCircle className="w-3 h-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={`enable-${provider.id}`}>Enable {provider.name} SSO</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow users to sign in with {provider.name}
                      </p>
                    </div>
                    <Switch
                      id={`enable-${provider.id}`}
                      checked={config.enabled}
                      onCheckedChange={(enabled) => handleConfigChange(provider.id, 'enabled', enabled)}
                    />
                  </div>

                  {provider.configured && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label>Client ID</Label>
                        <Input value={providerStatus?.clientId || ''} readOnly />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => testConnection(provider.id)}
                          disabled={testing === provider.id || !config.enabled}
                          variant="outline"
                          size="sm"
                        >
                          {testing === provider.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="mr-2 h-4 w-4" />
                          )}
                          Test Connection
                        </Button>
                        
                        <Button 
                          onClick={() => disableSSO(provider.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Disable
                        </Button>
                      </div>
                    </div>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        {provider.configured ? 'Update Configuration' : 'Configure'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Configure {provider.name} SSO</DialogTitle>
                        <DialogDescription>
                          Set up {provider.name} single sign-on for your organization
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        {provider.id === 'google' && (
                          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                            <p className="font-medium">Setup Instructions:</p>
                            <ol className="list-decimal list-inside space-y-1 mt-2">
                              <li>Go to Google Cloud Console</li>
                              <li>Create a new project or select existing</li>
                              <li>Enable Google+ API</li>
                              <li>Create OAuth 2.0 credentials</li>
                              <li>Set redirect URI to: <code className="bg-gray-100 px-1 rounded">http://localhost:3001/api/auth/sso/google/callback</code></li>
                            </ol>
                          </div>
                        )}
                        
                        {provider.id === 'microsoft' && (
                          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                            <p className="font-medium">Setup Instructions:</p>
                            <ol className="list-decimal list-inside space-y-1 mt-2">
                              <li>Go to Azure Portal</li>
                              <li>Navigate to Azure Active Directory</li>
                              <li>Register a new application</li>
                              <li>Add redirect URI: <code className="bg-gray-100 px-1 rounded">http://localhost:3001/api/auth/sso/microsoft/callback</code></li>
                              <li>Generate client secret</li>
                            </ol>
                          </div>
                        )}
                        
                        {provider.id === 'saml' && (
                          <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded">
                            <p className="font-medium">Setup Instructions:</p>
                            <ol className="list-decimal list-inside space-y-1 mt-2">
                              <li>Provide metadata from your IdP</li>
                              <li>Configure assertion consumer service URL</li>
                              <li>Set up attribute mapping</li>
                              <li>Test the integration</li>
                            </ol>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label htmlFor={`clientId-${provider.id}`}>Client ID</Label>
                          <Input
                            id={`clientId-${provider.id}`}
                            value={config.clientId}
                            onChange={(e) => handleConfigChange(provider.id, 'clientId', e.target.value)}
                            placeholder="Enter client ID"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`clientSecret-${provider.id}`}>Client Secret</Label>
                          <div className="flex space-x-2">
                            <Input
                              id={`clientSecret-${provider.id}`}
                              type={showSecret[provider.id] ? 'text' : 'password'}
                              value={config.clientSecret}
                              onChange={(e) => handleConfigChange(provider.id, 'clientSecret', e.target.value)}
                              placeholder="Enter client secret"
                              className="flex-1"
                            />
                            <Button 
                              type="button"
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleSecret(provider.id)}
                            >
                              {showSecret[provider.id] ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`enable-config-${provider.id}`}
                            checked={config.enabled}
                            onCheckedChange={(enabled) => handleConfigChange(provider.id, 'enabled', enabled)}
                          />
                          <Label htmlFor={`enable-config-${provider.id}`}>Enable {provider.name} SSO</Label>
                        </div>
                        
                        <Button 
                          onClick={() => saveConfiguration(provider.id)}
                          disabled={configuring === provider.id || !config.clientId || !config.clientSecret}
                          className="w-full"
                        >
                          {configuring === provider.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Save Configuration
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
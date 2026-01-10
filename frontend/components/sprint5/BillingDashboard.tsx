'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Download, CreditCard, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { SubscriptionStatus, Invoice, UsageStats } from '@/types/sprint5';
import { sprint5API } from '@/services/sprint5';

interface BillingDashboardProps {
  companyId: string;
  isManager: boolean;
}

export function BillingDashboard({ companyId, isManager }: BillingDashboardProps) {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState({
    billingEmail: '',
    billingAddress: '',
    taxId: ''
  });

  useEffect(() => {
    loadBillingData();
  }, [companyId]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [subscriptionData, invoicesData, usageData] = await Promise.all([
        sprint5API.getSubscriptionStatus(companyId),
        sprint5API.getInvoices(companyId),
        sprint5API.getUsageStats(companyId)
      ]);
      
      setSubscription(subscriptionData);
      setInvoices(invoicesData.localInvoices || []);
      setUsage(usageData);
      
      // Set billing info if available
      if (subscriptionData) {
        setBillingInfo({
          billingEmail: subscriptionData.billingEmail || '',
          billingAddress: subscriptionData.billingAddress || '',
          taxId: subscriptionData.taxId || ''
        });
      }
    } catch (err) {
      setError('Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      setProcessing(plan);
      setError(null);
      
      const priceId = plan === 'growth' ? 'price_growth' : 'price_enterprise';
      const session = await sprint5API.createCheckoutSession(companyId, priceId);
      
      window.location.href = session.url;
    } catch (err) {
      setError('Failed to start upgrade process');
      setProcessing(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing('cancel');
      await sprint5API.cancelSubscription(companyId);
      setSuccess('Subscription cancelled successfully');
      await loadBillingData();
    } catch (err) {
      setError('Failed to cancel subscription');
    } finally {
      setProcessing(null);
    }
  };

  const updateBillingInfo = async () => {
    try {
      await sprint5API.updateBillingInfo(companyId, billingInfo);
      setSuccess('Billing information updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update billing information');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
              Only managers can access billing settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Trial Warning */}
      {subscription?.trialStatus?.active && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your trial ends in {subscription.trialStatus.daysRemaining} days. 
            <Button variant="link" className="p-0 h-auto ml-1" onClick={() => handleUpgrade('growth')}>
              Upgrade now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="subscription" className="space-y-4">
        <TabsList>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing Info</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
                <CardDescription>
                  Your current plan and billing details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold capitalize">{subscription?.tier} Plan</h3>
                    <p className="text-muted-foreground">
                      Status: <Badge variant={subscription?.status === 'active' ? 'default' : 'secondary'}>
                        {subscription?.status}
                      </Badge>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${subscription?.tier === 'starter' ? '29' : subscription?.tier === 'growth' ? '99' : '299'}
                      <span className="text-sm text-muted-foreground">/month</span>
                    </p>
                  </div>
                </div>

                {subscription?.nextBillingDate && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Next billing date: {formatDate(subscription.nextBillingDate)}</span>
                  </div>
                )}

                {subscription?.trialStatus?.active && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Trial ends in {subscription.trialStatus.daysRemaining} days
                    </p>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  {subscription?.tier !== 'enterprise' && (
                    <Button 
                      onClick={() => handleUpgrade(subscription?.tier === 'starter' ? 'growth' : 'enterprise')}
                      disabled={processing !== null}
                    >
                      {processing === 'growth' || processing === 'enterprise' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Upgrade Plan
                    </Button>
                  )}
                  
                  {subscription?.status === 'active' && (
                    <Button variant="outline" onClick={handleCancelSubscription} disabled={processing === 'cancel'}>
                      {processing === 'cancel' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Available Plans</CardTitle>
                <CardDescription>
                  Compare plans and upgrade your subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={`p-4 border rounded-lg ${subscription?.tier === 'starter' ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <h4 className="font-semibold mb-2">Starter</h4>
                    <p className="text-2xl font-bold mb-2">$29<span className="text-sm text-muted-foreground">/mo</span></p>
                    <ul className="text-sm space-y-1 mb-4">
                      <li>• Up to 5 users</li>
                      <li>• 10K API calls/month</li>
                      <li>• 10GB storage</li>
                    </ul>
                    {subscription?.tier !== 'starter' && (
                      <Button variant="outline" size="sm" onClick={() => handleUpgrade('starter')} disabled={processing !== null}>
                        Downgrade
                      </Button>
                    )}
                  </div>

                  <div className={`p-4 border rounded-lg ${subscription?.tier === 'growth' ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <h4 className="font-semibold mb-2">Growth</h4>
                    <p className="text-2xl font-bold mb-2">$99<span className="text-sm text-muted-foreground">/mo</span></p>
                    <ul className="text-sm space-y-1 mb-4">
                      <li>• Up to 25 users</li>
                      <li>• 100K API calls/month</li>
                      <li>• 100GB storage</li>
                    </ul>
                    {subscription?.tier !== 'growth' && (
                      <Button size="sm" onClick={() => handleUpgrade('growth')} disabled={processing !== null}>
                        Upgrade
                      </Button>
                    )}
                  </div>

                  <div className={`p-4 border rounded-lg ${subscription?.tier === 'enterprise' ? 'border-blue-500 bg-blue-50' : ''}`}>
                    <h4 className="font-semibold mb-2">Enterprise</h4>
                    <p className="text-2xl font-bold mb-2">$299<span className="text-sm text-muted-foreground">/mo</span></p>
                    <ul className="text-sm space-y-1 mb-4">
                      <li>• Unlimited users</li>
                      <li>• Unlimited API calls</li>
                      <li>• Unlimited storage</li>
                    </ul>
                    {subscription?.tier !== 'enterprise' && (
                      <Button size="sm" onClick={() => handleUpgrade('enterprise')} disabled={processing !== null}>
                        Upgrade
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoice History</CardTitle>
              <CardDescription>
                View and download your past invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No invoices found</p>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Invoice #{invoice.id.slice(-8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(invoice.issuedAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(invoice.amount)}</p>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Track your current usage against plan limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usage && (
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Users</span>
                      <span>{usage.currentUsage.users} / {usage.limits.users === -1 ? 'Unlimited' : usage.limits.users}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(usage.usagePercentages.users, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>API Calls</span>
                      <span>{usage.currentUsage.apiCalls.toLocaleString()} / {usage.limits.apiCalls === -1 ? 'Unlimited' : usage.limits.apiCalls.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(usage.usagePercentages.apiCalls, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Storage</span>
                      <span>{usage.currentUsage.storageUsed}GB / {usage.limits.storageGb === -1 ? 'Unlimited' : `${usage.limits.storageGb}GB`}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(usage.usagePercentages.storageGb, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Update your billing address and payment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="billing-email">Billing Email</Label>
                <Input
                  id="billing-email"
                  type="email"
                  value={billingInfo.billingEmail}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, billingEmail: e.target.value }))}
                  placeholder="billing@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="billing-address">Billing Address</Label>
                <Input
                  id="billing-address"
                  value={billingInfo.billingAddress}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, billingAddress: e.target.value }))}
                  placeholder="123 Main St, City, State 12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax-id">Tax ID (Optional)</Label>
                <Input
                  id="tax-id"
                  value={billingInfo.taxId}
                  onChange={(e) => setBillingInfo(prev => ({ ...prev, taxId: e.target.value }))}
                  placeholder="123-45-6789"
                />
              </div>

              <Button onClick={updateBillingInfo}>
                Update Billing Information
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Star, Zap, Crown, Loader2 } from 'lucide-react';
import { Plan } from '@/types/sprint5';
import { sprint5API } from '@/services/sprint5';

interface PricingPageProps {
  companyId?: string;
  currentTier?: string;
  onPlanSelect?: (plan: Plan) => void;
}

export function PricingPage({ companyId, currentTier, onPlanSelect }: PricingPageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await sprint5API.getPlans();
      setPlans(data);
    } catch (err) {
      setError('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (plan: Plan) => {
    if (!companyId) {
      // Redirect to login/signup if not authenticated
      window.location.href = '/auth/login';
      return;
    }

    try {
      setProcessingPlan(plan.id);
      setError(null);

      const priceId = billingCycle === 'monthly' ? plan.stripePriceId : `${plan.stripePriceId}_yearly`;
      const session = await sprint5API.createCheckoutSession(companyId, priceId, billingCycle);
      
      // Redirect to Stripe Checkout
      window.location.href = session.url;
    } catch (err) {
      setError('Failed to start checkout process');
      setProcessingPlan(null);
    }
  };

  const getIcon = (tier: string) => {
    switch (tier) {
      case 'starter':
        return <Star className="h-6 w-6" />;
      case 'growth':
        return <Zap className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const getPrice = (plan: Plan) => {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    const yearlyDiscount = Math.round((1 - (plan.yearlyPrice / (plan.monthlyPrice * 12))) * 100);
    
    return {
      amount: price,
      period: billingCycle,
      yearlyDiscount: yearlyDiscount > 0 ? yearlyDiscount : null
    };
  };

  const isCurrentPlan = (plan: Plan) => {
    return currentTier === plan.tier;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your supply chain management needs
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4 bg-white p-1 rounded-lg shadow-sm">
            <span className={`px-3 py-1 text-sm ${billingCycle === 'monthly' ? 'bg-blue-600 text-white rounded-md' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span className={`px-3 py-1 text-sm ${billingCycle === 'yearly' ? 'bg-blue-600 text-white rounded-md' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                Save up to 20%
              </Badge>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const pricing = getPrice(plan);
            const isCurrent = isCurrentPlan(plan);
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${plan.tier === 'growth' ? 'border-blue-500 shadow-lg scale-105' : ''} ${isCurrent ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.tier === 'growth' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    {getIcon(plan.tier)}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    {plan.tier === 'starter' && 'Perfect for small teams getting started'}
                    {plan.tier === 'growth' && 'Ideal for growing businesses'}
                    {plan.tier === 'enterprise' && 'For large organizations with advanced needs'}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">${pricing.amount}</span>
                      <span className="text-muted-foreground ml-1">
                        /{pricing.period === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    </div>
                    {pricing.yearlyDiscount && (
                      <div className="text-sm text-green-600 mt-1">
                        Save {pricing.yearlyDiscount}% with yearly billing
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm uppercase tracking-wide">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Users:</span>
                      <span>{plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>API Calls:</span>
                      <span>{plan.maxApiCalls === -1 ? 'Unlimited' : plan.maxApiCalls.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span>{plan.maxStorageGb === -1 ? 'Unlimited' : `${plan.maxStorageGb}GB`}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        variant={plan.tier === 'growth' ? 'default' : 'outline'}
                        onClick={() => handlePlanSelect(plan)}
                        disabled={processingPlan === plan.id}
                      >
                        {processingPlan === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Get Started with ${plan.name}`
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All plans include our core features with 99.9% uptime guarantee
          </p>
          <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              <span>SSL Security</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              <span>Data Backup</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-600 mr-2" />
              <span>API Access</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Questions about pricing? <Button variant="link" className="p-0 h-auto">Contact our sales team</Button>
          </p>
        </div>
      </div>
    </div>
  );
}
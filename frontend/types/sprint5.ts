export interface WhiteLabelSettings {
  enabled: boolean;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  customDomain?: string;
  hideSupplyChainBranding: boolean;
  customFooterText?: string;
  termsOfServiceUrl?: string;
  privacyPolicyUrl?: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  lastLoginAt?: Date;
  loginAttempts: number;
}

export interface SSOProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  configured: boolean;
}

export interface SSOStatus {
  google: {
    enabled: boolean;
    configured: boolean;
    clientId?: string;
  };
  microsoft: {
    enabled: boolean;
    configured: boolean;
    clientId?: string;
  };
  saml: {
    enabled: boolean;
    configured: boolean;
    clientId?: string;
  };
}

export interface Plan {
  id: string;
  stripePriceId: string;
  name: string;
  tier: 'starter' | 'growth' | 'enterprise';
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  maxUsers: number;
  maxApiCalls: number;
  maxStorageGb: number;
  isActive: boolean;
}

export interface SubscriptionStatus {
  status: string;
  tier: string;
  nextBillingDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialStart?: Date;
  trialEnd?: Date;
  trialStatus?: {
    active: boolean;
    daysRemaining: number;
    expired: boolean;
  };
  subscription?: {
    id: string;
    status: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
  };
}

export interface Invoice {
  id: string;
  stripeInvoiceId: string;
  amount: number;
  status: string;
  pdfUrl?: string;
  issuedAt: Date;
  dueDate?: Date;
  paidAt?: Date;
}

export interface Payment {
  id: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  description?: string;
  createdAt: Date;
}

export interface UsageStats {
  currentUsage: {
    users: number;
    apiCalls: number;
    storageUsed: number;
  };
  limits: {
    users: number;
    apiCalls: number;
    storageGb: number;
  };
  usagePercentages: {
    users: number;
    apiCalls: number;
    storageGb: number;
  };
}

export interface AuditLog {
  id: string;
  userId?: string;
  companyId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: string;
  timestamp: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface AuditLogStats {
  dailyLogins: Array<{
    timestamp: Date;
    _count: { id: number };
  }>;
  actionBreakdown: Array<{
    action: string;
    _count: { id: number };
  }>;
  successRate: Array<{
    success: boolean;
    _count: { id: number };
  }>;
  topUsers: Array<{
    userId?: string;
    _count: { id: number };
    user?: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  }>;
  totalEvents: number;
  period: {
    days: number;
    startDate: Date;
    endDate: Date;
  };
}

export interface UserConsent {
  id: string;
  userId: string;
  consentType: 'terms' | 'privacy' | 'cookies' | 'marketing';
  version: string;
  granted: boolean;
  timestamp: Date;
}
import axios from 'axios';
import { 
  WhiteLabelSettings, 
  TwoFactorStatus, 
  SSOProvider, 
  SSOStatus,
  Plan,
  SubscriptionStatus,
  Invoice,
  Payment,
  UsageStats,
  AuditLog,
  AuditLogStats
} from '../types/sprint5';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class Sprint5API {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // White-label API
  async getWhiteLabelSettings(companyId: string): Promise<WhiteLabelSettings> {
    const response = await axios.get(`${API_BASE_URL}/api/whitelabel/settings/${companyId}`, this.getAuthHeaders());
    return response.data.data;
  }

  async updateWhiteLabelSettings(companyId: string, settings: Partial<WhiteLabelSettings>): Promise<void> {
    await axios.put(`${API_BASE_URL}/api/whitelabel/settings/${companyId}`, settings, this.getAuthHeaders());
  }

  async uploadLogo(companyId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('logo', file);
    
    const response = await axios.post(`${API_BASE_URL}/api/whitelabel/upload-logo/${companyId}`, formData, {
      headers: {
        ...this.getAuthHeaders().headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.logoUrl;
  }

  async uploadFavicon(companyId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('favicon', file);
    
    const response = await axios.post(`${API_BASE_URL}/api/whitelabel/upload-favicon/${companyId}`, formData, {
      headers: {
        ...this.getAuthHeaders().headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.faviconUrl;
  }

  async validateCustomDomain(domain: string): Promise<{ available: boolean; domain: string }> {
    const response = await axios.post(`${API_BASE_URL}/api/whitelabel/validate-domain`, { domain });
    return response.data.data;
  }

  async getThemeByDomain(domain: string): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/api/whitelabel/theme/${domain}`);
    return response.data.data;
  }

  // 2FA API
  async enableTwoFactor(userId: string): Promise<{ qrCode: string; secret: string; backupCodes: string[] }> {
    const response = await axios.post(`${API_BASE_URL}/api/auth/2fa/enable/${userId}`, {}, this.getAuthHeaders());
    return response.data.data;
  }

  async verifyTwoFactorSetup(userId: string, token: string, backupCodes: string[]): Promise<{ backupCodes: string[] }> {
    const response = await axios.post(`${API_BASE_URL}/api/auth/2fa/verify-setup/${userId}`, { token, backupCodes }, this.getAuthHeaders());
    return response.data.data;
  }

  async verifyTwoFactorCode(userId: string, token?: string, backupCode?: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/auth/2fa/verify-code/${userId}`, { token, backupCode });
  }

  async generateBackupCodes(userId: string): Promise<{ backupCodes: string[] }> {
    const response = await axios.post(`${API_BASE_URL}/api/auth/2fa/backup-codes/${userId}`, {}, this.getAuthHeaders());
    return response.data.data;
  }

  async disableTwoFactor(userId: string, password: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/auth/2fa/disable/${userId}`, { password }, this.getAuthHeaders());
  }

  async getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
    const response = await axios.get(`${API_BASE_URL}/api/auth/2fa/status/${userId}`, this.getAuthHeaders());
    return response.data.data;
  }

  // SSO API
  async getSSOStatus(companyId: string): Promise<SSOStatus> {
    const response = await axios.get(`${API_BASE_URL}/api/sso/status/${companyId}`, this.getAuthHeaders());
    return response.data.data;
  }

  async configureSSO(companyId: string, provider: string, clientId: string, clientSecret: string, enabled: boolean): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/sso/configure/${companyId}`, {
      provider,
      clientId,
      clientSecret,
      enabled
    }, this.getAuthHeaders());
  }

  async testSSOConnection(companyId: string, provider: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/sso/test/${companyId}/${provider}`, {}, this.getAuthHeaders());
  }

  async disableSSO(companyId: string, provider: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/api/sso/disable/${companyId}/${provider}`, this.getAuthHeaders());
  }

  async getAvailableSSOProviders(): Promise<SSOProvider[]> {
    const response = await axios.get(`${API_BASE_URL}/api/sso/providers`);
    return response.data.data;
  }

  // Billing API
  async getPlans(): Promise<Plan[]> {
    const response = await axios.get(`${API_BASE_URL}/api/billing/plans`);
    return response.data.data;
  }

  async getSubscriptionStatus(companyId: string): Promise<SubscriptionStatus> {
    const response = await axios.get(`${API_BASE_URL}/api/billing/subscription/${companyId}`, this.getAuthHeaders());
    return response.data.data;
  }

  async createCheckoutSession(companyId: string, priceId: string, billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<{ sessionId: string; url: string }> {
    const response = await axios.post(`${API_BASE_URL}/api/billing/checkout/${companyId}`, {
      priceId,
      billingCycle
    }, this.getAuthHeaders());
    return response.data.data;
  }

  async getInvoices(companyId: string, limit: number = 10, offset: number = 0): Promise<{ stripeInvoices: any[]; localInvoices: Invoice[] }> {
    const response = await axios.get(`${API_BASE_URL}/api/billing/invoices/${companyId}?limit=${limit}&offset=${offset}`, this.getAuthHeaders());
    return response.data.data;
  }

  async getInvoice(companyId: string, invoiceId: string): Promise<{ invoice: Invoice; stripeInvoice: any }> {
    const response = await axios.get(`${API_BASE_URL}/api/billing/invoices/${companyId}/${invoiceId}`, this.getAuthHeaders());
    return response.data.data;
  }

  async updateBillingInfo(companyId: string, billingInfo: { billingEmail?: string; billingAddress?: string; taxId?: string }): Promise<void> {
    await axios.put(`${API_BASE_URL}/api/billing/billing-info/${companyId}`, billingInfo, this.getAuthHeaders());
  }

  async createPaymentIntent(companyId: string, amount: number, currency: string = 'usd'): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const response = await axios.post(`${API_BASE_URL}/api/billing/payment-intent/${companyId}`, {
      amount,
      currency
    }, this.getAuthHeaders());
    return response.data.data;
  }

  async cancelSubscription(companyId: string): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/billing/cancel/${companyId}`, {}, this.getAuthHeaders());
  }

  async getUsageStats(companyId: string): Promise<UsageStats> {
    const response = await axios.get(`${API_BASE_URL}/api/billing/usage/${companyId}`, this.getAuthHeaders());
    return response.data.data;
  }

  // Audit Log API
  async getAuditLogs(companyId: string, params?: {
    limit?: number;
    offset?: number;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    success?: boolean;
  }): Promise<{ logs: AuditLog[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await axios.get(`${API_BASE_URL}/api/audit-logs/${companyId}?${queryParams}`, this.getAuthHeaders());
    return response.data.data;
  }

  async getUserAuditLogs(userId: string, params?: {
    limit?: number;
    offset?: number;
    action?: string;
    startDate?: string;
    endDate?: string;
    success?: boolean;
  }): Promise<{ logs: AuditLog[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const response = await axios.get(`${API_BASE_URL}/api/audit-logs/user/${userId}?${queryParams}`, this.getAuthHeaders());
    return response.data.data;
  }

  async getAuditLogStats(companyId: string, days: number = 30): Promise<AuditLogStats> {
    const response = await axios.get(`${API_BASE_URL}/api/audit-logs/stats/${companyId}?days=${days}`, this.getAuthHeaders());
    return response.data.data;
  }

  async createAuditLog(log: {
    userId?: string;
    companyId?: string;
    action: string;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
    details?: any;
  }): Promise<void> {
    await axios.post(`${API_BASE_URL}/api/audit-logs`, log);
  }

  async cleanupOldAuditLogs(days: number = 90): Promise<{ deleted: number }> {
    const response = await axios.post(`${API_BASE_URL}/api/audit-logs/cleanup`, { days }, this.getAuthHeaders());
    return response.data;
  }
}

export const sprint5API = new Sprint5API();
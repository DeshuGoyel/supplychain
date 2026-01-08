import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export interface ThemeConfig {
  companyId: string;
  customDomain?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerText?: string;
  footerText?: string;
  removedBranding: boolean;
  customHelpCenterUrl?: string;
  status?: string;
}

export interface CustomDomainSetup {
  domain: string;
  verificationCode: string;
}

export class ThemeService {
  private static instance: ThemeService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService();
    }
    return ThemeService.instance;
  }

  async getThemeConfig(companyId: string): Promise<ThemeConfig | null> {
    const config = await this.prisma.whiteLabelConfig.findUnique({
      where: { companyId }
    });

    if (!config) {
      return null;
    }

    const themeConfig: ThemeConfig = {
      companyId: config.companyId,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      fontFamily: config.fontFamily,
      removedBranding: config.removedBranding,
      status: config.status
    };

    if (config.customDomain) themeConfig.customDomain = config.customDomain;
    if (config.logoUrl) themeConfig.logoUrl = config.logoUrl;
    if (config.faviconUrl) themeConfig.faviconUrl = config.faviconUrl;
    if (config.headerText) themeConfig.headerText = config.headerText;
    if (config.footerText) themeConfig.footerText = config.footerText;
    if (config.customHelpCenterUrl) themeConfig.customHelpCenterUrl = config.customHelpCenterUrl;

    return themeConfig;
  }

  async updateThemeConfig(companyId: string, config: Partial<ThemeConfig>): Promise<ThemeConfig> {
    const existing = await this.prisma.whiteLabelConfig.findUnique({
      where: { companyId }
    });

    if (existing) {
      const updateData: any = {};

      if (config.customDomain !== undefined) updateData.customDomain = config.customDomain;
      if (config.logoUrl !== undefined) updateData.logoUrl = config.logoUrl;
      if (config.faviconUrl !== undefined) updateData.faviconUrl = config.faviconUrl;
      if (config.primaryColor) updateData.primaryColor = config.primaryColor;
      if (config.secondaryColor) updateData.secondaryColor = config.secondaryColor;
      if (config.fontFamily) updateData.fontFamily = config.fontFamily;
      if (config.headerText !== undefined) updateData.headerText = config.headerText;
      if (config.footerText !== undefined) updateData.footerText = config.footerText;
      if (config.removedBranding !== undefined) updateData.removedBranding = config.removedBranding;
      if (config.customHelpCenterUrl !== undefined) updateData.customHelpCenterUrl = config.customHelpCenterUrl;
      if (config.status) updateData.status = config.status;

      const updated = await this.prisma.whiteLabelConfig.update({
        where: { companyId },
        data: updateData
      });

      const themeConfig: ThemeConfig = {
        companyId: updated.companyId,
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        fontFamily: updated.fontFamily,
        removedBranding: updated.removedBranding,
        status: updated.status
      };

      if (updated.customDomain) themeConfig.customDomain = updated.customDomain;
      if (updated.logoUrl) themeConfig.logoUrl = updated.logoUrl;
      if (updated.faviconUrl) themeConfig.faviconUrl = updated.faviconUrl;
      if (updated.headerText) themeConfig.headerText = updated.headerText;
      if (updated.footerText) themeConfig.footerText = updated.footerText;
      if (updated.customHelpCenterUrl) themeConfig.customHelpCenterUrl = updated.customHelpCenterUrl;

      return themeConfig;
    } else {
      const createData: any = {
        companyId,
        primaryColor: config.primaryColor || '#3B82F6',
        secondaryColor: config.secondaryColor || '#10B981',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
        removedBranding: config.removedBranding || false,
        status: config.status || 'active'
      };

      if (config.customDomain) createData.customDomain = config.customDomain;
      if (config.logoUrl) createData.logoUrl = config.logoUrl;
      if (config.faviconUrl) createData.faviconUrl = config.faviconUrl;
      if (config.headerText) createData.headerText = config.headerText;
      if (config.footerText) createData.footerText = config.footerText;
      if (config.customHelpCenterUrl) createData.customHelpCenterUrl = config.customHelpCenterUrl;

      const created = await this.prisma.whiteLabelConfig.create({
        data: createData
      });

      const themeConfig: ThemeConfig = {
        companyId: created.companyId,
        primaryColor: created.primaryColor,
        secondaryColor: created.secondaryColor,
        fontFamily: created.fontFamily,
        removedBranding: created.removedBranding,
        status: created.status
      };

      if (created.customDomain) themeConfig.customDomain = created.customDomain;
      if (created.logoUrl) themeConfig.logoUrl = created.logoUrl;
      if (created.faviconUrl) themeConfig.faviconUrl = created.faviconUrl;
      if (created.headerText) themeConfig.headerText = created.headerText;
      if (created.footerText) themeConfig.footerText = created.footerText;
      if (created.customHelpCenterUrl) themeConfig.customHelpCenterUrl = created.customHelpCenterUrl;

      return themeConfig;
    }
  }

  validateDomain(domain: string): { valid: boolean; error?: string } {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;

    if (!domain) {
      return { valid: false, error: 'Domain is required' };
    }

    if (!domainRegex.test(domain)) {
      return { valid: false, error: 'Invalid domain format' };
    }

    if (domain.length > 253) {
      return { valid: false, error: 'Domain is too long (max 253 characters)' };
    }

    const labels = domain.split('.');
    for (const label of labels) {
      if (label.length > 63) {
        return { valid: false, error: 'Domain label is too long (max 63 characters)' };
      }
    }

    return { valid: true };
  }

  async setupCustomDomain(companyId: string, domain: string): Promise<CustomDomainSetup> {
    const validation = this.validateDomain(domain);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const existingDomain = await this.prisma.customDomainConfig.findUnique({
      where: { domain }
    });

    if (existingDomain) {
      throw new Error('Domain is already in use');
    }

    const verificationCode = crypto.randomBytes(16).toString('hex');

    await this.prisma.customDomainConfig.create({
      data: {
        companyId,
        domain,
        status: 'pending',
        verificationCode,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });

    return {
      domain,
      verificationCode
    };
  }

  async getDomainConfig(companyId: string) {
    return this.prisma.customDomainConfig.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async verifyDomain(companyId: string, domain: string): Promise<{ verified: boolean; sslCertificate?: string }> {
    const domainConfig = await this.prisma.customDomainConfig.findUnique({
      where: { domain }
    });

    if (!domainConfig || domainConfig.companyId !== companyId) {
      throw new Error('Domain not found');
    }

    // In production, this would verify DNS CNAME record
    // For now, we'll simulate verification
    const verified = true;

    if (verified) {
      const sslCertificate = await this.provisionSSLCertificate(domain);

      await this.prisma.customDomainConfig.update({
        where: { domain },
        data: {
          status: 'active',
          sslCertificate,
          verifiedAt: new Date()
        }
      });

      return { verified: true, sslCertificate };
    }

    return { verified: false };
  }

  async provisionSSLCertificate(domain: string): Promise<string> {
    // In production, this would use Let's Encrypt or similar service
    // For now, we'll simulate certificate provisioning
    const certId = crypto.randomBytes(16).toString('hex');
    return `cert-${certId}-${domain}`;
  }

  async removeCustomDomain(companyId: string, domain: string): Promise<void> {
    const domainConfig = await this.prisma.customDomainConfig.findUnique({
      where: { domain }
    });

    if (!domainConfig || domainConfig.companyId !== companyId) {
      throw new Error('Domain not found');
    }

    await this.prisma.customDomainConfig.delete({
      where: { domain }
    });
  }

  getThemeCSS(config: ThemeConfig): string {
    return `
      :root {
        --brand-primary: ${config.primaryColor};
        --brand-secondary: ${config.secondaryColor};
        --brand-font: ${config.fontFamily};
        --brand-logo: ${config.logoUrl ? `url(${config.logoUrl})` : 'none'};
      }

      body {
        font-family: ${config.fontFamily};
      }

      .brand-primary {
        color: ${config.primaryColor};
      }

      .brand-primary-bg {
        background-color: ${config.primaryColor};
      }

      .brand-secondary {
        color: ${config.secondaryColor};
      }

      .brand-secondary-bg {
        background-color: ${config.secondaryColor};
      }

      .btn-primary {
        background-color: ${config.primaryColor};
        border-color: ${config.primaryColor};
      }

      .btn-primary:hover {
        background-color: ${this.adjustBrightness(config.primaryColor, -10)};
        border-color: ${this.adjustBrightness(config.primaryColor, -10)};
      }

      .btn-secondary {
        background-color: ${config.secondaryColor};
        border-color: ${config.secondaryColor};
      }

      .btn-secondary:hover {
        background-color: ${this.adjustBrightness(config.secondaryColor, -10)};
        border-color: ${this.adjustBrightness(config.secondaryColor, -10)};
      }
    `;
  }

  private adjustBrightness(hex: string, amount: number): string {
    const color = hex.replace('#', '');
    const num = parseInt(color, 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}

export const themeService = ThemeService.getInstance();

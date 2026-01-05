import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface ThemeConfig {
  logoUrl?: string | undefined;
  faviconUrl?: string | undefined;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerText: string;
  footerText: string;
  removedBranding: boolean;
  customHelpCenterUrl?: string | undefined;
}

interface DomainValidationResult {
  valid: boolean;
  error?: string;
}

export const getThemeConfig = async (companyId: string) => {
  try {
    const config = await prisma.whiteLabelConfig.findUnique({
      where: { companyId },
      select: {
        id: true,
        customDomain: true,
        logoUrl: true,
        faviconUrl: true,
        primaryColor: true,
        secondaryColor: true,
        fontFamily: true,
        headerText: true,
        footerText: true,
        removedBranding: true,
        customHelpCenterUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return config;
  } catch (error) {
    console.error('Error fetching theme config:', error);
    throw new Error('Failed to fetch theme configuration');
  }
};

export const updateThemeConfig = async (
  companyId: string,
  config: Partial<ThemeConfig>
) => {
  try {
    // Check if company has enterprise tier
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionTier: true },
    });

    if (company?.subscriptionTier !== 'enterprise') {
      throw new Error('White-label features require enterprise tier');
    }

    // Validate logo URL size if provided
    if (config.logoUrl && config.logoUrl.length > 500) {
      throw new Error('Logo URL exceeds maximum length');
    }

    // Validate header text length
    if (config.headerText && config.headerText.length > 50) {
      throw new Error('Header text must be 50 characters or less');
    }

    // Validate footer text length
    if (config.footerText && config.footerText.length > 200) {
      throw new Error('Footer text must be 200 characters or less');
    }

    // Validate color formats
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (config.primaryColor && !hexColorRegex.test(config.primaryColor)) {
      throw new Error('Invalid primary color format. Use hex format (e.g., #3B82F6)');
    }
    if (config.secondaryColor && !hexColorRegex.test(config.secondaryColor)) {
      throw new Error('Invalid secondary color format. Use hex format (e.g., #10B981)');
    }

    // Prepare update data with proper null handling
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (config.logoUrl !== undefined) updateData.logoUrl = config.logoUrl || null;
    if (config.faviconUrl !== undefined) updateData.faviconUrl = config.faviconUrl || null;
    if (config.primaryColor !== undefined) updateData.primaryColor = config.primaryColor;
    if (config.secondaryColor !== undefined) updateData.secondaryColor = config.secondaryColor;
    if (config.fontFamily !== undefined) updateData.fontFamily = config.fontFamily;
    if (config.headerText !== undefined) updateData.headerText = config.headerText;
    if (config.footerText !== undefined) updateData.footerText = config.footerText;
    if (config.removedBranding !== undefined) updateData.removedBranding = config.removedBranding;
    if (config.customHelpCenterUrl !== undefined) updateData.customHelpCenterUrl = config.customHelpCenterUrl || null;

    // Upsert the configuration
    const updated = await prisma.whiteLabelConfig.upsert({
      where: { companyId },
      update: updateData,
      create: {
        companyId,
        logoUrl: config.logoUrl || null,
        faviconUrl: config.faviconUrl || null,
        primaryColor: config.primaryColor || '#3B82F6',
        secondaryColor: config.secondaryColor || '#10B981',
        fontFamily: config.fontFamily || 'Inter, sans-serif',
        headerText: config.headerText || 'Supply Chain Control',
        footerText: config.footerText || 'Powered by Supply Chain AI',
        removedBranding: config.removedBranding || false,
        customHelpCenterUrl: config.customHelpCenterUrl || null,
        status: 'active',
      },
    });

    return updated;
  } catch (error) {
    console.error('Error updating theme config:', error);
    throw error;
  }
};

export const validateDomain = (domain: string): DomainValidationResult => {
  // Remove protocol if present
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Basic domain validation regex
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

  if (!domainRegex.test(cleanDomain)) {
    return {
      valid: false,
      error: 'Invalid domain format',
    };
  }

  // Check for localhost or IP addresses
  if (cleanDomain.includes('localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(cleanDomain)) {
    return {
      valid: false,
      error: 'Cannot use localhost or IP addresses',
    };
  }

  return { valid: true };
};

export const generateVerificationCode = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const provisionSSLCertificate = async (domain: string): Promise<string> => {
  // In production, integrate with Let's Encrypt or similar service
  // For now, return a placeholder
  console.log(`Provisioning SSL certificate for domain: ${domain}`);
  
  // This would be replaced with actual Let's Encrypt integration
  // using acme-client or similar library
  
  return 'ssl-certificate-placeholder';
};

export const getThemeCSS = (config: ThemeConfig): string => {
  return `
:root {
  --brand-primary: ${config.primaryColor};
  --brand-secondary: ${config.secondaryColor};
  --brand-font: ${config.fontFamily};
}

.btn-primary {
  background-color: var(--brand-primary);
}

.btn-primary:hover {
  background-color: color-mix(in srgb, var(--brand-primary) 85%, black);
}

.btn-secondary {
  background-color: var(--brand-secondary);
}

.btn-secondary:hover {
  background-color: color-mix(in srgb, var(--brand-secondary) 85%, black);
}

.text-primary {
  color: var(--brand-primary);
}

.text-secondary {
  color: var(--brand-secondary);
}

.border-primary {
  border-color: var(--brand-primary);
}

body {
  font-family: var(--brand-font);
}
  `.trim();
};

export const getThemeByDomain = async (domain: string) => {
  try {
    const customDomain = await prisma.customDomainConfig.findUnique({
      where: { domain },
      include: {
        company: {
          include: {
            whiteLabelConfig: true,
          },
        },
      },
    });

    if (!customDomain || customDomain.status !== 'active') {
      return null;
    }

    return customDomain.company.whiteLabelConfig;
  } catch (error) {
    console.error('Error fetching theme by domain:', error);
    return null;
  }
};

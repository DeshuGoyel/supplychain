import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

/**
 * Fetch white-label config for company
 * GET /api/whitelabel/settings
 */
export const getWhitelabelSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;

    let settings = await prisma.whiteLabel.findUnique({
      where: { companyId }
    });

    if (!settings) {
      // Create default settings if they don't exist
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true }
      });

      settings = await prisma.whiteLabel.create({
        data: {
          companyId,
          enabled: false,
          brandName: company?.name,
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af'
        }
      });
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Get white-label settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching white-label settings'
    });
  }
};

/**
 * Update branding (MANAGER only)
 * PUT /api/whitelabel/settings
 */
export const updateWhitelabelSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId as string;
    const {
      enabled,
      brandName,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      customDomain,
      supportEmail,
      footerText,
      hideSupplyChainBranding,
      customFooterText,
      termsOfServiceUrl,
      privacyPolicyUrl
    } = req.body as Record<string, any>;

    const normalizedDomain = typeof customDomain === 'string' && customDomain ? customDomain.toLowerCase().split(':')[0] : customDomain;

    const settings = await prisma.whiteLabel.upsert({
      where: { companyId },
      update: {
        enabled,
        brandName,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        customDomain: normalizedDomain,
        supportEmail,
        footerText: footerText ?? customFooterText,
        hideSupplyChainBranding,
        customFooterText,
        termsOfServiceUrl,
        privacyPolicyUrl
      },
      create: {
        companyId,
        enabled: !!enabled,
        brandName,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        customDomain: normalizedDomain,
        supportEmail,
        footerText: footerText ?? customFooterText,
        hideSupplyChainBranding: !!hideSupplyChainBranding,
        customFooterText,
        termsOfServiceUrl,
        privacyPolicyUrl
      }
    });

    res.status(200).json({
      success: true,
      message: 'White-label settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Update white-label settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error updating white-label settings'
    });
  }
};

/**
 * Handle file upload to storage
 * POST /api/whitelabel/upload-logo
 */
export const uploadLogo = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !req.files.logo) {
      res.status(400).json({ success: false, message: 'No logo file uploaded' });
      return;
    }

    const logoFile = (req.files as any).logo;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `logo-${(req as any).user.companyId}-${Date.now()}${path.extname(logoFile.name)}`;
    const filePath = path.join(uploadDir, fileName);

    await logoFile.mv(filePath);

    const logoUrl = `/uploads/${fileName}`;

    res.status(200).json({
      success: true,
      logoUrl
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error uploading logo'
    });
  }
};

/**
 * Handle favicon upload
 * POST /api/whitelabel/upload-favicon
 */
export const uploadFavicon = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !req.files.favicon) {
      res.status(400).json({ success: false, message: 'No favicon file uploaded' });
      return;
    }

    const faviconFile = (req.files as any).favicon;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `favicon-${(req as any).user.companyId}-${Date.now()}${path.extname(faviconFile.name)}`;
    const filePath = path.join(uploadDir, fileName);

    await faviconFile.mv(filePath);

    const faviconUrl = `/uploads/${fileName}`;

    res.status(200).json({
      success: true,
      faviconUrl
    });
  } catch (error) {
    console.error('Upload favicon error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error uploading favicon'
    });
  }
};

/**
 * Check domain availability
 * POST /api/whitelabel/validate-domain
 */
export const validateCustomDomain = async (req: Request, res: Response): Promise<void> => {
  try {
    const { domain } = req.body as { domain?: unknown };
    const companyId = (req as any).user.companyId as string;

    if (typeof domain !== 'string' || !domain.trim()) {
      res.status(400).json({ success: false, message: 'Domain is required' });
      return;
    }

    const normalizedDomain = domain.trim().toLowerCase().split(':')[0] || domain;

    const existingDomain = await prisma.whiteLabel.findFirst({
      where: {
        customDomain: normalizedDomain,
        NOT: { companyId }
      }
    });

    res.status(200).json({
      success: true,
      available: !existingDomain
    });
  } catch (error) {
    console.error('Validate domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error validating domain'
    });
  }
};

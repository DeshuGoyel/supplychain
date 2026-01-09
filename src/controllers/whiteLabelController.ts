import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get white-label configuration
 * GET /api/white-label/config
 */
export const getConfig = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId = req.user.companyId;

    let config = await prisma.whiteLabelConfig.findUnique({
      where: { companyId }
    });

    if (!config) {
      config = await prisma.whiteLabelConfig.create({
        data: { companyId }
      });
    }

    res.status(200).json({
      success: true,
      config
    });
  } catch (error: any) {
    console.error('Get white-label config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get white-label config',
      error: error.message
    });
  }
};

/**
 * Update white-label configuration
 * POST /api/white-label/config
 */
export const updateConfig = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId = req.user.companyId;
    const {
      customDomain,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      customHeaderText,
      customFooterText,
      removeBranding,
      customHelpCenterUrl
    } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }

    // Check if enterprise tier (required for white-label)
    if (company.subscriptionTier !== 'enterprise') {
      res.status(403).json({
        success: false,
        message: 'White-label features require Enterprise plan'
      });
      return;
    }

    const config = await prisma.whiteLabelConfig.upsert({
      where: { companyId },
      update: {
        customDomain,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        fontFamily,
        customHeaderText,
        customFooterText,
        removeBranding,
        customHelpCenterUrl
      },
      create: {
        companyId,
        customDomain,
        logoUrl,
        faviconUrl,
        primaryColor: primaryColor || '#3B82F6',
        secondaryColor: secondaryColor || '#10B981',
        fontFamily: fontFamily || 'Inter',
        customHeaderText,
        customFooterText,
        removeBranding: removeBranding || false,
        customHelpCenterUrl
      }
    });

    res.status(200).json({
      success: true,
      config
    });
  } catch (error: any) {
    console.error('Update white-label config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update white-label config',
      error: error.message
    });
  }
};

/**
 * Get white-label config by custom domain (public, no auth)
 * GET /api/white-label/public/:domain
 */
export const getPublicConfig = async (req: any, res: Response): Promise<void> => {
  try {
    const { domain } = req.params;

    const config = await prisma.whiteLabelConfig.findFirst({
      where: { customDomain: domain }
    });

    if (!config) {
      res.status(404).json({
        success: false,
        message: 'No white-label config found for this domain'
      });
      return;
    }

    // Return only public information
    res.status(200).json({
      success: true,
      config: {
        logoUrl: config.logoUrl,
        faviconUrl: config.faviconUrl,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        fontFamily: config.fontFamily,
        customHeaderText: config.customHeaderText,
        customFooterText: config.customFooterText,
        removeBranding: config.removeBranding
      }
    });
  } catch (error: any) {
    console.error('Get public white-label config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get white-label config',
      error: error.message
    });
  }
};

/**
 * Set custom domain
 * POST /api/white-label/domain
 */
export const setCustomDomain = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId: string = req.user.companyId;
    const { domain } = req.body;

    if (!domain) {
      res.status(400).json({ success: false, message: 'Domain is required' });
      return;
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      res.status(404).json({ success: false, message: 'Company not found' });
      return;
    }

    if (company.subscriptionTier !== 'enterprise') {
      res.status(403).json({ success: false, message: 'Custom domains require Enterprise plan' });
      return;
    }

    const config = await prisma.whiteLabelConfig.upsert({
      where: { companyId },
      update: { customDomain: domain },
      create: { companyId, customDomain: domain }
    });

    res.status(200).json({ success: true, config });
  } catch (error: any) {
    console.error('Set custom domain error:', error);
    res.status(500).json({ success: false, message: 'Failed to set custom domain', error: error.message });
  }
};

/**
 * Verify domain (placeholder)
 * POST /api/white-label/verify-domain
 */
export const verifyCustomDomain = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId: string = req.user.companyId;
    const config = await prisma.whiteLabelConfig.findUnique({ where: { companyId } });

    if (!config?.customDomain) {
      res.status(404).json({ success: false, message: 'No custom domain set' });
      return;
    }

    // Real verification would check DNS records and certificate readiness.
    res.status(200).json({
      success: true,
      domain: config.customDomain,
      verified: true
    });
  } catch (error: any) {
    console.error('Verify custom domain error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify domain', error: error.message });
  }
};

/**
 * Remove custom domain
 * DELETE /api/white-label/domain
 */
export const removeCustomDomain = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId: string = req.user.companyId;

    const config = await prisma.whiteLabelConfig.upsert({
      where: { companyId },
      update: { customDomain: null },
      create: { companyId }
    });

    res.status(200).json({ success: true, config });
  } catch (error: any) {
    console.error('Remove custom domain error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove domain', error: error.message });
  }
};

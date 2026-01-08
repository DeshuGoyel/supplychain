import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getWhiteLabelConfig(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (company?.subscriptionTier !== 'enterprise') {
      return res.status(403).json({ 
        error: 'White-label features are only available for Enterprise customers' 
      });
    }

    const config = await prisma.whiteLabelConfig.findUnique({
      where: { companyId },
    });

    res.json({ config: config || null });
  } catch (error: any) {
    console.error('Error fetching white-label config:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch white-label config' });
  }
}

export async function updateWhiteLabelConfig(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;
    const {
      customDomain,
      logoUrl,
      faviconUrl,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      customHeaderText,
      customFooterText,
      removeBranding,
      customHelpCenterUrl,
      customCss,
    } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (company?.subscriptionTier !== 'enterprise') {
      return res.status(403).json({ 
        error: 'White-label features are only available for Enterprise customers' 
      });
    }

    const config = await prisma.whiteLabelConfig.upsert({
      where: { companyId },
      update: {
        customDomain,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        accentColor,
        fontFamily,
        customHeaderText,
        customFooterText,
        removeBranding,
        customHelpCenterUrl,
        customCss,
      },
      create: {
        companyId,
        customDomain,
        logoUrl,
        faviconUrl,
        primaryColor: primaryColor || '#3B82F6',
        secondaryColor: secondaryColor || '#10B981',
        accentColor,
        fontFamily: fontFamily || 'Inter',
        customHeaderText,
        customFooterText,
        removeBranding: removeBranding || false,
        customHelpCenterUrl,
        customCss,
      },
    });

    res.json({ success: true, config });
  } catch (error: any) {
    console.error('Error updating white-label config:', error);
    res.status(500).json({ error: error.message || 'Failed to update white-label config' });
  }
}

export async function getPublicWhiteLabelConfig(req: Request, res: Response) {
  try {
    const { domain } = req.params;

    const config = await prisma.whiteLabelConfig.findFirst({
      where: { customDomain: domain },
    });

    if (!config) {
      return res.status(404).json({ error: 'White-label configuration not found' });
    }

    res.json({
      config: {
        logoUrl: config.logoUrl,
        faviconUrl: config.faviconUrl,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        accentColor: config.accentColor,
        fontFamily: config.fontFamily,
        customHeaderText: config.customHeaderText,
        customFooterText: config.customFooterText,
        removeBranding: config.removeBranding,
        customCss: config.customCss,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public white-label config:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch white-label config' });
  }
}

export async function verifyCustomDomain(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;
    const { domain } = req.body;

    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (company?.subscriptionTier !== 'enterprise') {
      return res.status(403).json({ 
        error: 'Custom domains are only available for Enterprise customers' 
      });
    }

    res.json({
      verified: true,
      instructions: {
        recordType: 'CNAME',
        name: domain,
        value: 'app.supplychain-ai.com',
      },
    });
  } catch (error: any) {
    console.error('Error verifying custom domain:', error);
    res.status(500).json({ error: error.message || 'Failed to verify custom domain' });
  }
}

export async function deleteCustomDomain(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;

    await prisma.whiteLabelConfig.update({
      where: { companyId },
      data: { customDomain: null },
    });

    res.json({ success: true, message: 'Custom domain removed' });
  } catch (error: any) {
    console.error('Error deleting custom domain:', error);
    res.status(500).json({ error: error.message || 'Failed to delete custom domain' });
  }
}

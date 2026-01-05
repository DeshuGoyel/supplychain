import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';
import { auditLogMiddleware, auditConfigChange } from '../middleware/auditLog';
import {
  getThemeConfig,
  updateThemeConfig,
  validateDomain,
  generateVerificationCode,
  provisionSSLCertificate,
  getThemeCSS,
  getThemeByDomain,
} from '../services/theme';

const router = express.Router();
const prisma = new PrismaClient();

// Get white-label theme configuration
router.get('/theme', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;

    const config = await getThemeConfig(companyId);

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch theme configuration';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Get theme by domain (public endpoint for white-label domains)
router.get('/theme/domain/:domain', async (req: Request, res: Response): Promise<void> => {
  try {
    const { domain } = req.params;

    if (!domain) {
      res.status(400).json({
        success: false,
        message: 'Domain is required',
      });
      return;
    }

    const config = await getThemeByDomain(domain);

    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Theme not found for this domain',
      });
      return;
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch theme';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Update white-label theme configuration
router.put(
  '/theme',
  authMiddleware,
  auditLogMiddleware('CONFIG_CHANGE', 'WhiteLabelConfig'),
  async (req: Request, res: Response) => {
    try {
      const { companyId, userId } = (req as any).user;
      const config = req.body;

      const updated = await updateThemeConfig(companyId, config);

      // Audit log
      await auditConfigChange(
        companyId,
        userId,
        'WhiteLabelConfig',
        config,
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        data: updated,
        message: 'Theme configuration updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update theme configuration';
      const statusCode = message.includes('enterprise tier') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
);

// Get theme CSS
router.get('/theme/css', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = (req as any).user;

    const config = await getThemeConfig(companyId);

    if (!config) {
      res.status(404).json({
        success: false,
        message: 'Theme configuration not found',
      });
      return;
    }

    const css = getThemeCSS({
      logoUrl: config.logoUrl || undefined,
      faviconUrl: config.faviconUrl || undefined,
      primaryColor: config.primaryColor,
      secondaryColor: config.secondaryColor,
      fontFamily: config.fontFamily,
      headerText: config.headerText,
      footerText: config.footerText,
      removedBranding: config.removedBranding,
      customHelpCenterUrl: config.customHelpCenterUrl || undefined,
    });

    res.setHeader('Content-Type', 'text/css');
    res.send(css);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate CSS';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Setup custom domain
router.post(
  '/domain',
  authMiddleware,
  auditLogMiddleware('CREATE', 'CustomDomain'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId, userId } = (req as any).user;
      const { domain } = req.body;

      if (!domain) {
        res.status(400).json({
          success: false,
          message: 'Domain is required',
        });
        return;
      }

      // Check enterprise tier
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { subscriptionTier: true },
      });

      if (company?.subscriptionTier !== 'enterprise') {
        res.status(403).json({
          success: false,
          message: 'Custom domains require enterprise tier',
        });
        return;
      }

      // Validate domain
      const validation = validateDomain(domain);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: validation.error || 'Invalid domain',
        });
        return;
      }

      // Clean domain
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

      // Generate verification code
      const verificationCode = generateVerificationCode();

      // Create domain config
      const domainConfig = await prisma.customDomainConfig.upsert({
        where: { companyId },
        update: {
          domain: cleanDomain,
          status: 'pending',
          verificationCode,
          updatedAt: new Date(),
        },
        create: {
          companyId,
          domain: cleanDomain,
          status: 'pending',
          verificationCode,
        },
      });

      // Audit log
      await auditConfigChange(
        companyId,
        userId,
        'CustomDomain',
        { domain: cleanDomain, action: 'setup' },
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        data: {
          domain: domainConfig.domain,
          status: domainConfig.status,
          verificationCode: domainConfig.verificationCode,
          cnameRecord: {
            host: cleanDomain,
            value: `${verificationCode}.supplychain.app`,
            type: 'CNAME',
          },
        },
        message: 'Custom domain setup initiated. Please add the CNAME record to your DNS provider.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to setup custom domain';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// Get custom domain configuration
router.get('/domain', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId } = (req as any).user;

    const domainConfig = await prisma.customDomainConfig.findUnique({
      where: { companyId },
    });

    if (!domainConfig) {
      res.status(404).json({
        success: false,
        message: 'No custom domain configured',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        domain: domainConfig.domain,
        status: domainConfig.status,
        verifiedAt: domainConfig.verifiedAt,
        expiresAt: domainConfig.expiresAt,
        cnameRecord: {
          host: domainConfig.domain,
          value: `${domainConfig.verificationCode}.supplychain.app`,
          type: 'CNAME',
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch domain configuration';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Verify custom domain
router.post('/verify-domain', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyId, userId } = (req as any).user;

    const domainConfig = await prisma.customDomainConfig.findUnique({
      where: { companyId },
    });

    if (!domainConfig) {
      res.status(404).json({
        success: false,
        message: 'No custom domain configured',
      });
      return;
    }

    if (domainConfig.status === 'active') {
      res.json({
        success: true,
        data: domainConfig,
        message: 'Domain already verified',
      });
      return;
    }

    // In production, verify DNS CNAME record using DNS lookup
    // For now, simulate verification
    const dns = require('dns').promises;
    
    try {
      const records = await dns.resolveCname(domainConfig.domain);
      const expectedCname = `${domainConfig.verificationCode}.supplychain.app`;
      
      if (records.includes(expectedCname)) {
        // Provision SSL certificate
        const sslCert = await provisionSSLCertificate(domainConfig.domain);

        // Update domain config
        const updated = await prisma.customDomainConfig.update({
          where: { companyId },
          data: {
            status: 'active',
            sslCertificate: sslCert,
            verifiedAt: new Date(),
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            updatedAt: new Date(),
          },
        });

        // Audit log
        await auditConfigChange(
          companyId,
          userId,
          'CustomDomain',
          { domain: domainConfig.domain, action: 'verified' },
          req.ip,
          req.headers['user-agent']
        );

        res.json({
          success: true,
          data: updated,
          message: 'Domain verified and SSL certificate provisioned successfully',
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'CNAME record not found or incorrect. Please ensure the DNS record has propagated.',
        });
      }
    } catch (dnsError) {
      res.status(400).json({
        success: false,
        message: 'Unable to verify CNAME record. DNS may not have propagated yet. Please try again in a few minutes.',
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify domain';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Delete custom domain
router.delete(
  '/domain',
  authMiddleware,
  auditLogMiddleware('DELETE', 'CustomDomain'),
  async (req: Request, res: Response) => {
    try {
      const { companyId, userId } = (req as any).user;

      await prisma.customDomainConfig.delete({
        where: { companyId },
      });

      // Audit log
      await auditConfigChange(
        companyId,
        userId,
        'CustomDomain',
        { action: 'deleted' },
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        message: 'Custom domain removed successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete custom domain';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

// Email template management
router.get('/email-templates', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;

    const templates = await prisma.emailTemplate.findMany({
      where: { companyId },
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch email templates';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

router.put(
  '/email-templates/:type',
  authMiddleware,
  auditLogMiddleware('UPDATE', 'EmailTemplate'),
  async (req: Request, res: Response) => {
    try {
      const { companyId, userId } = (req as any).user;
      const { type } = req.params;
      const { customLogoUrl, customFooter, brandColor } = req.body;

      if (!type) {
        res.status(400).json({
          success: false,
          message: 'Template type is required',
        });
        return;
      }

      const template = await prisma.emailTemplate.upsert({
        where: {
          companyId_templateType: {
            companyId,
            templateType: type,
          },
        },
        update: {
          customLogoUrl: customLogoUrl || null,
          customFooter: customFooter || null,
          brandColor: brandColor || null,
          updatedAt: new Date(),
        },
        create: {
          companyId,
          templateType: type,
          customLogoUrl: customLogoUrl || null,
          customFooter: customFooter || null,
          brandColor: brandColor || null,
        },
      });

      // Audit log
      await auditConfigChange(
        companyId,
        userId,
        'EmailTemplate',
        { type, customLogoUrl, customFooter, brandColor },
        req.ip,
        req.headers['user-agent']
      );

      res.json({
        success: true,
        data: template,
        message: 'Email template updated successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update email template';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

export default router;

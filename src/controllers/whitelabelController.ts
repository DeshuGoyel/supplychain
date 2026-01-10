import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `whitelabel-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images only
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

export class WhiteLabelController {
  /**
   * Get white-label settings for a company
   */
  async getWhiteLabelSettings(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { whiteLabel: true }
      });

      if (!company) {
        res.status(404).json({
          success: false,
          message: 'Company not found'
        });
        return;
      }

      // Return white-label settings
      const settings = {
        enabled: company.whiteLabelEnabled,
        logoUrl: company.whiteLabelLogo || null,
        faviconUrl: company.whiteLabelFavicon || null,
        primaryColor: company.whiteLabelPrimary || '#3B82F6',
        secondaryColor: company.whiteLabelSecondary || '#1E40AF',
        customDomain: company.whiteLabelDomain || null,
        hideSupplyChainBranding: company.hideSupplyChainBranding,
        customFooterText: company.whiteLabelFooter || null,
        termsOfServiceUrl: company.whiteLabelTerms || null,
        privacyPolicyUrl: company.whiteLabelPrivacy || null,
        detailed: company.whiteLabel
      };

      res.json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error fetching white-label settings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update white-label settings (MANAGER only)
   */
  async updateWhiteLabelSettings(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const {
        enabled,
        logoUrl,
        faviconUrl,
        primaryColor,
        secondaryColor,
        customDomain,
        hideSupplyChainBranding,
        customFooterText,
        termsOfServiceUrl,
        privacyPolicyUrl
      } = req.body;

      // Check if user has permission (MANAGER role)
      const userRole = (req as any).user.role;
      if (userRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      // Update company settings
      await prisma.company.update({
        where: { id: companyId },
        data: {
          whiteLabelEnabled: enabled || false,
          whiteLabelLogo: logoUrl || null,
          whiteLabelFavicon: faviconUrl || null,
          whiteLabelPrimary: primaryColor || null,
          whiteLabelSecondary: secondaryColor || null,
          whiteLabelDomain: customDomain || null,
          hideSupplyChainBranding: hideSupplyChainBranding || false,
          whiteLabelFooter: customFooterText || null,
          whiteLabelTerms: termsOfServiceUrl || null,
          whiteLabelPrivacy: privacyPolicyUrl || null,
        }
      });

      // Update or create detailed white-label record
      await prisma.whiteLabel.upsert({
        where: { companyId },
        update: {
          logoUrl: logoUrl || null,
          faviconUrl: faviconUrl || null,
          primaryColor: primaryColor || null,
          secondaryColor: secondaryColor || null,
          customDomain: customDomain || null,
          hideSupplyChainBranding: hideSupplyChainBranding || false,
          customFooterText: customFooterText || null,
          termsOfServiceUrl: termsOfServiceUrl || null,
          privacyPolicyUrl: privacyPolicyUrl || null,
        },
        create: {
          companyId,
          logoUrl: logoUrl || null,
          faviconUrl: faviconUrl || null,
          primaryColor: primaryColor || null,
          secondaryColor: secondaryColor || null,
          customDomain: customDomain || null,
          hideSupplyChainBranding: hideSupplyChainBranding || false,
          customFooterText: customFooterText || null,
          termsOfServiceUrl: termsOfServiceUrl || null,
          privacyPolicyUrl: privacyPolicyUrl || null,
        }
      });

      res.json({
        success: true,
        message: 'White-label settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating white-label settings:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Upload company logo
   */
  async uploadLogo(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const userRole = (req as any).user.role;
      
      if (userRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      upload.single('logo')(req, res, async (err) => {
        if (err) {
          res.status(400).json({
            success: false,
            message: err.message
          });
          return;
        }

        if (!req.file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
          return;
        }

        const logoUrl = `/uploads/${req.file.filename}`;

        // Update company logo
        await prisma.company.update({
          where: { id: companyId },
          data: { whiteLabelLogo: logoUrl }
        });

        res.json({
          success: true,
          message: 'Logo uploaded successfully',
          data: { logoUrl }
        });
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Upload favicon
   */
  async uploadFavicon(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const userRole = (req as any).user.role;
      
      if (userRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      upload.single('favicon')(req, res, async (err) => {
        if (err) {
          res.status(400).json({
            success: false,
            message: err.message
          });
          return;
        }

        if (!req.file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded'
          });
          return;
        }

        const faviconUrl = `/uploads/${req.file.filename}`;

        // Update company favicon
        await prisma.company.update({
          where: { id: companyId },
          data: { whiteLabelFavicon: faviconUrl }
        });

        res.json({
          success: true,
          message: 'Favicon uploaded successfully',
          data: { faviconUrl }
        });
      });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Validate custom domain availability
   */
  async validateCustomDomain(req: Request, res: Response): Promise<void> {
    try {
      const { domain } = req.body;
      
      if (!domain) {
        res.status(400).json({
          success: false,
          message: 'Domain is required'
        });
        return;
      }

      // Check if domain is already taken
      const existing = await prisma.company.findFirst({
        where: { whiteLabelDomain: domain }
      });

      res.json({
        success: true,
        data: {
          available: !existing,
          domain
        }
      });
    } catch (error) {
      console.error('Error validating domain:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Apply white-label theme based on company
   */
  async getThemeByDomain(req: Request, res: Response): Promise<void> {
    try {
      const { domain } = req.params;
      
      const company = await prisma.company.findUnique({
        where: { whiteLabelDomain: domain },
        include: { whiteLabel: true }
      });

      if (!company || !company.whiteLabelEnabled) {
        // Return default theme if no white-label
        res.json({
          success: true,
          data: {
            enabled: false,
            primaryColor: '#3B82F6',
            secondaryColor: '#1E40AF',
            logoUrl: null,
            faviconUrl: null,
            hideSupplyChainBranding: false,
            companyName: 'Supply Chain AI'
          }
        });
        return;
      }

      res.json({
        success: true,
        data: {
          enabled: true,
          primaryColor: company.whiteLabel?.primaryColor || company.whiteLabelPrimary || '#3B82F6',
          secondaryColor: company.whiteLabel?.secondaryColor || company.whiteLabelSecondary || '#1E40AF',
          logoUrl: company.whiteLabel?.logoUrl || company.whiteLabelLogo,
          faviconUrl: company.whiteLabel?.faviconUrl || company.whiteLabelFavicon,
          hideSupplyChainBranding: company.whiteLabel?.hideSupplyChainBranding || company.hideSupplyChainBranding,
          customFooterText: company.whiteLabel?.customFooterText || company.whiteLabelFooter,
          companyName: company.name
        }
      });
    } catch (error) {
      console.error('Error fetching theme by domain:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
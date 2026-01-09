import { Request, Response } from 'express';
import { WhiteLabelStatus } from '@prisma/client';
import { WhiteLabelService } from '../services/whitelabel.service';

const service = new WhiteLabelService();

export const getWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;

    const config = await service.getWhiteLabelConfig(companyId);

    res.status(200).json({
      success: true,
      config,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch config';
    res.status(500).json({ success: false, message });
  }
};

export const upsertWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;

    const {
      customDomain,
      primaryColor,
      secondaryColor,
      fontFamily,
      headerText,
      footerText,
      removedBranding,
      customHelpCenterUrl,
      status,
    } = req.body;

    const config = await service.createWhiteLabelConfig(companyId, {
      customDomain,
      primaryColor,
      secondaryColor,
      fontFamily,
      headerText,
      footerText,
      removedBranding,
      customHelpCenterUrl,
      status,
    });

    res.status(200).json({ success: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update config';
    res.status(500).json({ success: false, message });
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;
    const file = (req as any).file as any;

    if (!file) {
      res.status(400).json({ success: false, message: 'File is required' });
      return;
    }

    const config = (await service.getWhiteLabelConfig(companyId)) ||
      (await service.createWhiteLabelConfig(companyId, {}));

    const result = await service.uploadLogo(config.id, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    });

    res.status(200).json({ success: true, url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload logo';
    res.status(500).json({ success: false, message });
  }
};

export const uploadFavicon = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;
    const file = (req as any).file as any;

    if (!file) {
      res.status(400).json({ success: false, message: 'File is required' });
      return;
    }

    const config = (await service.getWhiteLabelConfig(companyId)) ||
      (await service.createWhiteLabelConfig(companyId, {}));

    const result = await service.uploadFavicon(config.id, {
      originalname: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    });

    res.status(200).json({ success: true, url: result.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to upload favicon';
    res.status(500).json({ success: false, message });
  }
};

export const setupDomain = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;
    const { customDomain } = req.body as { customDomain?: string };

    if (!customDomain) {
      res.status(400).json({ success: false, message: 'customDomain is required' });
      return;
    }

    const config = await service.createWhiteLabelConfig(companyId, {
      customDomain,
      status: WhiteLabelStatus.PENDING,
    });

    const cname = service.generateCNAMERecord(customDomain);
    const ssl = await service.provisionalSSLCert(customDomain);

    res.status(200).json({ success: true, config, cname, ssl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to setup domain';
    res.status(500).json({ success: false, message });
  }
};

export const verifyDomain = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;
    const { customDomain } = req.body as { customDomain?: string };

    if (!customDomain) {
      res.status(400).json({ success: false, message: 'customDomain is required' });
      return;
    }

    const verification = await service.verifyDomain(customDomain);

    if (verification.verified) {
      const config = await service.createWhiteLabelConfig(companyId, {
        customDomain,
        status: WhiteLabelStatus.ACTIVE,
      });
      res.status(200).json({ success: true, verified: true, config, cnames: verification.cnames });
      return;
    }

    res.status(200).json({ success: true, verified: false, cnames: verification.cnames });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to verify domain';
    res.status(500).json({ success: false, message });
  }
};

export const deleteDomain = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;

    const existing = await service.getWhiteLabelConfig(companyId);
    if (!existing) {
      res.status(404).json({ success: false, message: 'No white-label config found' });
      return;
    }

    const config = await service.updateWhiteLabelConfig(existing.id, {
      customDomain: null,
      status: WhiteLabelStatus.INACTIVE,
    });

    res.status(200).json({ success: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete domain';
    res.status(500).json({ success: false, message });
  }
};

export const getPublicWhiteLabelConfig = async (req: Request, res: Response) => {
  try {
    const domain = (req.query.domain as string) || req.hostname;
    const config = await service.getWhiteLabelConfigByDomain(domain);
    res.status(200).json({ success: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch public config';
    res.status(500).json({ success: false, message });
  }
};

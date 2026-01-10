import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();

/**
 * Check SSO configuration status
 * GET /api/sso/status
 */
export const getSSOStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;

    const integrations = await prisma.ssoIntegration.findMany({
      where: { companyId },
      select: {
        id: true,
        provider: true,
        enabled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      integrations
    });
  } catch (error) {
    console.error('Get SSO status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching SSO status' });
  }
};

/**
 * Configure SSO for company (MANAGER only)
 * POST /api/sso/configure
 */
export const configureSSO = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;
    const { provider, clientId, clientSecret, enabled } = req.body;

    if (!provider || !clientId || !clientSecret) {
      res.status(400).json({ success: false, message: 'Provider, clientId, and clientSecret are required' });
      return;
    }

    const integration = await prisma.ssoIntegration.upsert({
      where: {
        // We need a unique constraint or use findFirst + update/create
        // Since id is the only unique field, we'll find by companyId and provider
        id: (await prisma.ssoIntegration.findFirst({ where: { companyId, provider } }))?.id || 'new-id'
      },
      update: {
        clientId,
        clientSecret: encrypt(clientSecret),
        enabled: enabled !== undefined ? enabled : true
      },
      create: {
        companyId,
        provider,
        clientId,
        clientSecret: encrypt(clientSecret),
        enabled: enabled !== undefined ? enabled : true
      }
    });

    res.status(200).json({
      success: true,
      message: `${provider} SSO configured successfully`,
      integration: {
        id: integration.id,
        provider: integration.provider,
        enabled: integration.enabled
      }
    });
  } catch (error) {
    console.error('Configure SSO error:', error);
    res.status(500).json({ success: false, message: 'Internal server error configuring SSO' });
  }
};

// OAuth initiation and callback placeholders
export const initiateGoogleAuth = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Google Auth initiation not implemented in this demo' });
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Google Auth callback not implemented in this demo' });
};

export const initiateMicrosoftAuth = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Microsoft Auth initiation not implemented in this demo' });
};

export const handleMicrosoftCallback = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Microsoft Auth callback not implemented in this demo' });
};

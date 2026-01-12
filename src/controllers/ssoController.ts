import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../utils/encryption';

const prisma = new PrismaClient();

/**
 * Check SSO/OAuth configuration status
 * GET /api/sso/status
 */
export const getSSOStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId as string;

    const integrations = await prisma.oauthProvider.findMany({
      where: { companyId },
      select: {
        id: true,
        provider: true,
        clientId: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      integrations,
    });
  } catch (error) {
    console.error('Get SSO status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching SSO status' });
  }
};

/**
 * Configure SSO/OAuth for company (MANAGER only)
 * POST /api/sso/configure
 */
export const configureSSO = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId as string;
    const { provider, clientId, clientSecret, enabled } = req.body as {
      provider?: unknown;
      clientId?: unknown;
      clientSecret?: unknown;
      enabled?: unknown;
    };

    if (typeof provider !== 'string' || !provider.trim()) {
      res.status(400).json({ success: false, message: 'provider is required' });
      return;
    }

    if (typeof clientId !== 'string' || !clientId.trim() || typeof clientSecret !== 'string' || !clientSecret.trim()) {
      res.status(400).json({ success: false, message: 'clientId and clientSecret are required' });
      return;
    }

    const normalizedProvider = provider.trim().toLowerCase();

    const integration = await prisma.oauthProvider.upsert({
      where: {
        companyId_provider: {
          companyId,
          provider: normalizedProvider,
        },
      },
      update: {
        clientId: clientId.trim(),
        clientSecret: encrypt(clientSecret.trim()),
        enabled: enabled === undefined ? true : Boolean(enabled),
      },
      create: {
        companyId,
        provider: normalizedProvider,
        clientId: clientId.trim(),
        clientSecret: encrypt(clientSecret.trim()),
        enabled: enabled === undefined ? true : Boolean(enabled),
      },
    });

    res.status(200).json({
      success: true,
      message: `${integration.provider} OAuth configured successfully`,
      integration: {
        id: integration.id,
        provider: integration.provider,
        clientId: integration.clientId,
        enabled: integration.enabled,
      },
    });
  } catch (error) {
    console.error('Configure SSO error:', error);
    res.status(500).json({ success: false, message: 'Internal server error configuring SSO' });
  }
};

/**
 * POST /api/sso/test/:integrationId
 */
export const testSSOConnection = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId as string;
    const integrationId = req.params.integrationId;

    const integration = await prisma.oauthProvider.findUnique({ where: { id: integrationId } });
    if (!integration || integration.companyId !== companyId) {
      res.status(404).json({ success: false, message: 'Integration not found' });
      return;
    }

    // Lightweight test: configuration exists and is enabled
    res.status(200).json({
      success: true,
      message: 'Integration is configured',
      enabled: integration.enabled,
      provider: integration.provider,
    });
  } catch (error) {
    console.error('Test SSO connection error:', error);
    res.status(500).json({ success: false, message: 'Internal server error testing SSO connection' });
  }
};

/**
 * PUT /api/sso/integrations/:integrationId
 */
export const updateSSOIntegration = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId as string;
    const integrationId = req.params.integrationId;

    const { enabled } = req.body as { enabled?: unknown };

    const existing = await prisma.oauthProvider.findUnique({ where: { id: integrationId } });
    if (!existing || existing.companyId !== companyId) {
      res.status(404).json({ success: false, message: 'Integration not found' });
      return;
    }

    const updated = await prisma.oauthProvider.update({
      where: { id: integrationId },
      data: {
        enabled: enabled === undefined ? existing.enabled : Boolean(enabled),
      },
      select: {
        id: true,
        provider: true,
        clientId: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({ success: true, integration: updated });
  } catch (error) {
    console.error('Update SSO integration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error updating SSO integration' });
  }
};

// Convenience routes that reuse /api/auth/oauth/*
export const initiateGoogleAuth = async (_req: Request, res: Response) => {
  res.redirect('/api/auth/oauth/google');
};

export const handleGoogleCallback = async (_req: Request, res: Response) => {
  res.redirect('/api/auth/oauth/google/callback');
};

export const initiateMicrosoftAuth = async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Microsoft OAuth not implemented. Configure google/github for demo.' });
};

export const handleMicrosoftCallback = async (_req: Request, res: Response) => {
  res.status(501).json({ message: 'Microsoft OAuth not implemented. Configure google/github for demo.' });
};

export const initiateGithubAuth = async (_req: Request, res: Response) => {
  res.redirect('/api/auth/oauth/github');
};

export const handleGithubCallback = async (_req: Request, res: Response) => {
  res.redirect('/api/auth/oauth/github/callback');
};

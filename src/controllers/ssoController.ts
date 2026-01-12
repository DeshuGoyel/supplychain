import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt } from '../utils/encryption';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

/**
 * Check SSO configuration status
 * GET /api/sso/status
 */
export const getSSOStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user.companyId;

    const integrations = await prisma.sSOIntegration.findMany({
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

    // Check if integration exists
    const existingIntegration = await prisma.sSOIntegration.findFirst({
      where: { companyId, provider }
    });

    const integration = existingIntegration
      ? await prisma.sSOIntegration.update({
          where: { id: existingIntegration.id },
          data: {
            clientId,
            clientSecret: encrypt(clientSecret),
            enabled: enabled !== undefined ? enabled : true
          }
        })
      : await prisma.sSOIntegration.create({
          data: {
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

/**
 * Initiate Google OAuth flow
 * GET /api/sso/google
 */
export const initiateGoogleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const state = Buffer.from(JSON.stringify({ provider: 'google' })).toString('base64');

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/api/sso/google/callback`;

    if (!clientId) {
      res.status(500).json({ success: false, message: 'Google OAuth not configured' });
      return;
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${state}` +
      `&access_type=offline` +
      `&prompt=consent`;

    res.redirect(authUrl);
  } catch (error) {
    console.error('Initiate Google auth error:', error);
    res.status(500).json({ success: false, message: 'Error initiating Google auth' });
  }
};

/**
 * Handle Google OAuth callback
 * GET /api/sso/google/callback
 */
export const handleGoogleCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('Google OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=oauth_failed`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${process.env.API_URL || 'http://localhost:3001'}/api/sso/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json() as { access_token?: string };

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=token_exchange_failed`);
    }

    // Get user info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=user_info_failed`);
    }

    // Find or create user
    await handleOAuthUser(userInfo, 'google', req, res);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=callback_error`);
  }
};

/**
 * Initiate Microsoft OAuth flow
 * GET /api/sso/microsoft
 */
export const initiateMicrosoftAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const state = Buffer.from(JSON.stringify({ provider: 'microsoft' })).toString('base64');

    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';
    const redirectUri = `${process.env.API_URL || 'http://localhost:3001'}/api/sso/microsoft/callback`;

    if (!clientId) {
      res.status(500).json({ success: false, message: 'Microsoft OAuth not configured' });
      return;
    }

    const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${state}` +
      `&response_mode=query`;

    res.redirect(authUrl);
  } catch (error) {
    console.error('Initiate Microsoft auth error:', error);
    res.status(500).json({ success: false, message: 'Error initiating Microsoft auth' });
  }
};

/**
 * Handle Microsoft OAuth callback
 * GET /api/sso/microsoft/callback
 */
export const handleMicrosoftCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      console.error('Microsoft OAuth error:', error_description || error);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=oauth_failed`);
    }

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=no_code`);
    }

    const tenantId = process.env.MICROSOFT_TENANT_ID || 'common';

    // Exchange code for tokens
    const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: process.env.MICROSOFT_CLIENT_ID || '',
        client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
        redirect_uri: `${process.env.API_URL || 'http://localhost:3001'}/api/sso/microsoft/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json() as { access_token?: string };

    if (!tokenResponse.ok) {
      console.error('Token exchange error:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=token_exchange_failed`);
    }

    // Get user info from Microsoft Graph
    const userInfoResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    if (!userInfoResponse.ok) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=user_info_failed`);
    }

    // Find or create user
    await handleOAuthUser(userInfo, 'microsoft', req, res);
  } catch (error) {
    console.error('Microsoft callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=callback_error`);
  }
};

/**
 * Handle OAuth user creation/login
 */
async function handleOAuthUser(
  userInfo: any,
  provider: string,
  req: Request,
  res: Response
): Promise<void> {
  const email = userInfo.email || userInfo.mail;
  const providerId = userInfo.id || userInfo.sub;

  if (!email) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=no_email`);
  }

  try {
    // Check if user already exists with this OAuth provider
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { ssoProvider: provider, ssoProviderId: providerId },
          { email: email }
        ]
      },
      include: { company: true }
    });

    if (!user) {
      // If email matches existing user without OAuth, link the account
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            ssoProvider: provider,
            ssoProviderId: providerId
          }
        });
        
        // Fetch updated user with company
        user = await prisma.user.findUnique({
          where: { id: existingUser.id },
          include: { company: true }
        });
        
        if (!user) {
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=user_not_found`);
        }
      } else {
        // Create new user with new company
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/complete-signup?` +
          `email=${encodeURIComponent(email)}&provider=${provider}&providerId=${providerId}`
        );
      }
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });

    // Log successful OAuth login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'OAUTH_LOGIN',
        success: true,
        ipAddress: req.ip || undefined,
        userAgent: req.get('user-agent') || undefined
      }
    });

    // Reset login attempts on successful OAuth
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
    });

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Handle OAuth user error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/login?error=user_processing_failed`);
  }
}

/**
 * Delete SSO integration
 * DELETE /api/sso/integrations/:id
 */
export const deleteSSOIntegration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const companyId = (req as any).user.companyId;

    const integration = await prisma.sSOIntegration.findFirst({
      where: { id, companyId }
    });

    if (!integration) {
      res.status(404).json({ success: false, message: 'Integration not found' });
      return;
    }

    await prisma.sSOIntegration.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'SSO integration deleted successfully'
    });
  } catch (error) {
    console.error('Delete SSO integration error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

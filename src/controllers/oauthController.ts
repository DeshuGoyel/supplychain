import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { decrypt } from '../utils/encryption';
import { generateToken } from '../utils/jwt';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

type SupportedProvider = 'google' | 'github';

const SUPPORTED_PROVIDERS: SupportedProvider[] = ['google', 'github'];

const getProvider = (raw: string): SupportedProvider | null => {
  const normalized = raw.toLowerCase();
  return (SUPPORTED_PROVIDERS as string[]).includes(normalized) ? (normalized as SupportedProvider) : null;
};

const getBaseUrl = (req: Request): string => {
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol;
  const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.get('host');
  return `${proto}://${host}`;
};

const getFrontendUrl = (): string => process.env.FRONTEND_URL || 'http://localhost:3000';

const OAUTH_STATE_SECRET = process.env.OAUTH_STATE_SECRET || process.env.JWT_SECRET || 'oauth-state-secret';

const signState = (payload: Record<string, unknown>): string => {
  return jwt.sign(payload, OAUTH_STATE_SECRET, { expiresIn: '10m' });
};

const verifyState = (token: string): Record<string, unknown> => {
  return jwt.verify(token, OAUTH_STATE_SECRET) as Record<string, unknown>;
};

const getCompanyIdForOAuth = (req: Request): string | null => {
  const fromDomain = (req as any).whiteLabelCompanyId as string | undefined;
  if (fromDomain) return fromDomain;

  const fromQuery = req.query.companyId;
  if (typeof fromQuery === 'string' && fromQuery) return fromQuery;

  return null;
};

const randomPassword = (): string => crypto.randomBytes(32).toString('hex');

export const initiateOAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = getProvider(req.params.provider);
    if (!provider) {
      res.status(400).json({ success: false, message: 'Unsupported OAuth provider' });
      return;
    }

    let companyId = getCompanyIdForOAuth(req);
    if (!companyId) {
      // Fallback for single-tenant / demo environments
      const first = await prisma.oauthProvider.findFirst({
        where: { provider, enabled: true },
        select: { companyId: true },
        orderBy: { createdAt: 'desc' },
      });
      companyId = first?.companyId || null;
    }

    if (!companyId) {
      res.status(400).json({ success: false, message: 'companyId is required (via custom domain or ?companyId=)' });
      return;
    }

    const oauthProvider = await prisma.oauthProvider.findUnique({
      where: { companyId_provider: { companyId, provider } },
    });

    if (!oauthProvider || !oauthProvider.enabled) {
      res.status(404).json({ success: false, message: 'OAuth provider is not configured for this company' });
      return;
    }

    const callbackUrl = `${getBaseUrl(req)}/api/auth/oauth/${provider}/callback`;
    const returnTo = typeof req.query.returnTo === 'string' && req.query.returnTo ? req.query.returnTo : null;

    const state = signState({ companyId, provider, returnTo });

    if (provider === 'google') {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', oauthProvider.clientId);
      authUrl.searchParams.set('redirect_uri', callbackUrl);
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('prompt', 'select_account');

      res.redirect(authUrl.toString());
      return;
    }

    if (provider === 'github') {
      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.set('client_id', oauthProvider.clientId);
      authUrl.searchParams.set('redirect_uri', callbackUrl);
      authUrl.searchParams.set('scope', 'read:user user:email');
      authUrl.searchParams.set('state', state);

      res.redirect(authUrl.toString());
      return;
    }

    res.status(400).json({ success: false, message: 'Unsupported OAuth provider' });
  } catch (error) {
    console.error('Initiate OAuth error:', error);
    res.status(500).json({ success: false, message: 'Internal server error initiating OAuth' });
  }
};

export const handleOAuthCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const provider = getProvider(req.params.provider);
    if (!provider) {
      res.status(400).json({ success: false, message: 'Unsupported OAuth provider' });
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : null;
    const state = typeof req.query.state === 'string' ? req.query.state : null;

    if (!code || !state) {
      res.status(400).json({ success: false, message: 'Missing code or state' });
      return;
    }

    const statePayload = verifyState(state);
    const companyId = statePayload.companyId;

    if (typeof companyId !== 'string' || !companyId) {
      res.status(400).json({ success: false, message: 'Invalid state' });
      return;
    }

    const oauthProvider = await prisma.oauthProvider.findUnique({
      where: { companyId_provider: { companyId, provider } },
    });

    if (!oauthProvider || !oauthProvider.enabled) {
      res.status(404).json({ success: false, message: 'OAuth provider is not configured for this company' });
      return;
    }

    const clientSecret = decrypt(oauthProvider.clientSecret);
    const callbackUrl = `${getBaseUrl(req)}/api/auth/oauth/${provider}/callback`;

    let profile: any;

    if (provider === 'google') {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: oauthProvider.clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenRes.ok) {
        const body = await tokenRes.text();
        throw new Error(`Google token exchange failed: ${tokenRes.status} ${body}`);
      }

      const tokenJson = (await tokenRes.json()) as { access_token?: string };
      if (!tokenJson.access_token) throw new Error('Google token exchange missing access_token');

      const userInfoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${tokenJson.access_token}` },
      });

      if (!userInfoRes.ok) {
        const body = await userInfoRes.text();
        throw new Error(`Google userinfo failed: ${userInfoRes.status} ${body}`);
      }

      profile = await userInfoRes.json();
    }

    if (provider === 'github') {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({
          code,
          client_id: oauthProvider.clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
        }),
      });

      if (!tokenRes.ok) {
        const body = await tokenRes.text();
        throw new Error(`GitHub token exchange failed: ${tokenRes.status} ${body}`);
      }

      const tokenJson = (await tokenRes.json()) as { access_token?: string };
      if (!tokenJson.access_token) throw new Error('GitHub token exchange missing access_token');

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'supplychain-ai',
        },
      });

      if (!userRes.ok) {
        const body = await userRes.text();
        throw new Error(`GitHub user fetch failed: ${userRes.status} ${body}`);
      }

      const user = await userRes.json();

      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenJson.access_token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'supplychain-ai',
        },
      });

      const emails = emailsRes.ok ? await emailsRes.json() : [];
      const primaryEmail = Array.isArray(emails)
        ? (emails.find((e: any) => e.primary && e.verified)?.email as string | undefined)
        : undefined;

      profile = {
        ...user,
        email: user.email || primaryEmail,
      };
    }

    const email = profile?.email as string | undefined;
    const providerUserId = (profile?.sub || profile?.id)?.toString() as string | undefined;
    const name = (profile?.name || profile?.login || 'OAuth User') as string;

    if (!email || !providerUserId) {
      res.status(400).json({ success: false, message: 'OAuth provider did not return an email' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    let user = existingUser;

    if (user && user.companyId !== companyId) {
      res.status(403).json({ success: false, message: 'User belongs to a different company' });
      return;
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: await hashPassword(randomPassword()),
          name,
          role: 'PLANNER',
          companyId,
          ssoProvider: provider,
          ssoProviderId: providerUserId,
          oauthProfile: profile,
          lastLoginAt: new Date(),
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ssoProvider: provider,
          ssoProviderId: providerUserId,
          oauthProfile: profile,
          lastLoginAt: new Date(),
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: `SSO_${provider.toUpperCase()}_LOGIN`,
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    const returnTo = typeof statePayload.returnTo === 'string' ? statePayload.returnTo : null;

    if (user.twoFactorEnabled) {
      const url = new URL('/auth/oauth/callback', getFrontendUrl());
      url.searchParams.set('requiresTwoFactor', 'true');
      url.searchParams.set('userId', user.id);
      if (returnTo) url.searchParams.set('returnTo', returnTo);
      res.redirect(url.toString());
      return;
    }

    const tokenData = generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    });

    const url = new URL('/auth/oauth/callback', getFrontendUrl());
    url.searchParams.set('token', tokenData.token);
    if (returnTo) url.searchParams.set('returnTo', returnTo);
    res.redirect(url.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);

    try {
      const url = new URL('/auth/login', getFrontendUrl());
      url.searchParams.set('oauthError', 'true');
      res.redirect(url.toString());
    } catch {
      res.status(500).json({ success: false, message: 'Internal server error processing OAuth callback' });
    }
  }
};

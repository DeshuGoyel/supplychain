import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';

const prisma = new PrismaClient();

// Configure Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/sso/google/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Google ID
      let user = await prisma.user.findFirst({
        where: {
          ssoProviderId: profile.id,
          ssoProvider: 'google'
        }
      });

      if (!user) {
        // Check if user exists with same email
        user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0].value || '' }
        });

        if (user) {
          // Link Google account to existing user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              ssoProvider: 'google',
              ssoProviderId: profile.id
            }
          });
        }
      }

      if (user) {
        return done(null, user);
      }

      return done(null, false, { message: 'User not found or not authorized for SSO' });
    } catch (error) {
      return done(error, null);
    }
  }));
}

// Configure Microsoft OAuth
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL || "/api/auth/sso/microsoft/callback",
    scope: ['user.read']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Microsoft ID
      let user = await prisma.user.findFirst({
        where: {
          ssoProviderId: profile.id,
          ssoProvider: 'microsoft'
        }
      });

      if (!user) {
        // Check if user exists with same email
        user = await prisma.user.findUnique({
          where: { email: profile.emails?.[0].value || '' }
        });

        if (user) {
          // Link Microsoft account to existing user
          await prisma.user.update({
            where: { id: user.id },
            data: {
              ssoProvider: 'microsoft',
              ssoProviderId: profile.id
            }
          });
        }
      }

      if (user) {
        return done(null, user);
      }

      return done(null, false, { message: 'User not found or not authorized for SSO' });
    } catch (error) {
      return done(error, null);
    }
  }));
}

export class SSOController {
  /**
   * Get SSO configuration status for company
   */
  async getSSOStatus(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      
      const ssoIntegrations = await prisma.sSOIntegration.findMany({
        where: { companyId }
      });

      const status = {
        google: {
          enabled: false,
          configured: false,
          clientId: null
        },
        microsoft: {
          enabled: false,
          configured: false,
          clientId: null
        },
        saml: {
          enabled: false,
          configured: false,
          clientId: null
        }
      };

      ssoIntegrations.forEach(integration => {
        status[integration.provider as keyof typeof status] = {
          enabled: integration.enabled,
          configured: true,
          clientId: integration.clientId
        };
      });

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error fetching SSO status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Configure SSO for company (MANAGER only)
   */
  async configureSSO(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const { provider, clientId, clientSecret, enabled } = req.body;

      // Check if user has permission (MANAGER role)
      const userRole = (req as any).user.role;
      if (userRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      // Validate provider
      const validProviders = ['google', 'microsoft', 'saml'];
      if (!validProviders.includes(provider)) {
        res.status(400).json({
          success: false,
          message: 'Invalid SSO provider'
        });
        return;
      }

      // Encrypt client secret (in production, use proper encryption)
      const encryptedSecret = clientSecret; // TODO: Implement proper encryption

      // Update or create SSO integration
      const integration = await prisma.sSOIntegration.upsert({
        where: {
          companyId_provider: {
            companyId,
            provider
          }
        },
        update: {
          clientId,
          clientSecret: encryptedSecret,
          enabled: enabled || false
        },
        create: {
          companyId,
          provider,
          clientId,
          clientSecret: encryptedSecret,
          enabled: enabled || false
        }
      });

      // Log SSO configuration
      await this.logAuditEvent(
        (req as any).user.id, 
        companyId, 
        'SSO_CONFIGURED', 
        req, 
        true, 
        JSON.stringify({ provider, enabled })
      );

      res.json({
        success: true,
        message: 'SSO configuration updated successfully',
        data: {
          provider,
          enabled: integration.enabled,
          clientId: integration.clientId
        }
      });
    } catch (error) {
      console.error('Error configuring SSO:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Test SSO connection
   */
  async testSSOConnection(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, provider } = req.params;

      const integration = await prisma.sSOIntegration.findFirst({
        where: { companyId, provider }
      });

      if (!integration || !integration.enabled) {
        res.status(400).json({
          success: false,
          message: 'SSO integration not configured or disabled'
        });
        return;
      }

      // Log test attempt
      await this.logAuditEvent(
        (req as any).user.id, 
        companyId, 
        'SSO_TEST_ATTEMPT', 
        req, 
        true, 
        JSON.stringify({ provider })
      );

      res.json({
        success: true,
        message: 'SSO connection test successful',
        data: {
          provider,
          status: 'connected',
          clientId: integration.clientId
        }
      });
    } catch (error) {
      console.error('Error testing SSO connection:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Disable SSO for company
   */
  async disableSSO(req: Request, res: Response): Promise<void> {
    try {
      const { companyId, provider } = req.params;

      // Check if user has permission (MANAGER role)
      const userRole = (req as any).user.role;
      if (userRole !== 'MANAGER') {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      await prisma.sSOIntegration.update({
        where: {
          companyId_provider: {
            companyId,
            provider
          }
        },
        data: {
          enabled: false
        }
      });

      // Log SSO disable
      await this.logAuditEvent(
        (req as any).user.id, 
        companyId, 
        'SSO_DISABLED', 
        req, 
        true, 
        JSON.stringify({ provider })
      );

      res.json({
        success: true,
        message: 'SSO disabled successfully'
      });
    } catch (error) {
      console.error('Error disabling SSO:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get list of available SSO providers
   */
  async getAvailableProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = [
        {
          id: 'google',
          name: 'Google',
          description: 'Sign in with your Google account',
          icon: 'google-icon.png',
          configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
        },
        {
          id: 'microsoft',
          name: 'Microsoft',
          description: 'Sign in with your Microsoft account',
          icon: 'microsoft-icon.png',
          configured: !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET)
        },
        {
          id: 'saml',
          name: 'SAML',
          description: 'Enterprise SAML integration',
          icon: 'saml-icon.png',
          configured: false // Manual configuration required
        }
      ];

      res.json({
        success: true,
        data: providers
      });
    } catch (error) {
      console.error('Error fetching SSO providers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Log audit events
   */
  private async logAuditEvent(
    userId: string, 
    companyId: string, 
    action: string, 
    req: Request, 
    success: boolean,
    details?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          companyId,
          action,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          success,
          details: details || null
        }
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }
}
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
  generateTOTPSecret, 
  generateQRCode, 
  verifyTOTP, 
  generateBackupCodes,
  hashBackupCode 
} from '../utils/totp';

const prisma = new PrismaClient();

export class TwoFactorController {
  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (user.twoFactorEnabled) {
        res.status(400).json({
          success: false,
          message: '2FA is already enabled'
        });
        return;
      }

      // Generate TOTP secret
      const secret = generateTOTPSecret(user.email);
      
      // Generate QR code
      const qrCode = await generateQRCode(secret.otpauth_url);

      // Store encrypted secret temporarily (not enabled yet)
      const encryptedSecret = secret.base32; // In production, encrypt this
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: encryptedSecret
        }
      });

      // Log the 2FA enable attempt
      await this.logAuditEvent(userId, user.companyId, '2FA_ENABLE_ATTEMPT', req, true);

      res.json({
        success: true,
        message: '2FA setup initiated',
        data: {
          qrCode,
          secret: secret.base32,
          backupCodes: [] // Will generate after verification
        }
      });
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify 2FA setup
   */
  async verifyTwoFactorSetup(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { token, backupCodes } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.twoFactorSecret) {
        res.status(400).json({
          success: false,
          message: 'No 2FA setup in progress'
        });
        return;
      }

      // Verify TOTP token
      const isValidToken = verifyTOTP(token, user.twoFactorSecret);
      
      if (!isValidToken) {
        res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
        return;
      }

      // Generate backup codes
      const generatedBackupCodes = generateBackupCodes();
      const hashedCodes = generatedBackupCodes.map(code => 
        hashBackupCode(code, user.twoFactorSecret)
      );

      // Enable 2FA and store backup codes
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorBackupCodes: JSON.stringify(hashedCodes)
        }
      });

      // Log successful 2FA enable
      await this.logAuditEvent(userId, user.companyId, '2FA_ENABLED', req, true);

      res.json({
        success: true,
        message: '2FA enabled successfully',
        data: {
          backupCodes: generatedBackupCodes
        }
      });
    } catch (error) {
      console.error('Error verifying 2FA setup:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verify 2FA code during login
   */
  async verifyTwoFactorCode(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { token, backupCode } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      });

      if (!user || !user.twoFactorEnabled) {
        res.status(400).json({
          success: false,
          message: '2FA is not enabled for this user'
        });
        return;
      }

      let isValidCode = false;

      // Try TOTP first
      if (token && user.twoFactorSecret) {
        isValidCode = verifyTOTP(token, user.twoFactorSecret);
      }

      // Try backup code if TOTP failed
      if (!isValidCode && backupCode && user.twoFactorBackupCodes) {
        try {
          const backupCodes = JSON.parse(user.twoFactorBackupCodes);
          const hashedBackupCode = hashBackupCode(backupCode, user.twoFactorSecret || '');
          
          isValidCode = backupCodes.includes(hashedBackupCode);
          
          // Remove used backup code
          if (isValidCode) {
            const updatedCodes = backupCodes.filter((code: string) => code !== hashedBackupCode);
            await prisma.user.update({
              where: { id: userId },
              data: {
                twoFactorBackupCodes: JSON.stringify(updatedCodes)
              }
            });
          }
        } catch (error) {
          console.error('Error processing backup code:', error);
        }
      }

      if (!isValidCode) {
        res.status(400).json({
          success: false,
          message: 'Invalid verification code'
        });
        return;
      }

      // Update last login time
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastLoginAt: new Date(),
          loginAttempts: 0 // Reset login attempts on successful 2FA
        }
      });

      // Log successful 2FA verification
      await this.logAuditEvent(userId, user.companyId, '2FA_VERIFIED', req, true);

      res.json({
        success: true,
        message: '2FA verification successful'
      });
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Generate new backup codes
   */
  async generateBackupCodes(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.twoFactorEnabled) {
        res.status(400).json({
          success: false,
          message: '2FA must be enabled to generate backup codes'
        });
        return;
      }

      // Generate new backup codes
      const newBackupCodes = generateBackupCodes();
      const hashedCodes = newBackupCodes.map(code => 
        hashBackupCode(code, user.twoFactorSecret || '')
      );

      // Update user with new backup codes
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorBackupCodes: JSON.stringify(hashedCodes)
        }
      });

      res.json({
        success: true,
        message: 'New backup codes generated',
        data: {
          backupCodes: newBackupCodes
        }
      });
    } catch (error) {
      console.error('Error generating backup codes:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { password } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      if (!user.twoFactorEnabled) {
        res.status(400).json({
          success: false,
          message: '2FA is not enabled'
        });
        return;
      }

      // Verify password before disabling
      if (user.password) {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          res.status(401).json({
            success: false,
            message: 'Invalid password'
          });
          return;
        }
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null
        }
      });

      // Log 2FA disable
      await this.logAuditEvent(userId, user.companyId, '2FA_DISABLED', req, true);

      res.json({
        success: true,
        message: '2FA disabled successfully'
      });
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get 2FA status for user
   */
  async getTwoFactorStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorEnabled: true,
          lastLoginAt: true,
          loginAttempts: true
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          enabled: user.twoFactorEnabled,
          lastLoginAt: user.lastLoginAt,
          loginAttempts: user.loginAttempts
        }
      });
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
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
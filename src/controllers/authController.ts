import { Request, Response } from 'express';
import { LegalDocumentType, PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, validatePassword } from '../utils/auth';
import { generateToken } from '../utils/jwt';
import { decrypt } from '../utils/encryption';
import { verifyTOTPCode } from '../utils/totp';
import { verifyBackupCode } from '../utils/backup-codes';
import { ensureDefaultDocuments, getLatestDocument } from '../services/legalService';

const prisma = new PrismaClient();

const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCKOUT_MINUTES = parseInt(process.env.LOCKOUT_MINUTES || '15');

interface SignupRequestBody {
  email: string;
  password: string;
  name: string;
  companyName: string;
  industry: string;
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
}

interface LoginRequestBody {
  email: string;
  password: string;
}

/**
 * Register a new user with company
 * POST /api/auth/signup
 */
export const signup = async (req: Request<{}, {}, SignupRequestBody>, res: Response): Promise<void> => {
  try {
    const { email, password, name, companyName, industry } = req.body;

    const termsAccepted = req.body.termsAccepted !== undefined ? Boolean(req.body.termsAccepted) : true;
    const privacyAccepted = req.body.privacyAccepted !== undefined ? Boolean(req.body.privacyAccepted) : true;

    if (!termsAccepted || !privacyAccepted) {
      res.status(400).json({
        success: false,
        message: 'You must accept the Terms of Service and Privacy Policy to sign up',
        code: 'LEGAL_NOT_ACCEPTED',
      });
      return;
    }

    // Validation
    if (!email || !password || !name || !companyName || !industry) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: email, password, name, companyName, industry',
        code: 'MISSING_FIELDS',
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL',
      });
      return;
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        code: 'WEAK_PASSWORD',
        errors: passwordValidation.errors,
      });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        code: 'USER_EXISTS',
      });
      return;
    }

    const existingCompany = await prisma.company.findFirst({ where: { name: companyName } });
    if (existingCompany) {
      res.status(409).json({
        success: false,
        message: 'Company with this name already exists',
        code: 'COMPANY_EXISTS',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction(async (tx) => {
      await ensureDefaultDocuments(tx);

      const company = await tx.company.create({
        data: {
          name: companyName,
          industry,
          employees: 1,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'MANAGER',
          companyId: company.id,
          lastLoginAt: null,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });

      const tos = await getLatestDocument(tx, LegalDocumentType.TERMS_OF_SERVICE);
      const privacy = await getLatestDocument(tx, LegalDocumentType.PRIVACY_POLICY);

      const acceptances: Array<{ documentType: LegalDocumentType; version: string }> = [];
      if (termsAccepted && tos) acceptances.push({ documentType: LegalDocumentType.TERMS_OF_SERVICE, version: tos.version });
      if (privacyAccepted && privacy) acceptances.push({ documentType: LegalDocumentType.PRIVACY_POLICY, version: privacy.version });

      if (acceptances.length > 0) {
        await tx.userLegalAcceptance.createMany({
          data: acceptances.map((a) => ({
            userId: user.id,
            documentType: a.documentType,
            version: a.version,
            acceptedAt: new Date(),
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          companyId: company.id,
          action: 'SIGNUP',
          success: true,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      return { company, user };
    });

    const tokenData = generateToken({
      userId: result.user.id,
      companyId: result.company.id,
      email: result.user.email,
      role: result.user.role,
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        companyId: result.company.id,
        twoFactorEnabled: result.user.twoFactorEnabled,
        company: {
          id: result.company.id,
          name: result.company.name,
          industry: result.company.industry,
          employees: result.company.employees,
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req: Request<{}, {}, LoginRequestBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          action: 'LOGIN_LOCKED',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts',
        code: 'ACCOUNT_LOCKED',
      });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      const nextAttempts = user.loginAttempts + 1;
      const shouldLock = nextAttempts >= MAX_LOGIN_ATTEMPTS;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: nextAttempts,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          action: 'LOGIN',
          success: false,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    if (user.twoFactorEnabled) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          action: 'LOGIN_2FA_REQUIRED',
          success: true,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        userId: user.id,
        message: 'Two-factor authentication required',
      });
      return;
    }

    const tokenData = generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'LOGIN',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        twoFactorEnabled: user.twoFactorEnabled,
        company: {
          id: user.company.id,
          name: user.company.name,
          industry: user.company.industry,
          employees: user.company.employees,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      code: 'INTERNAL_ERROR',
    });
  }
};

/**
 * Complete login with 2FA
 * POST /api/auth/login/2fa
 */
export const login2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, code } = req.body as { userId?: unknown; code?: unknown };

    if (typeof userId !== 'string' || !userId || typeof code !== 'string' || !code) {
      res.status(400).json({
        success: false,
        message: 'User ID and 2FA code are required',
        code: 'MISSING_FIELDS',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      res.status(400).json({
        success: false,
        message: 'Invalid request or 2FA not enabled',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    const secret = decrypt(user.twoFactorSecret);
    const isValidTotp = verifyTOTPCode(secret, code);

    if (!isValidTotp) {
      // Check backup codes
      if (user.twoFactorBackupCodes) {
        const hashedBackupCodes = JSON.parse(user.twoFactorBackupCodes) as string[];
        const matchIndex = await verifyBackupCode(code, hashedBackupCodes);

        if (matchIndex !== -1) {
          hashedBackupCodes.splice(matchIndex, 1);
          await prisma.user.update({
            where: { id: userId },
            data: { twoFactorBackupCodes: JSON.stringify(hashedBackupCodes) },
          });
        } else {
          await prisma.auditLog.create({
            data: {
              userId,
              companyId: user.companyId,
              action: '2FA_VERIFY',
              success: false,
              ipAddress: req.ip,
              userAgent: req.get('user-agent'),
            },
          });

          res.status(401).json({
            success: false,
            message: 'Invalid 2FA code or backup code',
            code: 'INVALID_CODE',
          });
          return;
        }
      } else {
        await prisma.auditLog.create({
          data: {
            userId,
            companyId: user.companyId,
            action: '2FA_VERIFY',
            success: false,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          },
        });

        res.status(401).json({
          success: false,
          message: 'Invalid 2FA code',
          code: 'INVALID_CODE',
        });
        return;
      }
    }

    const tokenData = generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role,
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: '2FA_VERIFY',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'LOGIN',
        success: true,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: tokenData.token,
      expiresIn: tokenData.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        twoFactorEnabled: user.twoFactorEnabled,
        company: {
          id: user.company.id,
          name: user.company.name,
          industry: user.company.industry,
          employees: user.company.employees,
        },
      },
    });
  } catch (error) {
    console.error('Login 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during 2FA login',
      code: 'INTERNAL_ERROR',
    });
  }
};

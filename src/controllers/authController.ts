import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, validatePassword } from '../utils/auth';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

interface SignupRequestBody {
  email: string;
  password: string;
  name: string;
  companyName: string;
  industry: string;
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

    // Validation
    if (!email || !password || !name || !companyName || !industry) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: email, password, name, companyName, industry',
        code: 'MISSING_FIELDS'
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
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
        errors: passwordValidation.errors
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
        code: 'USER_EXISTS'
      });
      return;
    }

    // Check if company name already exists
    const existingCompany = await prisma.company.findFirst({
      where: { name: companyName }
    });

    if (existingCompany) {
      res.status(409).json({
        success: false,
        message: 'Company with this name already exists',
        code: 'COMPANY_EXISTS'
      });
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create company and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          industry,
          employees: 1
        }
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'MANAGER', // First user becomes manager by default
          companyId: company.id
        }
      });

      return { company, user };
    });

    // Generate JWT token
    const tokenData = generateToken({
      userId: result.user.id,
      companyId: result.company.id,
      email: result.user.email,
      role: result.user.role
    });

    // Return success response
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
        company: {
          id: result.company.id,
          name: result.company.name,
          industry: result.company.industry,
          employees: result.company.employees
        }
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      code: 'INTERNAL_ERROR'
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

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    // Find user with company information
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        company: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.lockedUntil
      });
      return;
    }

    // For SSO-only users (no password)
    if (!user.password) {
      res.status(400).json({
        success: false,
        message: 'This account uses SSO. Please sign in with your SSO provider.',
        code: 'SSO_REQUIRED',
        ssoProvider: user.ssoProvider
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      // Increment login attempts
      const newAttempts = (user.loginAttempts || 0) + 1;
      let lockedUntil = null;
      
      // Lock account after 5 failed attempts for 30 minutes
      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil
        }
      });

      // Log failed login
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          action: 'LOGIN_FAILED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          success: false,
          details: JSON.stringify({ attempts: newAttempts })
        }
      });

      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Reset login attempts on successful password verification
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null
        }
      });

      // Return response indicating 2FA is required
      res.status(200).json({
        success: true,
        message: 'Password verified. Two-factor authentication required.',
        requiresTwoFactor: true,
        userId: user.id,
        tempToken: generateToken({
          userId: user.id,
          companyId: user.companyId,
          email: user.email,
          role: user.role
        }, '5m') // Short-lived temp token for 2FA verification
      });
      return;
    }

    // Reset login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date()
      }
    });

    // Generate JWT token
    const tokenData = generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role
    });

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'LOGIN',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown',
        success: true,
        details: JSON.stringify({ method: 'password' })
      }
    });

    // Return success response
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
        ssoProvider: user.ssoProvider,
        company: {
          id: user.company.id,
          name: user.company.name,
          industry: user.company.industry,
          employees: user.company.employees,
          subscriptionStatus: user.company.subscriptionStatus,
          subscriptionTier: user.company.subscriptionTier
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Complete login with 2FA verification
 * POST /api/auth/login/2fa
 */
export const completeTwoFactorLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, twoFactorToken, backupCode } = req.body;

    if (!userId || (!twoFactorToken && !backupCode)) {
      res.status(400).json({
        success: false,
        message: 'User ID and verification code are required',
        code: 'MISSING_CREDENTIALS'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true
      }
    });

    if (!user || !user.twoFactorEnabled) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired 2FA session',
        code: 'INVALID_2FA_SESSION'
      });
      return;
    }

    // Import TOTP verification here to avoid circular dependency
    const { verifyTOTP, hashBackupCode } = await import('../utils/totp');
    
    let isValidCode = false;

    // Try TOTP first
    if (twoFactorToken && user.twoFactorSecret) {
      isValidCode = verifyTOTP(twoFactorToken, user.twoFactorSecret);
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
      // Log failed 2FA attempt
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          action: 'LOGIN_FAILED',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent') || 'Unknown',
          success: false,
          details: JSON.stringify({ method: '2FA', failed: true })
        }
      });

      res.status(401).json({
        success: false,
        message: 'Invalid verification code',
        code: 'INVALID_2FA_CODE'
      });
      return;
    }

    // Update last login time
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        loginAttempts: 0,
        lockedUntil: null
      }
    });

    // Generate full JWT token
    const tokenData = generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role
    });

    // Log successful 2FA login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        companyId: user.companyId,
        action: 'LOGIN',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || 'Unknown',
        success: true,
        details: JSON.stringify({ method: '2FA' })
      }
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
        ssoProvider: user.ssoProvider,
        company: {
          id: user.company.id,
          name: user.company.name,
          industry: user.company.industry,
          employees: user.company.employees,
          subscriptionStatus: user.company.subscriptionStatus,
          subscriptionTier: user.company.subscriptionTier
        }
      }
    });

  } catch (error) {
    console.error('2FA login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during 2FA login',
      code: 'INTERNAL_ERROR'
    });
  }
};
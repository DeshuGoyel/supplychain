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
      // Calculate trial dates
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const company = await tx.company.create({
        data: {
          name: companyName,
          industry,
          employees: 1,
          subscriptionStatus: 'trial',
          subscriptionTier: 'starter',
          trialStart,
          trialEnd
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

      // Create referral program
      const referralCode = `${companyName.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(7)}`;
      await tx.referralProgram.create({
        data: {
          companyId: company.id,
          referralCode
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

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
      return;
    }

    // Generate JWT token
    const tokenData = generateToken({
      userId: user.id,
      companyId: user.companyId,
      email: user.email,
      role: user.role
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
        company: {
          id: user.company.id,
          name: user.company.name,
          industry: user.company.industry,
          employees: user.company.employees
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
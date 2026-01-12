import { Router, Request, Response } from 'express';
import { signup, login, login2FA } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new user with company
 * @access  Public
 * @body    { email, password, name, companyName, industry }
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/login/2fa
 * @desc    Complete login with 2FA
 * @access  Public
 * @body    { userId, code }
 */
router.post('/login/2fa', login2FA);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (stateless)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.post('/logout', authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    if (user) {
      console.log(`User ${user.email} logged out at ${new Date().toISOString()}`);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    // Import PrismaClient here to avoid circular dependencies
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Get fresh user data from database
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        company: true
      }
    });

    if (!userData) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        companyId: userData.companyId,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        company: {
          id: userData.company.id,
          name: userData.company.name,
          industry: userData.company.industry,
          employees: userData.company.employees,
          createdAt: userData.company.createdAt,
          updatedAt: userData.company.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @headers Authorization: Bearer <token>
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
        code: 'MISSING_PASSWORDS'
      });
      return;
    }

    // Import required utilities
    const { validatePassword, comparePassword, hashPassword } = await import('../utils/auth');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        message: 'New password does not meet requirements',
        code: 'WEAK_PASSWORD',
        errors: passwordValidation.errors
      });
      return;
    }

    // Get current user with password
    const userData = await prisma.user.findUnique({
      where: { id: user.userId }
    });

    if (!userData) {
      res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, userData.password);
    
    if (!isCurrentPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
      return;
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.userId },
      data: { password: hashedNewPassword }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * @route   GET /api/auth/verify
 * @desc    Verify token validity (alternative to /me for token validation)
 * @access  Private
 * @headers Authorization: Bearer <token>
 */
router.get('/verify', authMiddleware, (req, res) => {
  const user = (req as any).user;
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    user: user
  });
});

export default router;
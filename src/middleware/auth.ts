import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

/**
 * Authentication middleware to verify JWT tokens
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization header is required',
        code: 'MISSING_AUTH_HEADER'
      });
      return;
    }

    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Invalid authorization header format. Expected: Bearer <token>',
        code: 'INVALID_AUTH_FORMAT'
      });
      return;
    }

    // Verify and decode the token
    const decoded = verifyToken(token);
    
    // Attach user information to request object
    (req as any).user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    
    if (message.includes('expired')) {
      res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid or malformed token',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      // No token provided, continue without authentication
      return next();
    }

    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      // Invalid token format, continue without authentication
      return next();
    }

    // Verify and decode the token
    const decoded = verifyToken(token);
    
    // Attach user information to request object
    (req as any).user = {
      userId: decoded.userId,
      companyId: decoded.companyId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    // Token verification failed, continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware factory
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: user.role
      });
      return;
    }

    next();
  };
};

// Export alias for convenience
export const authenticate = authMiddleware;
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  companyId: string;
  email: string;
  role: string;
  twoFactorPending?: boolean;
  twoFactorVerified?: boolean;
}

interface TokenData {
  token: string;
  expiresIn: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a JWT token for a user
 * @param payload - User data to include in token
 * @returns Object with token and expiration info
 */
export const generateToken = (payload: JWTPayload, options?: { expiresIn?: string }): TokenData => {
  try {
    const expiresIn = options?.expiresIn || JWT_EXPIRES_IN;

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn,
      issuer: 'supplychain-ai',
      audience: 'supplychain-users'
    } as jwt.SignOptions);

    return {
      token,
      expiresIn
    };
  } catch (error) {
    throw new Error('Failed to generate JWT token');
  }
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns JWTPayload - Decoded token payload
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'supplychain-ai',
      audience: 'supplychain-users'
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
};

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns string | null - Extracted token or null if invalid format
 */
export const extractTokenFromHeader = (authHeader: string): string | null => {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
};

/**
 * Generate a refresh token (for future implementation)
 * @param payload - User data to include in refresh token
 * @returns string - Refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  try {
    const refreshToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: '30d',
      issuer: 'supplychain-ai',
      audience: 'supplychain-users'
    } as jwt.SignOptions);

    return refreshToken;
  } catch (error) {
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Check if a token is expired without verifying signature
 * @param token - JWT token to check
 * @returns boolean - True if expired, false otherwise
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};
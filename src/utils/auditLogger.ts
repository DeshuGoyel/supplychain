import { Request } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  companyId?: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData, req?: Request): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          companyId: data.companyId,
          action: data.action,
          ipAddress: data.ipAddress || req?.ip || req?.connection.remoteAddress,
          userAgent: data.userAgent || req?.get('User-Agent') || 'Unknown',
          success: data.success,
          details: data.details ? JSON.stringify(data.details) : null
        }
      });
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(
    userId: string,
    companyId: string,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
    req: Request,
    success: boolean,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action,
      success,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      }
    }, req);
  }

  /**
   * Log SSO events
   */
  static async logSSO(
    userId: string,
    companyId: string,
    action: 'SSO_ATTEMPT' | 'SSO_SUCCESS' | 'SSO_FAILED' | 'SSO_CONFIGURED' | 'SSO_DISABLED',
    req: Request,
    success: boolean,
    provider?: string,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action,
      success,
      details: {
        provider,
        ...details
      }
    }, req);
  }

  /**
   * Log 2FA events
   */
  static async log2FA(
    userId: string,
    companyId: string,
    action: '2FA_ENABLED' | '2FA_DISABLED' | '2FA_VERIFIED' | '2FA_FAILED',
    req: Request,
    success: boolean,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action,
      success,
      details
    }, req);
  }

  /**
   * Log billing events
   */
  static async logBilling(
    userId: string,
    companyId: string,
    action: 'SUBSCRIPTION_CREATED' | 'SUBSCRIPTION_UPDATED' | 'SUBSCRIPTION_CANCELLED' | 'PAYMENT_SUCCEEDED' | 'PAYMENT_FAILED',
    req: Request,
    success: boolean,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action,
      success,
      details
    }, req);
  }

  /**
   * Log white-label events
   */
  static async logWhiteLabel(
    userId: string,
    companyId: string,
    action: 'WHITELABEL_UPDATED' | 'LOGO_UPLOADED' | 'FAVICON_UPLOADED' | 'DOMAIN_CONFIGURED',
    req: Request,
    success: boolean,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action,
      success,
      details
    }, req);
  }

  /**
   * Log data access events
   */
  static async logDataAccess(
    userId: string,
    companyId: string,
    resource: string,
    action: 'VIEW' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT',
    req: Request,
    success: boolean,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action: `DATA_${action}`,
      success,
      details: {
        resource,
        resourceId,
        ...details
      }
    }, req);
  }

  /**
   * Log security events
   */
  static async logSecurity(
    userId: string,
    companyId: string,
    action: 'PASSWORD_CHANGED' | 'SECURITY_SETTINGS_UPDATED' | 'SUSPICIOUS_ACTIVITY' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED',
    req: Request,
    success: boolean,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action,
      success,
      details
    }, req);
  }

  /**
   * Log admin events
   */
  static async logAdmin(
    userId: string,
    companyId: string,
    action: 'USER_CREATED' | 'USER_UPDATED' | 'USER_DELETED' | 'ROLE_CHANGED' | 'COMPANY_SETTINGS_UPDATED',
    req: Request,
    success: boolean,
    targetUserId?: string,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action,
      success,
      details: {
        targetUserId,
        ...details
      }
    }, req);
  }

  /**
   * Log API events
   */
  static async logAPI(
    userId: string,
    companyId: string,
    endpoint: string,
    method: string,
    req: Request,
    success: boolean,
    responseCode: number,
    duration?: number,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action: 'API_CALL',
      success,
      details: {
        endpoint,
        method,
        responseCode,
        duration,
        ...details
      }
    }, req);
  }

  /**
   * Log error events
   */
  static async logError(
    userId: string,
    companyId: string,
    errorType: string,
    errorMessage: string,
    req: Request,
    details?: any
  ): Promise<void> {
    await this.log({
      userId,
      companyId,
      action: 'ERROR',
      success: false,
      details: {
        errorType,
        errorMessage,
        stack: details?.stack,
        ...details
      }
    }, req);
  }
}
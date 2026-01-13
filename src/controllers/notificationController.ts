import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { notificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const setNotificationPreferences = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, companyId } = req.user;
    const preferences = req.body;

    const notificationTypes = [
      'LOW_INVENTORY',
      'LATE_ORDER',
      'SUPPLIER_ALERT',
      'APPROVAL_NEEDED',
      'DAILY_DIGEST',
      'WEEKLY_REPORT',
    ];

    for (const type of notificationTypes) {
      const pref = preferences[type] || {};
      await prisma.notificationPreference.upsert({
        where: {
          userId_notificationType: {
            userId,
            notificationType: type,
          },
        },
        update: {
          enabled: pref.enabled !== undefined ? pref.enabled : true,
          frequency: pref.frequency || 'immediate',
          email: pref.email !== undefined ? pref.email : true,
        },
        create: {
          userId,
          companyId,
          notificationType: type,
          enabled: pref.enabled !== undefined ? pref.enabled : true,
          frequency: pref.frequency || 'immediate',
          email: pref.email !== undefined ? pref.email : true,
        },
      });
    }

    const allPreferences = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    res.json({
      success: true,
      data: allPreferences,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationPreferences = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.user;

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    const formattedPreferences = preferences.reduce((acc: any, pref) => {
      acc[pref.notificationType] = {
        enabled: pref.enabled,
        frequency: pref.frequency,
        email: pref.email,
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: formattedPreferences,
    });
  } catch (error) {
    next(error);
  }
};

export const sendTestEmail = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, email, name, companyId } = req.user;

    const subject = 'Test Email from Supply Chain AI';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Test Email</h1>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>This is a test email from Supply Chain AI Control Assistant.</p>
      <p>If you received this email, your notification settings are working correctly!</p>
    </div>
  </div>
</body>
</html>
    `;

    const success = await notificationService.sendEmail(email, subject, html);

    await notificationService.logNotification(
      userId,
      companyId,
      'TEST',
      email,
      subject,
      html,
      { type: 'test_email' },
      success ? 'sent' : 'failed'
    );

    res.json({
      success,
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationHistory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, companyId, role } = req.user;
    const { limit = 50, offset = 0, type } = req.query;

    const where: any = { companyId };

    if (role !== 'MANAGER') {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    const notifications = await prisma.notificationLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.notificationLog.count({ where });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const sendDigest = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { type } = req.params;

    if (type === 'daily') {
      await notificationService.sendDailyDigest(companyId);
    } else if (type === 'weekly') {
      await notificationService.sendWeeklyDigest(companyId);
    } else {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Type must be daily or weekly',
        },
      });
      return;
    }

    res.json({
      success: true,
      message: `${type} digest sent successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export const getNotificationStats = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const total = await prisma.notificationLog.count({ where: { companyId } });
    const sent = await prisma.notificationLog.count({ where: { companyId, status: 'sent' } });
    const failed = await prisma.notificationLog.count({ where: { companyId, status: 'failed' } });
    const pending = await prisma.notificationLog.count({ where: { companyId, status: 'pending' } });

    const byType = await prisma.notificationLog.groupBy({
      by: ['type'],
      where: { companyId },
      _count: { type: true },
    });

    const recent = await prisma.notificationLog.findMany({
      where: { companyId },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        total,
        sent,
        failed,
        pending,
        successRate: total > 0 ? ((sent / total) * 100).toFixed(1) : 0,
        byType: byType.map(t => ({
          type: t.type,
          count: t._count.type,
        })),
        recent,
      },
    });
  } catch (error) {
    next(error);
  }
};

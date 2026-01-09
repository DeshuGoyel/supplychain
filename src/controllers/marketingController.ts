import { Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get email preferences
 * GET /api/marketing/preferences
 */
export const getEmailPreferences = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId: string = req.user.companyId;

    let preferences = await prisma.emailPreferences.findUnique({
      where: { companyId }
    });

    if (!preferences) {
      preferences = await prisma.emailPreferences.create({
        data: { companyId }
      });
    }

    res.status(200).json({
      success: true,
      preferences
    });
  } catch (error: any) {
    console.error('Get email preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email preferences',
      error: error.message
    });
  }
};

/**
 * Update email preferences
 * POST /api/marketing/preferences
 */
export const updateEmailPreferences = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId: string = req.user.companyId;
    const {
      receiveEmails,
      emailFrequency,
      announcements,
      tips,
      caseStudies,
      productUpdates,
      marketingEmails
    } = req.body;

    const preferences = await prisma.emailPreferences.upsert({
      where: { companyId },
      update: {
        receiveEmails,
        emailFrequency,
        announcements,
        tips,
        caseStudies,
        productUpdates,
        marketingEmails
      },
      create: {
        companyId,
        receiveEmails: receiveEmails ?? true,
        emailFrequency: emailFrequency ?? 'weekly',
        announcements: announcements ?? true,
        tips: tips ?? true,
        caseStudies: caseStudies ?? true,
        productUpdates: productUpdates ?? true,
        marketingEmails: marketingEmails ?? false
      }
    });

    res.status(200).json({
      success: true,
      preferences
    });
  } catch (error: any) {
    console.error('Update email preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email preferences',
      error: error.message
    });
  }
};

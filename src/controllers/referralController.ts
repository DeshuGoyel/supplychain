import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '../utils/email';

const prisma = new PrismaClient();

/**
 * Get referral code and stats
 * GET /api/referral/code
 */
export const getReferralCode = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId = req.user.companyId;

    let referralProgram = await prisma.referralProgram.findUnique({
      where: { companyId },
      include: {
        conversions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!referralProgram) {
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });

      if (!company) {
        res.status(404).json({ success: false, message: 'Company not found' });
        return;
      }

      const referralCode = `${company.name.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substring(7)}`;
      referralProgram = await prisma.referralProgram.create({
        data: {
          companyId,
          referralCode
        },
        include: {
          conversions: true
        }
      });
    }

    res.status(200).json({
      success: true,
      referralCode: referralProgram.referralCode,
      totalReferrals: referralProgram.totalReferrals,
      creditEarned: referralProgram.creditEarned,
      conversions: referralProgram.conversions
    });
  } catch (error: any) {
    console.error('Get referral code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral code',
      error: error.message
    });
  }
};

/**
 * Get referral leaderboard
 * GET /api/referral/leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const leaderboard = await prisma.referralProgram.findMany({
      where: {
        totalReferrals: { gt: 0 }
      },
      include: {
        company: {
          select: { name: true }
        }
      },
      orderBy: { totalReferrals: 'desc' },
      take: 10
    });

    res.status(200).json({
      success: true,
      leaderboard: leaderboard.map(item => ({
        companyName: item.company.name,
        totalReferrals: item.totalReferrals,
        creditEarned: item.creditEarned
      }))
    });
  } catch (error: any) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
      error: error.message
    });
  }
};

/**
 * Get referral stats
 * GET /api/referral/stats
 */
export const getReferralStats = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId: string = req.user.companyId;

    const referralProgram = await prisma.referralProgram.findUnique({
      where: { companyId },
      include: {
        conversions: true
      }
    });

    if (!referralProgram) {
      res.status(200).json({
        success: true,
        stats: {
          totalReferrals: 0,
          creditEarned: 0,
          pending: 0,
          approved: 0,
          paid: 0
        }
      });
      return;
    }

    const counts = referralProgram.conversions.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    res.status(200).json({
      success: true,
      stats: {
        totalReferrals: referralProgram.totalReferrals,
        creditEarned: referralProgram.creditEarned,
        pending: counts.pending || 0,
        approved: counts.approved || 0,
        paid: counts.paid || 0
      }
    });
  } catch (error: any) {
    console.error('Get referral stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral stats',
      error: error.message
    });
  }
};

/**
 * Get referral conversions
 * GET /api/referral/conversions
 */
export const getReferralConversions = async (req: any, res: Response): Promise<void> => {
  try {
    const companyId: string = req.user.companyId;

    const referralProgram = await prisma.referralProgram.findUnique({
      where: { companyId }
    });

    if (!referralProgram) {
      res.status(200).json({
        success: true,
        conversions: []
      });
      return;
    }

    const conversions = await prisma.referralConversion.findMany({
      where: { referralProgramId: referralProgram.id },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      conversions
    });
  } catch (error: any) {
    console.error('Get referral conversions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversions',
      error: error.message
    });
  }
};

/**
 * Apply referral code
 * POST /api/referral/claim
 */
export const claimReferral = async (req: any, res: Response): Promise<void> => {
  try {
    const { referralCode } = req.body;
    const companyId = req.user.companyId;

    if (!referralCode) {
      res.status(400).json({
        success: false,
        message: 'Referral code required'
      });
      return;
    }

    const referralProgram = await prisma.referralProgram.findUnique({
      where: { referralCode },
      include: { company: true }
    });

    if (!referralProgram) {
      res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
      return;
    }

    if (referralProgram.companyId === companyId) {
      res.status(400).json({
        success: false,
        message: 'Cannot use your own referral code'
      });
      return;
    }

    // Check if already claimed
    const existingConversion = await prisma.referralConversion.findFirst({
      where: {
        referralProgramId: referralProgram.id,
        referredCompanyId: companyId
      }
    });

    if (existingConversion) {
      res.status(400).json({
        success: false,
        message: 'Referral code already applied'
      });
      return;
    }

    const user = await prisma.user.findFirst({
      where: { companyId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Create conversion record
    const creditAmount = 500;
    await prisma.referralConversion.create({
      data: {
        referralProgramId: referralProgram.id,
        referralCode,
        referredCompanyId: companyId,
        referredEmail: user.email,
        creditApplied: creditAmount,
        status: 'approved',
        convertedAt: new Date()
      }
    });

    // Update referral program
    await prisma.referralProgram.update({
      where: { id: referralProgram.id },
      data: {
        totalReferrals: { increment: 1 },
        creditEarned: { increment: creditAmount }
      }
    });

    // Send email to referrer
    const referrerUser = await prisma.user.findFirst({
      where: { companyId: referralProgram.companyId }
    });

    if (referrerUser) {
      await sendEmail({
        to: referrerUser.email,
        ...emailTemplates.referralBonus(referrerUser.name, creditAmount)
      });
    }

    res.status(200).json({
      success: true,
      message: 'Referral code applied successfully',
      creditApplied: creditAmount
    });
  } catch (error: any) {
    console.error('Claim referral error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim referral',
      error: error.message
    });
  }
};

/**
 * Get public referral info (no auth required)
 * GET /api/referral/public/:code
 */
export const getPublicReferralInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;

    if (!code) {
      res.status(400).json({ success: false, message: 'Referral code required' });
      return;
    }

    const referralProgram = await prisma.referralProgram.findUnique({
      where: { referralCode: code },
      include: {
        company: {
          select: { name: true }
        }
      }
    });

    if (!referralProgram) {
      res.status(404).json({
        success: false,
        message: 'Invalid referral code'
      });
      return;
    }

    res.status(200).json({
      success: true,
      referralCode: code,
      companyName: referralProgram.company.name,
      valid: true
    });
  } catch (error: any) {
    console.error('Get public referral info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get referral info',
      error: error.message
    });
  }
};

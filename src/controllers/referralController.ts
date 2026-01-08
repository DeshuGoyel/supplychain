import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendEmail, emailTemplates } from '../utils/email';

const prisma = new PrismaClient();

const REFERRAL_CREDIT = 500;

// Generate random referral code
function generateReferralCode(companyName: string): string {
  const sanitized = companyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${sanitized.substring(0, 4)}${random}`;
}

// Get or create referral code
export async function getReferralCode(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;

    let referralProgram = await prisma.referralProgram.findUnique({
      where: { companyId },
    });

    if (!referralProgram) {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      let referralCode = generateReferralCode(company.name);
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        const existing = await prisma.referralProgram.findUnique({
          where: { referralCode },
        });
        if (!existing) {
          isUnique = true;
        } else {
          referralCode = generateReferralCode(company.name);
          attempts++;
        }
      }

      referralProgram = await prisma.referralProgram.create({
        data: {
          companyId,
          referralCode,
        },
      });
    }

    const referralUrl = `${process.env.FRONTEND_URL}/signup?ref=${referralProgram.referralCode}`;

    res.json({
      referralCode: referralProgram.referralCode,
      referralUrl,
      totalReferrals: referralProgram.totalReferrals,
      creditEarned: referralProgram.creditEarned,
    });
  } catch (error: any) {
    console.error('Error getting referral code:', error);
    res.status(500).json({ error: error.message || 'Failed to get referral code' });
  }
}

// Get referral stats
export async function getReferralStats(req: Request, res: Response) {
  try {
    const companyId = (req as any).user.companyId;

    const referralProgram = await prisma.referralProgram.findUnique({
      where: { companyId },
    });

    if (!referralProgram) {
      return res.json({
        totalReferrals: 0,
        creditEarned: 0,
        conversions: [],
      });
    }

    const conversions = await prisma.referralConversion.findMany({
      where: { referralCode: referralProgram.referralCode },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      totalReferrals: referralProgram.totalReferrals,
      creditEarned: referralProgram.creditEarned,
      conversions: conversions.map((c) => ({
        id: c.id,
        status: c.status,
        creditApplied: c.creditApplied,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error getting referral stats:', error);
    res.status(500).json({ error: error.message || 'Failed to get referral stats' });
  }
}

// Get referral leaderboard
export async function getReferralLeaderboard(req: Request, res: Response) {
  try {
    const leaderboard = await prisma.referralProgram.findMany({
      orderBy: { totalReferrals: 'desc' },
      take: 10,
    });

    res.json({
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        companyName: 'Company #' + (index + 1), // Hide company names for privacy
        totalReferrals: entry.totalReferrals,
        creditEarned: entry.creditEarned,
      })),
    });
  } catch (error: any) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ error: error.message || 'Failed to get leaderboard' });
  }
}

// Apply referral code during signup
export async function applyReferralCode(req: Request, res: Response) {
  try {
    const { referralCode } = req.body;
    const companyId = (req as any).user.companyId;

    // Check if referral code exists
    const referralProgram = await prisma.referralProgram.findUnique({
      where: { referralCode },
    });

    if (!referralProgram) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    // Check if company has already used a referral code
    const existingConversion = await prisma.referralConversion.findUnique({
      where: { referredCompanyId: companyId },
    });

    if (existingConversion) {
      return res.status(400).json({ error: 'Referral code already applied' });
    }

    // Create referral conversion
    await prisma.referralConversion.create({
      data: {
        referralCode,
        referredCompanyId: companyId,
        creditApplied: REFERRAL_CREDIT,
        status: 'pending',
      },
    });

    res.json({
      success: true,
      message: `$${REFERRAL_CREDIT} credit will be applied after your first payment`,
    });
  } catch (error: any) {
    console.error('Error applying referral code:', error);
    res.status(500).json({ error: error.message || 'Failed to apply referral code' });
  }
}

// Process referral conversion (called after first payment)
export async function processReferralConversion(companyId: string) {
  try {
    const conversion = await prisma.referralConversion.findUnique({
      where: { referredCompanyId: companyId },
    });

    if (!conversion || conversion.status !== 'pending') {
      return;
    }

    // Update conversion status
    await prisma.referralConversion.update({
      where: { id: conversion.id },
      data: { status: 'approved' },
    });

    // Update referral program
    await prisma.referralProgram.update({
      where: { referralCode: conversion.referralCode },
      data: {
        totalReferrals: { increment: 1 },
        creditEarned: { increment: REFERRAL_CREDIT },
      },
    });

    // Send email to referrer
    const referralProgram = await prisma.referralProgram.findUnique({
      where: { referralCode: conversion.referralCode },
    });

    if (referralProgram) {
      const company = await prisma.company.findUnique({
        where: { id: referralProgram.companyId },
        include: { users: { take: 1 } },
      });

      if (company?.users[0]) {
        await sendEmail({
          to: company.users[0].email,
          ...emailTemplates.referralBonus(company.users[0].name, REFERRAL_CREDIT),
        });
      }
    }
  } catch (error) {
    console.error('Error processing referral conversion:', error);
  }
}

// Get public referral info
export async function getPublicReferralInfo(req: Request, res: Response) {
  try {
    const { code } = req.params;

    const referralProgram = await prisma.referralProgram.findUnique({
      where: { referralCode: code },
    });

    if (!referralProgram) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }

    res.json({
      valid: true,
      credit: REFERRAL_CREDIT,
    });
  } catch (error: any) {
    console.error('Error getting public referral info:', error);
    res.status(500).json({ error: error.message || 'Failed to get referral info' });
  }
}

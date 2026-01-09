import express from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getReferralCode,
  getLeaderboard,
  claimReferral,
  getPublicReferralInfo,
  getReferralStats,
  getReferralConversions
} from '../controllers/referralController';

const router = express.Router();

// Public route
router.get('/public/:code', getPublicReferralInfo);

// Authenticated routes
router.get('/code', authMiddleware, getReferralCode);
router.get('/stats', authMiddleware, getReferralStats);
router.get('/conversions', authMiddleware, getReferralConversions);
router.get('/leaderboard', authMiddleware, getLeaderboard);
router.post('/claim', authMiddleware, claimReferral);

export default router;

import { Router } from 'express';
import {
  getReferralCode,
  getReferralStats,
  getReferralLeaderboard,
  applyReferralCode,
  getPublicReferralInfo,
} from '../controllers/referralController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/code', authenticate, getReferralCode);
router.get('/stats', authenticate, getReferralStats);
router.get('/leaderboard', getReferralLeaderboard);
router.post('/claim', authenticate, applyReferralCode);
router.get('/public/:code', getPublicReferralInfo);

export default router;

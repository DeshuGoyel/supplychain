import express from 'express';
import { authMiddleware } from '../middleware/auth';
import { getEmailPreferences, updateEmailPreferences } from '../controllers/marketingController';

const router = express.Router();

router.get('/preferences', authMiddleware, getEmailPreferences);
router.post('/preferences', authMiddleware, updateEmailPreferences);

export default router;

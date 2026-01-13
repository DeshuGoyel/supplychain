import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as notificationController from '../controllers/notificationController';

const router = express.Router();

router.use(authenticateToken);

router.post('/preferences', notificationController.setNotificationPreferences);
router.get('/preferences', notificationController.getNotificationPreferences);
router.post('/test', notificationController.sendTestEmail);
router.get('/history', notificationController.getNotificationHistory);
router.get('/stats', notificationController.getNotificationStats);
router.post('/digest/:type', notificationController.sendDigest);

export default router;

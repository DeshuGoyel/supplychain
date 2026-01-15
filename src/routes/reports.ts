import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as reportController from '../controllers/reportController';

const router = express.Router();

router.use(authenticateToken);

router.post('/generate', reportController.generateReport);
router.post('/schedule', reportController.scheduleReport);
router.get('/scheduled', reportController.getScheduledReports);
router.delete('/scheduled/:id', reportController.deleteScheduledReport);
router.get('/templates', reportController.getReportTemplates);

export default router;

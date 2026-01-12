import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { acceptLegalDocument, getLegalDocuments, getLegalVersions, publishLegalVersion } from '../controllers/legalController';

const router = Router();

router.get('/documents', getLegalDocuments);
router.post('/accept', authMiddleware, acceptLegalDocument);
router.get('/versions', authMiddleware, requireRole(['MANAGER']), getLegalVersions);
router.post('/versions', authMiddleware, requireRole(['MANAGER']), publishLegalVersion);

export default router;

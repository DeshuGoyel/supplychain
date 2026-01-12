import { Router } from 'express';
import { 
  getPublicDocuments,
  getDocumentByType,
  acceptDocument,
  getUserAcceptances,
  createDocument,
  getAllDocuments,
  deleteDocument
} from '../controllers/legalController';
import { authMiddleware, requireRole } from '../middleware/auth';

const router = Router();

// Public routes (for acceptance check)
router.get('/public', getPublicDocuments);
router.get('/public/:type', getDocumentByType);

// Protected routes
router.post('/accept', authMiddleware, acceptDocument);
router.get('/acceptances', authMiddleware, getUserAcceptances);

// Admin routes (MANAGER only)
router.get('/admin', authMiddleware, requireRole(['MANAGER']), getAllDocuments);
router.post('/admin', authMiddleware, requireRole(['MANAGER']), createDocument);
router.delete('/admin/:id', authMiddleware, requireRole(['MANAGER']), deleteDocument);

export default router;

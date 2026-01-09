import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, requireRole } from '../middleware/auth';
import { auditAdminActions } from '../middleware/auditLogger';
import {
  deleteDomain,
  getPublicWhiteLabelConfig,
  getWhiteLabelConfig,
  setupDomain,
  uploadFavicon,
  uploadLogo,
  upsertWhiteLabelConfig,
  verifyDomain,
} from '../controllers/whitelabelController';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image uploads are allowed'));
  },
});

router.get('/public', getPublicWhiteLabelConfig);

router.get('/config', authMiddleware, requireRole(['MANAGER']), getWhiteLabelConfig);
router.post('/config', authMiddleware, requireRole(['MANAGER']), auditAdminActions, upsertWhiteLabelConfig);

router.post('/logo', authMiddleware, requireRole(['MANAGER']), auditAdminActions, upload.single('file'), uploadLogo);
router.post('/favicon', authMiddleware, requireRole(['MANAGER']), auditAdminActions, upload.single('file'), uploadFavicon);

router.post('/domain', authMiddleware, requireRole(['MANAGER']), auditAdminActions, setupDomain);
router.post('/verify-domain', authMiddleware, requireRole(['MANAGER']), auditAdminActions, verifyDomain);
router.delete('/domain', authMiddleware, requireRole(['MANAGER']), auditAdminActions, deleteDomain);

export default router;

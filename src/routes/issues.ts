import { Router } from 'express';
import { getIssues, updateIssue } from '../controllers/issueController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/issues
 * @desc    Get issues
 * @access  Private
 */
router.get('/', getIssues);

/**
 * @route   PATCH /api/issues/:id
 * @desc    Update issue (acknowledge/resolve)
 * @access  Private
 */
router.patch('/:id', updateIssue);

export default router;

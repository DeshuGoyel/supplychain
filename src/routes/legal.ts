import express, { Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { auditLogMiddleware } from '../middleware/auditLog';
import {
  getLegalDocument,
  createEnterpriseAgreement,
  signEnterpriseAgreement,
  getEnterpriseAgreements,
} from '../services/legal';

const router = express.Router();

// Get Terms of Service (public)
router.get('/terms', (req: Request, res: Response) => {
  try {
    const content = getLegalDocument('terms');
    
    res.json({
      success: true,
      data: {
        type: 'terms',
        title: 'Terms of Service',
        content,
        effectiveDate: '2025-01-01',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Get Privacy Policy (public)
router.get('/privacy', (req: Request, res: Response) => {
  try {
    const content = getLegalDocument('privacy');
    
    res.json({
      success: true,
      data: {
        type: 'privacy',
        title: 'Privacy Policy',
        content,
        effectiveDate: '2025-01-01',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Get Data Processing Agreement (public)
router.get('/dpa', (req: Request, res: Response) => {
  try {
    const content = getLegalDocument('dpa');
    
    res.json({
      success: true,
      data: {
        type: 'dpa',
        title: 'Data Processing Agreement',
        content,
        effectiveDate: '2025-01-01',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Get Service Level Agreement (public)
router.get('/sla', (req: Request, res: Response) => {
  try {
    const content = getLegalDocument('sla');
    
    res.json({
      success: true,
      data: {
        type: 'sla',
        title: 'Service Level Agreement',
        content,
        effectiveDate: '2025-01-01',
        uptime: '99.9%',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Get Acceptable Use Policy (public)
router.get('/aup', (req: Request, res: Response) => {
  try {
    const content = getLegalDocument('aup');
    
    res.json({
      success: true,
      data: {
        type: 'aup',
        title: 'Acceptable Use Policy',
        content,
        effectiveDate: '2025-01-01',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Create enterprise agreement (authenticated)
router.post(
  '/agreements',
  authMiddleware,
  auditLogMiddleware('CREATE', 'EnterpriseAgreement'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId } = (req as any).user;
      const { agreementType } = req.body;

      if (!agreementType || !['MSA', 'DPA'].includes(agreementType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid agreement type. Must be MSA or DPA',
        });
        return;
      }

      const agreement = await createEnterpriseAgreement(companyId, agreementType);

      res.json({
        success: true,
        data: agreement,
        message: 'Enterprise agreement created successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create agreement';
      const statusCode = message.includes('enterprise tier') ? 403 : 500;
      
      res.status(statusCode).json({
        success: false,
        message,
      });
    }
  }
);

// Get enterprise agreements (authenticated)
router.get('/agreements', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;

    const agreements = await getEnterpriseAgreements(companyId);

    res.json({
      success: true,
      data: agreements,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agreements';
    res.status(500).json({
      success: false,
      message,
    });
  }
});

// Sign enterprise agreement (authenticated)
router.post(
  '/agreements/:id/sign',
  authMiddleware,
  auditLogMiddleware('UPDATE', 'EnterpriseAgreement'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyId } = (req as any).user;
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Agreement ID is required',
        });
        return;
      }

      const agreement = await signEnterpriseAgreement(id, companyId);

      res.json({
        success: true,
        data: agreement,
        message: 'Enterprise agreement signed successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign agreement';
      res.status(500).json({
        success: false,
        message,
      });
    }
  }
);

export default router;

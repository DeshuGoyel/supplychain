import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { themeService } from '../services/theme';
import { auditLogService } from '../services/auditLog';

const router = Router();

router.use(authMiddleware);

router.get('/theme', async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const theme = await themeService.getThemeConfig(companyId);

    res.json({
      success: true,
      data: theme
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get theme configuration'
    });
  }
});

router.put('/theme', async (req: Request, res: Response) => {
  try {
    const { companyId, userId } = (req as any).user;
    const config = req.body;

    const updatedTheme = await themeService.updateThemeConfig(companyId, config);

    const logEntry: any = {
      companyId,
      userId,
      action: 'UPDATE',
      resource: 'WhiteLabelConfig',
      changes: config,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    };

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      data: updatedTheme
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update theme configuration'
    });
    return;
  }
});

router.get('/theme/css', async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const theme = await themeService.getThemeConfig(companyId);

    if (!theme) {
      res.status(404).json({
        success: false,
        message: 'Theme configuration not found'
      });
      return;
    }

    const css = themeService.getThemeCSS(theme);
    res.setHeader('Content-Type', 'text/css');
    res.send(css);
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate theme CSS'
    });
    return;
  }
});

router.post('/domain', async (req: Request, res: Response) => {
  try {
    const { companyId, userId, role } = (req as any).user;

    if (role !== 'MANAGER') {
      res.status(403).json({
        success: false,
        message: 'Only managers can configure custom domains'
      });
      return;
    }

    const { domain } = req.body;

    const setup = await themeService.setupCustomDomain(companyId, domain);

    const logEntry: any = {
      companyId,
      userId,
      action: 'CREATE',
      resource: 'CustomDomainConfig',
      changes: { domain }
    };

    if (req.ip) logEntry.ipAddress = req.ip;
    if (req.get('user-agent')) logEntry.userAgent = req.get('user-agent');
    if (domain) logEntry.resourceId = domain;

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      data: setup
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to setup custom domain'
    });
    return;
  }
});

router.get('/domain', async (req: Request, res: Response) => {
  try {
    const { companyId } = (req as any).user;
    const domainConfig = await themeService.getDomainConfig(companyId);

    res.json({
      success: true,
      data: domainConfig
    });
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get domain configuration'
    });
    return;
  }
});

router.post('/domain/verify', async (req: Request, res: Response) => {
  try {
    const { companyId, userId, role } = (req as any).user;

    if (role !== 'MANAGER') {
      res.status(403).json({
        success: false,
        message: 'Only managers can verify custom domains'
      });
      return;
    }

    const { domain } = req.body;

    const result = await themeService.verifyDomain(companyId, domain);

    const logEntry: any = {
      companyId,
      userId,
      action: 'UPDATE',
      resource: 'CustomDomainConfig',
      changes: { status: result.verified ? 'active' : 'pending' }
    };

    if (req.ip) logEntry.ipAddress = req.ip;
    if (req.get('user-agent')) logEntry.userAgent = req.get('user-agent');
    if (domain) logEntry.resourceId = domain;

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      data: result
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify domain'
    });
    return;
  }
});

router.delete('/domain', async (req: Request, res: Response) => {
  try {
    const { companyId, userId, role } = (req as any).user;

    if (role !== 'MANAGER') {
      res.status(403).json({
        success: false,
        message: 'Only managers can remove custom domains'
      });
      return;
    }

    const { domain } = req.body;

    await themeService.removeCustomDomain(companyId, domain);

    const logEntry: any = {
      companyId,
      userId,
      action: 'DELETE',
      resource: 'CustomDomainConfig'
    };

    if (req.ip) logEntry.ipAddress = req.ip;
    if (req.get('user-agent')) logEntry.userAgent = req.get('user-agent');
    if (domain) logEntry.resourceId = domain;

    await auditLogService.log(logEntry);

    res.json({
      success: true,
      message: 'Custom domain removed successfully'
    });
    return;
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove custom domain'
    });
    return;
  }
});

export default router;

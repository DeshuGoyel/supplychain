import { Response, NextFunction } from 'express';
import { bulkOperationService } from '../services/bulkOperationService';

export const importInventory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId, userId } = req.user;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'CSV file is required',
        },
      });
      return;
    }

    const jobId = await bulkOperationService.processInventoryImport(
      companyId,
      req.file.buffer,
      userId
    );

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Import job started',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const importOrders = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId, userId } = req.user;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'CSV file is required',
        },
      });
      return;
    }

    const jobId = await bulkOperationService.processOrderImport(
      companyId,
      req.file.buffer,
      userId
    );

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Import job started',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const importSuppliers = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId, userId } = req.user;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'CSV file is required',
        },
      });
      return;
    }

    const jobId = await bulkOperationService.processSupplierImport(
      companyId,
      req.file.buffer,
      userId
    );

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Import job started',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkUpdateInventory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId, userId } = req.user;
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Updates array is required',
        },
      });
      return;
    }

    const jobId = await bulkOperationService.bulkUpdateInventory(
      companyId,
      updates,
      userId
    );

    res.json({
      success: true,
      data: {
        jobId,
        message: 'Bulk update job started',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobStatus = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { jobId } = req.params;

    const job = await bulkOperationService.getJobStatus(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

export const getJobResults = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { jobId } = req.params;

    const job = await bulkOperationService.getJobStatus(jobId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Job not found',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: job,
    });
  } catch (error) {
    next(error);
  }
};

export const exportInventory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const buffer = await bulkOperationService.exportInventory(companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-export.csv"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportOrders = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const buffer = await bulkOperationService.exportOrders(companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="orders-export.csv"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const exportSuppliers = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const buffer = await bulkOperationService.exportSuppliers(companyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="suppliers-export.csv"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getBulkJobs = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { limit = 50, offset = 0, status } = req.query;

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = { companyId };
    if (status) {
      where.status = status;
    }

    const jobs = await prisma.bulkOperation.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.bulkOperation.count({ where });

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

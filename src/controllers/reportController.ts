import { Response, NextFunction } from 'express';
import { reportService } from '../services/reportService';

export const generateReport = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId, userId } = req.user;
    const { reportType, format = 'pdf', filters } = req.body;

    if (!reportType) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'reportType is required',
        },
      });
      return;
    }

    if (!['pdf', 'excel', 'csv'].includes(format)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'format must be pdf, excel, or csv',
        },
      });
      return;
    }

    const { buffer, fileName, mimeType } = await reportService.generateReport(
      companyId,
      reportType,
      format,
      filters,
      userId
    );

    await reportService.logReportGeneration(companyId, reportType, format, fileName, buffer.length, userId);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const scheduleReport = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { reportType, schedule, email, filters } = req.body;

    if (!reportType || !schedule || !email) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'reportType, schedule, and email are required',
        },
      });
      return;
    }

    const scheduledReport = await reportService.scheduleReport(
      companyId,
      reportType,
      schedule,
      email,
      filters
    );

    res.json({
      success: true,
      data: scheduledReport,
    });
  } catch (error) {
    next(error);
  }
};

export const getScheduledReports = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const reports = await reportService.getScheduledReports(companyId);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteScheduledReport = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    await reportService.deleteScheduledReport(id, companyId);

    res.json({
      success: true,
      message: 'Scheduled report deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getReportTemplates = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const templates = [
      {
        type: 'monthly_performance',
        name: 'Monthly Performance Report',
        description: 'Comprehensive monthly KPI and performance analysis',
        formats: ['pdf', 'excel', 'csv'],
        filters: {
          month: {
            type: 'select',
            options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
          },
          year: {
            type: 'number',
          },
        },
      },
      {
        type: 'supplier',
        name: 'Supplier Report',
        description: 'Supplier performance scorecards and rankings',
        formats: ['pdf', 'excel', 'csv'],
        filters: {
          supplierId: {
            type: 'select',
            label: 'Supplier',
          },
        },
      },
      {
        type: 'inventory',
        name: 'Inventory Report',
        description: 'Stock levels, aging analysis, and ABC classification',
        formats: ['pdf', 'excel', 'csv'],
      },
      {
        type: 'order',
        name: 'Order Report',
        description: 'Order history, on-time delivery, and delays',
        formats: ['pdf', 'excel', 'csv'],
      },
      {
        type: 'forecast',
        name: 'Forecast Report',
        description: 'Demand forecasts and accuracy metrics',
        formats: ['pdf', 'excel', 'csv'],
      },
      {
        type: 'custom',
        name: 'Custom Report',
        description: 'Create a report with custom filters',
        formats: ['pdf', 'excel', 'csv'],
      },
    ];

    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

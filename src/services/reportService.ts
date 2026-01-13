import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { Readable } from 'stream';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

let emailTransporter: nodemailer.Transporter | null = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

class ReportService {
  async generateReport(
    companyId: string,
    reportType: string,
    format: string,
    filters?: any,
    userId?: string
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const data = await this.getReportData(companyId, reportType, filters);

    if (format === 'pdf') {
      return await this.generatePDFReport(companyId, reportType, data);
    } else if (format === 'excel') {
      return await this.generateExcelReport(companyId, reportType, data);
    } else {
      return await this.generateCSVReport(companyId, reportType, data);
    }
  }

  private async getReportData(companyId: string, reportType: string, filters?: any): Promise<any> {
    switch (reportType) {
      case 'monthly_performance':
        return this.getMonthlyPerformanceData(companyId, filters);
      case 'supplier':
        return this.getSupplierData(companyId, filters);
      case 'inventory':
        return this.getInventoryData(companyId, filters);
      case 'order':
        return this.getOrderData(companyId, filters);
      case 'forecast':
        return this.getForecastData(companyId, filters);
      case 'custom':
        return this.getCustomData(companyId, filters);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async getMonthlyPerformanceData(companyId: string, filters?: any): Promise<any> {
    const now = new Date();
    const month = filters?.month || now.getMonth() + 1;
    const year = filters?.year || now.getFullYear();
    const period = `${year}-${String(month).padStart(2, '0')}`;

    const kpis = await prisma.kPI.findMany({
      where: { companyId, period },
    });

    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      orderBy: { performanceScore: 'desc' },
      take: 10,
    });

    const inventory = await prisma.inventory.findMany({
      where: { companyId },
    });

    const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const lowStockCount = inventory.filter(item => item.stockLevel === 'LOW').length;
    const outOfStockCount = inventory.filter(item => item.stockLevel === 'OUT_OF_STOCK').length;

    return {
      period,
      kpis,
      suppliers,
      inventory: {
        totalItems: inventory.length,
        totalValue,
        lowStockCount,
        outOfStockCount,
        stockHealth: Math.round(((inventory.length - lowStockCount - outOfStockCount) / inventory.length) * 100),
      },
    };
  }

  private async getSupplierData(companyId: string, filters?: any): Promise<any> {
    const supplierId = filters?.supplierId;

    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        include: { metrics: true, orders: true, purchaseOrders: true },
      });

      return { supplier };
    }

    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      include: { metrics: { take: 6, orderBy: { period: 'desc' } } },
    });

    return { suppliers };
  }

  private async getInventoryData(companyId: string, filters?: any): Promise<any> {
    const inventory = await prisma.inventory.findMany({
      where: { companyId },
      include: { supplier: true, location: true },
    });

    const agingAnalysis = await prisma.inventory.findMany({
      where: { companyId },
      select: {
        sku: true,
        name: true,
        quantity: true,
        unitCost: true,
        lastUpdated: true,
        turnoverRate: true,
      },
    });

    const abcAnalysis = agingAnalysis.map(item => ({
      ...item,
      value: item.quantity * item.unitCost,
      daysSinceUpdate: Math.floor((new Date().getTime() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24)),
    })).sort((a, b) => b.value - a.value);

    return {
      inventory,
      agingAnalysis,
      abcAnalysis,
    };
  }

  private async getOrderData(companyId: string, filters?: any): Promise<any> {
    const orders = await prisma.order.findMany({
      where: { companyId },
      include: { supplier: true },
    });

    const onTime = orders.filter(o => o.status === 'ON_TIME').length;
    const delayed = orders.filter(o => o.status === 'DELAYED').length;
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const completed = orders.filter(o => o.status === 'COMPLETED').length;

    return {
      orders,
      summary: {
        total: orders.length,
        onTime,
        delayed,
        pending,
        completed,
        onTimeRate: orders.length > 0 ? (onTime / orders.length) * 100 : 0,
      },
    };
  }

  private async getForecastData(companyId: string, filters?: any): Promise<any> {
    const forecasts = await prisma.forecastHistory.findMany({
      where: { companyId },
      take: 100,
      orderBy: { period: 'desc' },
    });

    const bySku = forecasts.reduce((acc, forecast) => {
      if (!acc[forecast.sku]) {
        acc[forecast.sku] = [];
      }
      acc[forecast.sku].push(forecast);
      return acc;
    }, {} as Record<string, any[]>);

    return {
      forecasts,
      bySku,
    };
  }

  private async getCustomData(companyId: string, filters?: any): Promise<any> {
    return { message: 'Custom report data placeholder', filters };
  }

  private async generatePDFReport(companyId: string, reportType: string, data: any): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          fileName: `${reportType}_report_${new Date().toISOString().split('T')[0]}.pdf`,
          mimeType: 'application/pdf',
        });
      });

      doc.fontSize(20).text('Supply Chain AI Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(reportType.replace(/_/g, ' ').toUpperCase(), { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(JSON.stringify(data, null, 2));

      doc.end();
    });
  }

  private async generateExcelReport(companyId: string, reportType: string, data: any): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(reportType);

    worksheet.addRow(['Report Type', reportType]);
    worksheet.addRow(['Generated', new Date().toLocaleString()]);
    worksheet.addRow([]);

    if (data.kpis && Array.isArray(data.kpis)) {
      worksheet.addRow(['KPIs']);
      worksheet.addRow(['Name', 'Value', 'Target', 'Trend', 'Status']);
      data.kpis.forEach((kpi: any) => {
        worksheet.addRow([kpi.name, kpi.value, kpi.target, kpi.trend, kpi.status]);
      });
      worksheet.addRow([]);
    }

    if (data.inventory && Array.isArray(data.inventory)) {
      worksheet.addRow(['Inventory']);
      worksheet.addRow(['SKU', 'Name', 'Quantity', 'Unit Cost', 'Total Value', 'Stock Level']);
      data.inventory.forEach((item: any) => {
        worksheet.addRow([item.sku, item.name, item.quantity, item.unitCost, item.quantity * item.unitCost, item.stockLevel]);
      });
      worksheet.addRow([]);
    }

    if (data.suppliers && Array.isArray(data.suppliers)) {
      worksheet.addRow(['Suppliers']);
      worksheet.addRow(['Name', 'On-Time Rate', 'Quality Rate', 'Lead Time', 'Performance Score']);
      data.suppliers.forEach((supplier: any) => {
        worksheet.addRow([supplier.name, supplier.onTimeRate, supplier.qualityRate, supplier.leadTime, supplier.performanceScore]);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      fileName: `${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  private async generateCSVReport(companyId: string, reportType: string, data: any): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    let csv = `Report Type,${reportType}\n`;
    csv += `Generated,${new Date().toLocaleString()}\n\n`;

    if (data.kpis && Array.isArray(data.kpis)) {
      csv += 'KPIs\n';
      csv += 'Name,Value,Target,Trend,Status\n';
      data.kpis.forEach((kpi: any) => {
        csv += `${kpi.name},${kpi.value},${kpi.target},${kpi.trend},${kpi.status}\n`;
      });
      csv += '\n';
    }

    if (data.inventory && Array.isArray(data.inventory)) {
      csv += 'Inventory\n';
      csv += 'SKU,Name,Quantity,Unit Cost,Total Value,Stock Level\n';
      data.inventory.forEach((item: any) => {
        csv += `${item.sku},"${item.name}",${item.quantity},${item.unitCost},${item.quantity * item.unitCost},${item.stockLevel}\n`;
      });
    }

    return {
      buffer: Buffer.from(csv),
      fileName: `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`,
      mimeType: 'text/csv',
    };
  }

  async scheduleReport(
    companyId: string,
    reportType: string,
    schedule: string,
    email: string,
    filters?: any
  ): Promise<any> {
    const nextRunAt = this.calculateNextRunDate(schedule);

    return await prisma.scheduledReport.create({
      data: {
        companyId,
        reportType,
        schedule,
        email,
        filters,
        nextRunAt,
      },
    });
  }

  private calculateNextRunDate(schedule: string): Date {
    const now = new Date();

    switch (schedule) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }

    now.setHours(8, 0, 0, 0);
    return now;
  }

  async getScheduledReports(companyId: string): Promise<any[]> {
    return await prisma.scheduledReport.findMany({
      where: { companyId },
      orderBy: { nextRunAt: 'asc' },
    });
  }

  async deleteScheduledReport(id: string, companyId: string): Promise<void> {
    await prisma.scheduledReport.deleteMany({
      where: { id, companyId },
    });
  }

  async logReportGeneration(
    companyId: string,
    reportType: string,
    format: string,
    fileName: string,
    fileSize: number,
    userId: string
  ): Promise<void> {
    await prisma.report.create({
      data: {
        companyId,
        reportType,
        format,
        generatedBy: userId,
        fileUrl: `/reports/${fileName}`,
        fileSize,
        title: `${reportType} report`,
      },
    });
  }

  async sendReportByEmail(
    email: string,
    reportType: string,
    buffer: Buffer,
    fileName: string
  ): Promise<void> {
    if (!emailTransporter) {
      console.error('Email transporter not configured');
      return;
    }

    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@supplychainai.com',
        to: email,
        subject: `Scheduled Report: ${reportType}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Scheduled Report</h1>
    </div>
    <div class="content">
      <p>Please find attached the ${reportType} report.</p>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
        `,
        attachments: [
          {
            filename: fileName,
            content: buffer,
          },
        ],
      });
    } catch (error) {
      console.error('Failed to send report by email:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();

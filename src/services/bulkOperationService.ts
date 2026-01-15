import { PrismaClient } from '@prisma/client';
import { Readable } from 'stream';

const prisma = new PrismaClient();

function csvParser() {
  return require('csv-parser')();
}

interface BulkJobResult {
  jobId: string;
  status: string;
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  errors: any[];
}

class BulkOperationService {
  async createBulkJob(
    companyId: string,
    type: string,
    totalRows: number,
    userId: string
  ): Promise<string> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.bulkOperation.create({
      data: {
        jobId,
        companyId,
        type,
        status: 'pending',
        totalRows,
        userId,
      },
    });

    return jobId;
  }

  async updateJobProgress(
    jobId: string,
    updates: Partial<BulkJobResult>
  ): Promise<void> {
    await prisma.bulkOperation.update({
      where: { jobId },
      data: updates,
    });
  }

  async getJobStatus(jobId: string): Promise<BulkJobResult | null> {
    const job = await prisma.bulkOperation.findUnique({
      where: { jobId },
    });

    if (!job) return null;

    return {
      jobId: job.jobId,
      status: job.status,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      successCount: job.successCount,
      errorCount: job.errorCount,
      errors: job.errors as any[],
    };
  }

  async processInventoryImport(
    companyId: string,
    csvBuffer: Buffer,
    userId: string
  ): Promise<string> {
    const rows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(csvBuffer)
        .pipe(csvParser())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const jobId = await this.createBulkJob(companyId, 'inventory_import', rows.length, userId);
    await this.updateJobProgress(jobId, { status: 'processing' });

    const errors: any[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const processedRows = i + 1;

      try {
        await this.validateAndCreateInventory(companyId, row);
        successCount++;
      } catch (error: any) {
        errors.push({
          rowNumber: i + 2,
          sku: row.sku,
          error: error.message,
        });
      }

      await this.updateJobProgress(jobId, {
        processedRows,
        successCount,
        errorCount: errors.length,
        errors,
      });
    }

    await this.updateJobProgress(jobId, {
      status: errors.length > 0 ? 'partial' : 'completed',
      completedAt: new Date(),
    });

    return jobId;
  }

  private async validateAndCreateInventory(companyId: string, row: any): Promise<void> {
    const { sku, name, quantity, unitCost, reorderPoint, supplierName } = row;

    if (!sku || !name) {
      throw new Error('SKU and name are required');
    }

    const quantityNum = parseInt(quantity) || 0;
    const unitCostNum = parseFloat(unitCost) || 0;

    let supplierId: string | null = null;
    if (supplierName) {
      const supplier = await prisma.supplier.findFirst({
        where: { companyId, name: supplierName },
      });
      if (supplier) {
        supplierId = supplier.id;
      }
    }

    await prisma.inventory.upsert({
      where: {
        companyId_sku_locationId: {
          companyId,
          sku,
          locationId: null,
        },
      },
      update: {
        name,
        quantity: quantityNum,
        unitCost: unitCostNum,
        reorderPoint: reorderPoint ? parseInt(reorderPoint) : null,
        supplierId,
      },
      create: {
        companyId,
        sku,
        name,
        quantity: quantityNum,
        unitCost: unitCostNum,
        reorderPoint: reorderPoint ? parseInt(reorderPoint) : null,
        supplierId,
      },
    });
  }

  async processOrderImport(
    companyId: string,
    csvBuffer: Buffer,
    userId: string
  ): Promise<string> {
    const rows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(csvBuffer)
        .pipe(csvParser())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const jobId = await this.createBulkJob(companyId, 'order_import', rows.length, userId);
    await this.updateJobProgress(jobId, { status: 'processing' });

    const errors: any[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const processedRows = i + 1;

      try {
        await this.validateAndCreateOrder(companyId, row);
        successCount++;
      } catch (error: any) {
        errors.push({
          rowNumber: i + 2,
          orderNumber: row.orderNumber,
          error: error.message,
        });
      }

      await this.updateJobProgress(jobId, {
        processedRows,
        successCount,
        errorCount: errors.length,
        errors,
      });
    }

    await this.updateJobProgress(jobId, {
      status: errors.length > 0 ? 'partial' : 'completed',
      completedAt: new Date(),
    });

    return jobId;
  }

  private async validateAndCreateOrder(companyId: string, row: any): Promise<void> {
    const { orderNumber, supplierName, eta, priority } = row;

    if (!orderNumber || !supplierName) {
      throw new Error('Order number and supplier name are required');
    }

    const supplier = await prisma.supplier.findFirst({
      where: { companyId, name: supplierName },
    });

    if (!supplier) {
      throw new Error(`Supplier ${supplierName} not found`);
    }

    const etaDate = eta ? new Date(eta) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await prisma.order.create({
      data: {
        companyId,
        supplierId: supplier.id,
        orderNumber,
        eta: etaDate,
        priority: priority || 'MEDIUM',
      },
    });
  }

  async processSupplierImport(
    companyId: string,
    csvBuffer: Buffer,
    userId: string
  ): Promise<string> {
    const rows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      Readable.from(csvBuffer)
        .pipe(csvParser())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const jobId = await this.createBulkJob(companyId, 'supplier_import', rows.length, userId);
    await this.updateJobProgress(jobId, { status: 'processing' });

    const errors: any[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const processedRows = i + 1;

      try {
        await this.validateAndCreateSupplier(companyId, row);
        successCount++;
      } catch (error: any) {
        errors.push({
          rowNumber: i + 2,
          name: row.name,
          error: error.message,
        });
      }

      await this.updateJobProgress(jobId, {
        processedRows,
        successCount,
        errorCount: errors.length,
        errors,
      });
    }

    await this.updateJobProgress(jobId, {
      status: errors.length > 0 ? 'partial' : 'completed',
      completedAt: new Date(),
    });

    return jobId;
  }

  private async validateAndCreateSupplier(companyId: string, row: any): Promise<void> {
    const { name, contactName, contactEmail, leadTime, onTimeRate, qualityRate } = row;

    if (!name) {
      throw new Error('Supplier name is required');
    }

    await prisma.supplier.create({
      data: {
        companyId,
        name,
        contactName: contactName || null,
        contactEmail: contactEmail || null,
        leadTime: leadTime ? parseFloat(leadTime) : 7,
        onTimeRate: onTimeRate ? parseFloat(onTimeRate) : 95,
        qualityRate: qualityRate ? parseFloat(qualityRate) : 95,
        performanceScore: (onTimeRate ? parseFloat(onTimeRate) : 95 + qualityRate ? parseFloat(qualityRate) : 95) / 2,
      },
    });
  }

  async bulkUpdateInventory(
    companyId: string,
    updates: any[],
    userId: string
  ): Promise<string> {
    const jobId = await this.createBulkJob(companyId, 'bulk_update', updates.length, userId);
    await this.updateJobProgress(jobId, { status: 'processing' });

    const errors: any[] = [];
    let successCount = 0;

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      const processedRows = i + 1;

      try {
        await prisma.inventory.updateMany({
          where: {
            companyId,
            sku: update.sku,
          },
          data: {
            quantity: update.quantity,
            unitCost: update.unitCost,
            reorderPoint: update.reorderPoint,
          },
        });
        successCount++;
      } catch (error: any) {
        errors.push({
          rowNumber: i + 1,
          sku: update.sku,
          error: error.message,
        });
      }

      await this.updateJobProgress(jobId, {
        processedRows,
        successCount,
        errorCount: errors.length,
        errors,
      });
    }

    await this.updateJobProgress(jobId, {
      status: errors.length > 0 ? 'partial' : 'completed',
      completedAt: new Date(),
    });

    return jobId;
  }

  async exportInventory(companyId: string): Promise<Buffer> {
    const inventory = await prisma.inventory.findMany({
      where: { companyId },
      include: { supplier: true, location: true },
    });

    let csv = 'SKU,Name,Quantity,Unit Cost,Total Value,Stock Level,Reorder Point,Safety Stock,Supplier,Location\n';

    for (const item of inventory) {
      csv += `${item.sku},"${item.name}",${item.quantity},${item.unitCost},${item.quantity * item.unitCost},${item.stockLevel},${item.reorderPoint || ''},${item.safetyStock || ''},"${item.supplier?.name || ''}","${item.location?.name || ''}"\n`;
    }

    return Buffer.from(csv);
  }

  async exportOrders(companyId: string): Promise<Buffer> {
    const orders = await prisma.order.findMany({
      where: { companyId },
      include: { supplier: true },
    });

    let csv = 'Order Number,Supplier,Status,Priority,ETA,Days Overdue,Total Amount,Created At\n';

    for (const order of orders) {
      csv += `${order.orderNumber},"${order.supplier?.name}",${order.status},${order.priority},${order.eta.toISOString()},${order.daysOverdue},${order.totalAmount || ''},${order.createdAt.toISOString()}\n`;
    }

    return Buffer.from(csv);
  }

  async exportSuppliers(companyId: string): Promise<Buffer> {
    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
    });

    let csv = 'Name,Contact Name,Contact Email,Contact Phone,On-Time Rate,Quality Rate,Lead Time,Performance Score,Status\n';

    for (const supplier of suppliers) {
      csv += `"${supplier.name}","${supplier.contactName || ''}",${supplier.contactEmail || ''},"${supplier.contactPhone || ''}",${supplier.onTimeRate},${supplier.qualityRate},${supplier.leadTime},${supplier.performanceScore},${supplier.status}\n`;
    }

    return Buffer.from(csv);
  }
}

export const bulkOperationService = new BulkOperationService();

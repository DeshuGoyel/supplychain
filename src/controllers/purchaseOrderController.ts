import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getPurchaseOrders = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { 
      page = '1', 
      limit = '50',
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = { companyId };
    if (status) {
      where.status = status;
    }

    const [pos, totalCount] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          supplier: {
            select: {
              id: true,
              name: true
            }
          },
          lineItems: true
        }
      }),
      prisma.purchaseOrder.count({ where })
    ]);

    const formattedPOs = pos.map(po => ({
      id: po.id,
      poNumber: po.poNumber,
      supplier: po.supplier,
      status: po.status,
      totalAmount: po.totalAmount,
      dueDate: po.dueDate,
      receivedDate: po.receivedDate,
      itemCount: po.lineItems.length,
      notes: po.notes,
      createdAt: po.createdAt,
      updatedAt: po.updatedAt
    }));

    res.json({
      success: true,
      data: {
        purchaseOrders: formattedPOs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPurchaseOrderById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      include: {
        supplier: true,
        lineItems: true
      }
    });

    if (!po) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: po
    });
  } catch (error) {
    next(error);
  }
};

export const createPurchaseOrder = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { 
      supplierId, 
      lineItems, 
      dueDate, 
      notes 
    } = req.body;

    if (!supplierId || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Supplier ID and at least one line item are required',
          details: { requiredFields: ['supplierId', 'lineItems'] }
        }
      });
      return;
    }

    for (const item of lineItems) {
      if (!item.sku || !item.productName || !item.quantity || item.quantity <= 0 || !item.unitPrice || item.unitPrice <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Each line item must have sku, productName, quantity > 0, and unitPrice > 0',
            details: { invalidItem: item }
          }
        });
        return;
      }
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Due date must be in the future',
          details: { field: 'dueDate' }
        }
      });
      return;
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId }
    });

    if (!supplier) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found'
        }
      });
      return;
    }

    const poCount = await prisma.purchaseOrder.count({
      where: { companyId }
    });
    const poNumber = `PO-${String(poCount + 1).padStart(6, '0')}`;

    const totalAmount = lineItems.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId,
        poNumber,
        totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        status: 'DRAFT',
        lineItems: {
          create: lineItems.map((item: any) => ({
            sku: item.sku,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            receivedQty: 0
          }))
        }
      },
      include: {
        supplier: true,
        lineItems: true
      }
    });

    res.status(201).json({
      success: true,
      data: po
    });
  } catch (error) {
    next(error);
  }
};

export const updatePurchaseOrder = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { status, notes, receivedDate } = req.body;

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found'
        }
      });
      return;
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (receivedDate) updateData.receivedDate = new Date(receivedDate);

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
        lineItems: true
      }
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const deletePurchaseOrder = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found'
        }
      });
      return;
    }

    await prisma.purchaseOrder.delete({ where: { id } });

    res.json({
      success: true,
      data: { message: 'Purchase order deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

export const addLineItem = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { sku, productName, quantity, unitPrice } = req.body;

    if (!sku || !productName || !quantity || quantity <= 0 || !unitPrice || unitPrice <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'SKU, productName, quantity > 0, and unitPrice > 0 are required',
          details: { requiredFields: ['sku', 'productName', 'quantity', 'unitPrice'] }
        }
      });
      return;
    }

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, companyId }
    });

    if (!po) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Purchase order not found'
        }
      });
      return;
    }

    const totalPrice = quantity * unitPrice;

    const lineItem = await prisma.pOLineItem.create({
      data: {
        purchaseOrderId: id,
        sku,
        productName,
        quantity,
        unitPrice,
        totalPrice,
        receivedQty: 0
      }
    });

    await prisma.purchaseOrder.update({
      where: { id },
      data: {
        totalAmount: po.totalAmount + totalPrice
      }
    });

    res.status(201).json({
      success: true,
      data: lineItem
    });
  } catch (error) {
    next(error);
  }
};

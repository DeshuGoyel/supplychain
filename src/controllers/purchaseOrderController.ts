import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: {
      userId: string;
      companyId: string;
      email: string;
      role: string;
    };
  }
}

/**
 * Create purchase order
 */
export const createPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { supplierId, dueDate, items, notes } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Supplier ID and at least one item are required'
      });
    }

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId }
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get inventory items for pricing
    const skus = items.map((item: any) => item.sku);
    const inventoryItems = await prisma.inventory.findMany({
      where: {
        companyId,
        sku: { in: skus }
      }
    });

    const skuPriceMap = new Map(
      inventoryItems.map(item => [item.sku, item.unitCost])
    );

    // Generate PO number
    const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    // Calculate total amount
    let totalAmount = 0;
    const poItems = items.map((item: any) => {
      const unitPrice = item.unitPrice || skuPriceMap.get(item.sku) || 0;
      const totalPrice = unitPrice * item.quantity;
      totalAmount += totalPrice;

      return {
        sku: item.sku,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      };
    });

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId,
        poNumber,
        poDate: new Date(),
        dueDate: new Date(dueDate),
        status: 'DRAFT',
        totalAmount,
        notes,
        items: {
          create: poItems
        }
      },
      include: {
        items: true,
        supplier: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating purchase order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get purchase order detail
 */
export const getPurchaseOrder = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;

    const purchaseOrder = await prisma.purchaseOrder.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        items: true,
        supplier: true,
        shipments: true
      }
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update purchase order status
 */
export const updatePurchaseOrderStatus = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['DRAFT', 'SENT', 'CONFIRMED', 'IN_TRANSIT', 'RECEIVED', 'CLOSED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const purchaseOrder = await prisma.purchaseOrder.updateMany({
      where: {
        id,
        companyId
      },
      data: { status }
    });

    if (purchaseOrder.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      message: 'Purchase order status updated successfully'
    });
  } catch (error) {
    console.error('Error updating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating purchase order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all purchase orders with filters
 */
export const getPurchaseOrders = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { status, supplierId, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { companyId };

    if (status) {
      where.status = status as string;
    }

    if (supplierId) {
      where.supplierId = supplierId as string;
    }

    const [purchaseOrders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          items: true,
          _count: {
            select: {
              shipments: true
            }
          }
        },
        skip,
        take: limitNum,
        orderBy: {
          poDate: 'desc'
        }
      }),
      prisma.purchaseOrder.count({ where })
    ]);

    res.json({
      success: true,
      data: purchaseOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchase orders',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

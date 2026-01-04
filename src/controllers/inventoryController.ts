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
 * Get inventory with pagination and filtering
 */
export const getInventory = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const {
      page = '1',
      limit = '50',
      location,
      sku,
      status,
      sortBy = 'sku',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { companyId };

    if (location) {
      where.locationId = location as string;
    }

    if (sku) {
      where.sku = {
        contains: sku as string,
        mode: 'insensitive'
      };
    }

    if (status) {
      where.stockLevel = status as string;
    }

    // Get inventory with pagination
    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          location: true
        },
        skip,
        take: limitNum,
        orderBy: {
          [sortBy as string]: sortOrder as 'asc' | 'desc'
        }
      }),
      prisma.inventory.count({ where })
    ]);

    // Calculate days of supply for each item
    const inventoryWithDaysSupply = inventory.map(item => {
      const daysSupply = item.turnoverRate && item.turnoverRate > 0
        ? Math.round((item.quantityOnHand / (item.quantityOnHand / item.turnoverRate)))
        : 0;

      return {
        ...item,
        daysSupply,
        available: item.quantityOnHand - item.quantityReserved,
        stockHealth: getStockHealth(item.quantityOnHand, item.reorderPoint, item.quantityReserved)
      };
    });

    res.json({
      success: true,
      data: inventoryWithDaysSupply,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get stock movements for an inventory item
 */
export const getInventoryMovements = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { inventoryId, limit = '20' } = req.query;

    const where: any = { companyId };

    if (inventoryId) {
      where.inventoryId = inventoryId as string;
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        inventory: {
          select: {
            sku: true,
            productName: true
          }
        },
        location: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: movements
    });
  } catch (error) {
    console.error('Error fetching inventory movements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory movements',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Trigger reorder for an inventory item
 */
export const reorderInventory = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;
    const { supplierId, quantity, notes } = req.body;

    // Verify inventory belongs to company
    const inventory = await prisma.inventory.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        location: true
      }
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Get supplier if specified
    let supplier = null;
    if (supplierId) {
      supplier = await prisma.supplier.findFirst({
        where: {
          id: supplierId,
          companyId
        }
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          message: 'Supplier not found'
        });
      }
    }

    // Create purchase order
    const poNumber = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId: supplier?.id || null,
        poNumber,
        poDate: new Date(),
        dueDate: new Date(Date.now() + (supplier?.leadTimeDays || 7) * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        totalAmount: inventory.unitCost * (quantity || inventory.reorderQty),
        notes: notes || `Reorder for ${inventory.sku}`,
        items: {
          create: {
            sku: inventory.sku,
            productName: inventory.productName,
            quantity: quantity || inventory.reorderQty,
            unitPrice: inventory.unitCost,
            totalPrice: inventory.unitCost * (quantity || inventory.reorderQty)
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error creating reorder:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating reorder',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get inventory summary for dashboard
 */
export const getInventorySummary = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    const [totalSKUs, lowStock, outOfStock, inventoryValue] = await Promise.all([
      prisma.inventory.count({ where: { companyId } }),
      prisma.inventory.count({
        where: {
          companyId,
          stockLevel: 'LOW'
        }
      }),
      prisma.inventory.count({
        where: {
          companyId,
          stockLevel: 'OUT_OF_STOCK'
        }
      }),
      prisma.inventory.aggregate({
        where: { companyId },
        _sum: {
          quantityOnHand: true
        }
      })
    ]);

    // Calculate total value
    const allInventory = await prisma.inventory.findMany({
      where: { companyId },
      select: {
        quantityOnHand: true,
        unitCost: true
      }
    });

    const totalValue = allInventory.reduce((sum, item) => {
      return sum + (item.quantityOnHand * item.unitCost);
    }, 0);

    // Get fast movers and slow movers
    const inventoryWithTurnover = await prisma.inventory.findMany({
      where: { companyId },
      orderBy: {
        turnoverRate: 'desc'
      },
      take: 10,
      select: {
        sku: true,
        productName: true,
        quantityOnHand: true,
        turnoverRate: true,
        unitCost: true
      }
    });

    const fastMovers = inventoryWithTurnover.slice(0, 5);
    const slowMovers = [...inventoryWithTurnover].reverse().slice(0, 5);

    // Calculate stock health
    const healthyStock = totalSKUs - lowStock - outOfStock;
    const stockHealth = totalSKUs > 0 ? Math.round((healthyStock / totalSKUs) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalSKUs,
        lowStock,
        outOfStock,
        totalValue: Math.round(totalValue * 100) / 100,
        stockHealth,
        fastMovers,
        slowMovers
      }
    });
  } catch (error) {
    console.error('Error fetching inventory summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Helper function to determine stock health
 */
function getStockHealth(quantityOnHand: number, reorderPoint: number, reserved: number) {
  const available = quantityOnHand - reserved;
  if (available <= 0) return 'OUT_OF_STOCK';
  if (available < reorderPoint) return 'LOW';
  if (available > reorderPoint * 3) return 'OVERSTOCKED';
  return 'HEALTHY';
}

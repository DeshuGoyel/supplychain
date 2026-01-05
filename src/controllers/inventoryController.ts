import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getInventory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { 
      page = '1', 
      limit = '50', 
      location, 
      status, 
      sku,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = { companyId };
    
    if (location) {
      where.locationId = location;
    }
    
    if (status) {
      where.stockLevel = status;
    }
    
    if (sku) {
      where.OR = [
        { sku: { contains: sku, mode: 'insensitive' } },
        { name: { contains: sku, mode: 'insensitive' } }
      ];
    }

    const [inventory, totalCount] = await Promise.all([
      prisma.inventory.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          location: true,
          supplier: {
            select: {
              id: true,
              name: true,
              leadTime: true
            }
          }
        }
      }),
      prisma.inventory.count({ where })
    ]);

    const formattedInventory = inventory.map(item => {
      const availableQty = item.quantity - item.quantityReserved;
      const daysSupply = item.reorderPoint && item.reorderQty 
        ? Math.floor(availableQty / (item.reorderQty / 30))
        : null;

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        location: item.location?.name || 'N/A',
        locationId: item.locationId,
        quantity: item.quantity,
        quantityReserved: item.quantityReserved,
        availableQty,
        reorderPoint: item.reorderPoint,
        reorderQty: item.reorderQty,
        safetyStock: item.safetyStock,
        unitCost: item.unitCost,
        stockLevel: item.stockLevel,
        daysSupply,
        supplier: item.supplier,
        lastUpdated: item.lastUpdated
      };
    });

    res.json({
      success: true,
      data: {
        inventory: formattedInventory,
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

export const getInventoryById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const item = await prisma.inventory.findFirst({
      where: { id, companyId },
      include: {
        location: true,
        supplier: true
      }
    });

    if (!item) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory item not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    next(error);
  }
};

export const createInventory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { 
      sku, 
      name, 
      quantity, 
      unitCost, 
      locationId, 
      reorderPoint, 
      reorderQty,
      safetyStock,
      supplierId
    } = req.body;

    if (!sku || !name || quantity === undefined || unitCost === undefined) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'SKU, name, quantity, and unitCost are required',
          details: { requiredFields: ['sku', 'name', 'quantity', 'unitCost'] }
        }
      });
      return;
    }

    const stockLevel = quantity === 0 ? 'OUT_OF_STOCK' 
      : (reorderPoint && quantity <= reorderPoint) ? 'LOW' 
      : 'HEALTHY';

    const item = await prisma.inventory.create({
      data: {
        companyId,
        sku,
        name,
        quantity,
        unitCost,
        locationId: locationId || null,
        reorderPoint: reorderPoint || null,
        reorderQty: reorderQty || null,
        safetyStock: safetyStock || null,
        supplierId: supplierId || null,
        stockLevel
      },
      include: {
        location: true,
        supplier: true
      }
    });

    res.status(201).json({
      success: true,
      data: item
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_SKU',
          message: 'SKU already exists for this location'
        }
      });
      return;
    }
    next(error);
  }
};

export const updateInventory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const updates = req.body;

    const existing = await prisma.inventory.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory item not found'
        }
      });
      return;
    }

    const newQuantity = updates.quantity !== undefined ? updates.quantity : existing.quantity;
    const newReorderPoint = updates.reorderPoint !== undefined ? updates.reorderPoint : existing.reorderPoint;

    const stockLevel = newQuantity === 0 ? 'OUT_OF_STOCK' 
      : (newReorderPoint && newQuantity <= newReorderPoint) ? 'LOW' 
      : 'HEALTHY';

    const updated = await prisma.inventory.update({
      where: { id },
      data: {
        ...updates,
        stockLevel
      },
      include: {
        location: true,
        supplier: true
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

export const deleteInventory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const existing = await prisma.inventory.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Inventory item not found'
        }
      });
      return;
    }

    await prisma.inventory.delete({ where: { id } });

    res.json({
      success: true,
      data: { message: 'Inventory item deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const lowStockItems = await prisma.inventory.findMany({
      where: {
        companyId,
        stockLevel: { in: ['LOW', 'OUT_OF_STOCK'] }
      },
      include: {
        location: true,
        supplier: true
      },
      orderBy: { quantity: 'asc' }
    });

    res.json({
      success: true,
      data: lowStockItems
    });
  } catch (error) {
    next(error);
  }
};

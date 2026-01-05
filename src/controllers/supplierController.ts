import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getSuppliers = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { 
      page = '1', 
      limit = '50',
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [suppliers, totalCount] = await Promise.all([
      prisma.supplier.findMany({
        where: { companyId },
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { purchaseOrders: true }
          }
        }
      }),
      prisma.supplier.count({ where: { companyId } })
    ]);

    const formattedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      contactEmail: supplier.contactEmail,
      contactPhone: supplier.contactPhone,
      address: supplier.address,
      performanceScore: supplier.performanceScore,
      onTimeRate: Math.round(supplier.onTimeRate),
      qualityRate: Math.round(supplier.qualityRate),
      leadTime: Math.round(supplier.leadTime * 10) / 10,
      paymentTerms: supplier.paymentTerms,
      status: supplier.status,
      totalPOs: supplier._count.purchaseOrders,
      issues: supplier.issues ? JSON.parse(supplier.issues) : [],
      createdAt: supplier.createdAt
    }));

    res.json({
      success: true,
      data: {
        suppliers: formattedSuppliers,
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

export const getSupplierById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId },
      include: {
        _count: {
          select: { purchaseOrders: true, orders: true }
        }
      }
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

    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { supplierId: id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    res.json({
      success: true,
      data: {
        ...supplier,
        performanceScore: supplier.performanceScore,
        onTimeRate: Math.round(supplier.onTimeRate),
        qualityRate: Math.round(supplier.qualityRate),
        leadTime: Math.round(supplier.leadTime * 10) / 10,
        totalPOs: supplier._count.purchaseOrders,
        totalOrders: supplier._count.orders,
        lastPODate: lastPO?.createdAt,
        issues: supplier.issues ? JSON.parse(supplier.issues) : []
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { 
      name, 
      contactName, 
      contactEmail, 
      contactPhone, 
      address,
      paymentTerms,
      leadTime = 7
    } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Supplier name is required',
          details: { field: 'name' }
        }
      });
      return;
    }

    const supplier = await prisma.supplier.create({
      data: {
        companyId,
        name,
        contactName,
        contactEmail,
        contactPhone,
        address,
        paymentTerms,
        leadTime,
        performanceScore: 0,
        onTimeRate: 0,
        qualityRate: 0,
        status: 'ACTIVE'
      }
    });

    res.status(201).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const existing = await prisma.supplier.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Supplier not found'
        }
      });
      return;
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: req.body
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierPOs = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { limit = '10' } = req.query;

    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId }
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

    const pos = await prisma.purchaseOrder.findMany({
      where: { supplierId: id },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        lineItems: true
      }
    });

    const formattedPOs = pos.map(po => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      totalAmount: po.totalAmount,
      dueDate: po.dueDate,
      receivedDate: po.receivedDate,
      itemCount: po.lineItems.length,
      createdAt: po.createdAt
    }));

    res.json({
      success: true,
      data: formattedPOs
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplierPerformance = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const suppliers = await prisma.supplier.findMany({
      where: { companyId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        performanceScore: true,
        onTimeRate: true,
        qualityRate: true,
        leadTime: true
      },
      orderBy: { performanceScore: 'desc' }
    });

    const avgOnTime = suppliers.length > 0
      ? Math.round(suppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / suppliers.length)
      : 0;
    
    const avgQuality = suppliers.length > 0
      ? Math.round(suppliers.reduce((sum, s) => sum + s.qualityRate, 0) / suppliers.length)
      : 0;
    
    const avgLeadTime = suppliers.length > 0
      ? Math.round(suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length * 10) / 10
      : 0;

    res.json({
      success: true,
      data: {
        avgOnTime,
        avgQuality,
        avgLeadTime,
        suppliers: suppliers.map(s => ({
          id: s.id,
          name: s.name,
          score: Math.round(s.performanceScore),
          onTimeRate: Math.round(s.onTimeRate),
          qualityRate: Math.round(s.qualityRate),
          leadTime: Math.round(s.leadTime * 10) / 10
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

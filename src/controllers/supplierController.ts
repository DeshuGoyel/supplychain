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
 * Get all suppliers for a company
 */
export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { status } = req.query;

    const where: any = { companyId };

    if (status) {
      where.status = status as string;
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: {
        performanceScore: 'desc'
      },
      include: {
        _count: {
          select: {
            purchaseOrders: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching suppliers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get supplier detail
 */
export const getSupplierDetail = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;

    const supplier = await prisma.supplier.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    // Get recent purchase orders
    const recentPOs = await prisma.purchaseOrder.findMany({
      where: {
        supplierId: id
      },
      orderBy: {
        poDate: 'desc'
      },
      take: 10,
      include: {
        items: true
      }
    });

    // Parse communication log and contract terms
    const communicationLog = supplier.communicationLog
      ? JSON.parse(supplier.communicationLog)
      : [];
    const contractTerms = supplier.contractTerms
      ? JSON.parse(supplier.contractTerms)
      : {};

    res.json({
      success: true,
      data: {
        ...supplier,
        communicationLog,
        contractTerms,
        recentPOs
      }
    });
  } catch (error) {
    console.error('Error fetching supplier detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier detail',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create new supplier
 */
export const createSupplier = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const {
      name,
      contactName,
      email,
      phone,
      leadTimeDays,
      paymentTerms,
      priceTier,
      contractTerms
    } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        companyId,
        name,
        contactName,
        email,
        phone,
        leadTimeDays: leadTimeDays || 7,
        paymentTerms: paymentTerms || 'NET 30',
        performanceScore: 100,
        onTimePct: 100,
        qualityRating: 5,
        priceTier: priceTier || 'STANDARD',
        status: 'ACTIVE',
        contractTerms: contractTerms ? JSON.stringify(contractTerms) : null,
        communicationLog: JSON.stringify([])
      }
    });

    res.status(201).json({
      success: true,
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating supplier',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update supplier
 */
export const updateSupplier = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;
    const { contactName, email, phone, leadTimeDays, paymentTerms, priceTier } = req.body;

    // Verify supplier belongs to company
    const existing = await prisma.supplier.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        contactName: contactName || existing.contactName,
        email: email || existing.email,
        phone: phone || existing.phone,
        leadTimeDays: leadTimeDays !== undefined ? leadTimeDays : existing.leadTimeDays,
        paymentTerms: paymentTerms || existing.paymentTerms,
        priceTier: priceTier || existing.priceTier
      }
    });

    res.json({
      success: true,
      message: 'Supplier updated successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating supplier',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get supplier POs
 */
export const getSupplierPOs = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;
    const { status } = req.query;

    // Verify supplier belongs to company
    const supplier = await prisma.supplier.findFirst({
      where: { id, companyId }
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    const where: any = { supplierId: id };

    if (status) {
      where.status = status as string;
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: {
        poDate: 'desc'
      },
      include: {
        items: true
      }
    });

    res.json({
      success: true,
      data: purchaseOrders
    });
  } catch (error) {
    console.error('Error fetching supplier POs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier POs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

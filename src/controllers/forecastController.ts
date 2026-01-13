import { Response, NextFunction } from 'express';
import { forecastService } from '../services/forecastService';
import { cacheService } from '../services/cacheService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getForecast = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { sku } = req.params;
    const { months = 12 } = req.query;

    const cacheKey = `forecast:${companyId}:${sku}:${months}`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const forecast = await forecastService.generateForecast(companyId, sku, parseInt(months as string));

    await cacheService.setJson(cacheKey, forecast, 3600);

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: forecast });
  } catch (error) {
    next(error);
  }
};

export const getBulkForecasts = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { months = 12 } = req.query;

    const forecasts = await forecastService.generateBulkForecasts(companyId, parseInt(months as string));

    res.json({ success: true, data: forecasts });
  } catch (error) {
    next(error);
  }
};

export const getReorderSuggestions = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { status = 'pending' } = req.query;

    const cacheKey = `reorder-suggestions:${companyId}:${status}`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const suggestions = await prisma.reorderSuggestion.findMany({
      where: { companyId, status: status as string },
      include: { inventory: { include: { supplier: true } } },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const formatted = suggestions.map(s => ({
      id: s.id,
      sku: s.sku,
      name: s.inventory?.name,
      currentQuantity: s.inventory?.quantity,
      suggestedQty: s.suggestedQty,
      reason: s.reason,
      priority: s.priority,
      status: s.status,
      unitCost: s.inventory?.unitCost,
      supplier: s.inventory?.supplier?.name,
      createdAt: s.createdAt,
    }));

    await cacheService.setJson(cacheKey, formatted, 300);

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

export const approveReorderSuggestion = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId, userId } = req.user;
    const { id } = req.params;

    const suggestion = await prisma.reorderSuggestion.findFirst({
      where: { id, companyId },
      include: { inventory: true },
    });

    if (!suggestion) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Reorder suggestion not found',
        },
      });
      return;
    }

    if (suggestion.status !== 'pending') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Suggestion has already been processed',
        },
      });
      return;
    }

    const supplierId = suggestion.inventory?.supplierId;

    if (!supplierId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_SUPPLIER',
          message: 'Inventory item has no supplier assigned',
        },
      });
      return;
    }

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId,
        poNumber: `PO-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        status: 'DRAFT',
        totalAmount: suggestion.suggestedQty * (suggestion.inventory?.unitCost || 0),
        notes: `Auto-generated from reorder suggestion. SKU: ${suggestion.sku}`,
        lineItems: {
          create: [
            {
              sku: suggestion.sku,
              productName: suggestion.inventory?.name || suggestion.sku,
              quantity: suggestion.suggestedQty,
              unitPrice: suggestion.inventory?.unitCost || 0,
              totalPrice: suggestion.suggestedQty * (suggestion.inventory?.unitCost || 0),
            },
          ],
        },
      },
    });

    await prisma.reorderSuggestion.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    await cacheService.invalidateCompanyCache(companyId);

    res.json({
      success: true,
      data: {
        purchaseOrderId: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        totalAmount: purchaseOrder.totalAmount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAgingAnalysis = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const cacheKey = `inventory:${companyId}:aging-analysis`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const aging = await forecastService.getAgingAnalysis(companyId);

    await cacheService.setJson(cacheKey, aging, 600);

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: aging });
  } catch (error) {
    next(error);
  }
};

export const getABCXYZAnalysis = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const cacheKey = `inventory:${companyId}:abc-xyz-analysis`;
    const cached = await cacheService.getJson(cacheKey);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      res.json({ success: true, data: cached });
      return;
    }

    const abcxyz = await forecastService.getABCXYZAnalysis(companyId);

    const summary = {
      totalItems: abcxyz.length,
      ax: abcxyz.filter(i => i.category === 'AX').length,
      ay: abcxyz.filter(i => i.category === 'AY').length,
      az: abcxyz.filter(i => i.category === 'AZ').length,
      bx: abcxyz.filter(i => i.category === 'BX').length,
      by: abcxyz.filter(i => i.category === 'BY').length,
      bz: abcxyz.filter(i => i.category === 'BZ').length,
      cx: abcxyz.filter(i => i.category === 'CX').length,
      cy: abcxyz.filter(i => i.category === 'CY').length,
      cz: abcxyz.filter(i => i.category === 'CZ').length,
    };

    await cacheService.setJson(cacheKey, { analysis: abcxyz, summary }, 600);

    res.setHeader('X-Cache', 'MISS');
    res.json({ success: true, data: { analysis: abcxyz, summary } });
  } catch (error) {
    next(error);
  }
};

export const getForecastAccuracy = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { sku, months = 12 } = req.query;

    if (sku) {
      const accuracy = await forecastService.calculateForecastAccuracy(companyId, sku as string, parseInt(months as string));
      res.json({ success: true, data: { sku, accuracy } });
    } else {
      const inventory = await prisma.inventory.findMany({
        where: { companyId },
        select: { sku: true },
      });

      const accuracies: any[] = [];
      for (const item of inventory) {
        const accuracy = await forecastService.calculateForecastAccuracy(companyId, item.sku, parseInt(months as string));
        accuracies.push({ sku: item.sku, accuracy });
      }

      const avgAccuracy = accuracies.reduce((sum, a) => sum + a.accuracy, 0) / accuracies.length;

      res.json({
        success: true,
        data: {
          averageAccuracy: Math.round(avgAccuracy),
          accuracies,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

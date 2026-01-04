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
 * Get KPIs by period
 */
export const getKPIs = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { period, locationId } = req.query;

    const where: any = { companyId };

    if (period) {
      where.period = period as string;
    }

    if (locationId) {
      where.locationId = locationId as string;
    }

    const kpis = await prisma.kPI.findMany({
      where,
      orderBy: [
        { period: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching KPIs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get OTIF trend data
 */
export const getOTIFTrend = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { months = '12' } = req.query;

    const numMonths = parseInt(months as string);

    const kpis = await prisma.kPI.findMany({
      where: {
        companyId,
        name: 'OTIF'
      },
      orderBy: {
        period: 'asc'
      },
      take: numMonths
    });

    // Also get OTIF by supplier
    const suppliers = await prisma.supplier.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        onTimePct: true
      }
    });

    res.json({
      success: true,
      data: {
        trend: kpis,
        bySupplier: suppliers
      }
    });
  } catch (error) {
    console.error('Error fetching OTIF trend:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching OTIF trend',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get inventory turns data
 */
export const getInventoryTurns = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    // Get turnover KPIs
    const kpis = await prisma.kPI.findMany({
      where: {
        companyId,
        name: 'TURNOVER'
      },
      orderBy: {
        period: 'asc'
      },
      take: 12
    });

    // Get inventory by location
    const inventoryByLocation = await prisma.location.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            inventory: true
          }
        }
      }
    });

    // Calculate inventory value by SKU
    const allInventory = await prisma.inventory.findMany({
      where: { companyId },
      select: {
        sku: true,
        productName: true,
        quantityOnHand: true,
        unitCost: true,
        stockLevel: true
      }
    });

    const inventoryValueBySKU = allInventory.map(item => ({
      ...item,
      totalValue: Math.round(item.quantityOnHand * item.unitCost * 100) / 100
    }));

    res.json({
      success: true,
      data: {
        trend: kpis,
        byLocation: inventoryByLocation,
        bySKU: inventoryValueBySKU
      }
    });
  } catch (error) {
    console.error('Error fetching inventory turns:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory turns',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate custom report
 */
export const generateReport = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { dateRange, metrics, groupBy, visualization } = req.body;

    // Build query based on parameters
    let data: any[] = [];

    if (metrics.includes('inventory')) {
      const inventory = await prisma.inventory.findMany({
        where: { companyId },
        include: { location: true }
      });
      data.push({ type: 'inventory', data: inventory });
    }

    if (metrics.includes('suppliers')) {
      const suppliers = await prisma.supplier.findMany({
        where: { companyId },
        include: {
          _count: {
            select: {
              purchaseOrders: true
            }
          }
        }
      });
      data.push({ type: 'suppliers', data: suppliers });
    }

    if (metrics.includes('shipments')) {
      const shipments = await prisma.shipment.findMany({
        where: { companyId },
        include: {
          purchaseOrder: true
        }
      });
      data.push({ type: 'shipments', data: shipments });
    }

    // Group data if specified
    if (groupBy) {
      data = data.map(dataset => ({
        ...dataset,
        grouped: groupData(dataset.data, groupBy)
      }));
    }

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: {
        dateRange,
        metrics,
        groupBy,
        visualization,
        datasets: data
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate AI-powered weekly summary
 */
export const generateWeeklySummary = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    // Get current period KPIs
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const kpis = await prisma.kPI.findMany({
      where: {
        companyId,
        period: currentPeriod
      }
    });

    // Get open issues
    const issues = await prisma.issue.findMany({
      where: {
        companyId,
        status: { in: ['OPEN', 'ACKNOWLEDGED'] }
      },
      orderBy: {
        severity: 'desc'
      },
      take: 10
    });

    // Get recent supplier performance
    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId,
        performanceScore: {
          lt: 85
        }
      },
      orderBy: {
        performanceScore: 'asc'
      },
      take: 5
    });

    // Get low stock items
    const lowStock = await prisma.inventory.findMany({
      where: {
        companyId,
        stockLevel: 'LOW'
      },
      take: 10
    });

    // Generate summary text
    const highlights: string[] = [];
    const issuesList: string[] = [];
    const recommendations: string[] = [];

    // KPI highlights
    kpis.forEach(kpi => {
      if (kpi.status === 'EXCELLENT') {
        highlights.push(`${kpi.name} is performing excellently at ${kpi.value}%`);
      } else if (kpi.trend > 0) {
        highlights.push(`${kpi.name} improved by ${kpi.trend}% to ${kpi.value}%`);
      } else if (kpi.trend < 0) {
        issuesList.push(`${kpi.name} declined by ${Math.abs(kpi.trend)}% to ${kpi.value}%`);
      }
    });

    // Issues
    if (issues.length > 0) {
      const critical = issues.filter(i => i.severity >= 4);
      if (critical.length > 0) {
        issuesList.push(`${critical.length} critical issues require immediate attention`);
      }
      issuesList.push(`${issues.length} total open issues`);
    }

    // Suppliers
    if (suppliers.length > 0) {
      issuesList.push(`${suppliers.length} suppliers underperforming`);
      recommendations.push('Consider supplier renegotiation or qualification review');
    }

    // Low stock
    if (lowStock.length > 0) {
      const critical = lowStock.filter(i => i.quantityOnHand <= i.reorderPoint * 0.5);
      if (critical.length > 0) {
        issuesList.push(`${critical.length} SKUs at critical stock levels`);
      }
      issuesList.push(`${lowStock.length} SKUs with low stock`);
      recommendations.push('Review safety stock levels and reorder triggers');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Continue current operations. All metrics on track.');
    }

    // Build summary
    const summary = {
      period: currentPeriod,
      highlights: highlights.length > 0 ? highlights : ['All operations running smoothly'],
      issues: issuesList.length > 0 ? issuesList : ['No critical issues identified'],
      recommendations,
      metrics: kpis.reduce((acc: any, kpi) => {
        acc[kpi.name] = {
          value: kpi.value,
          trend: kpi.trend,
          status: kpi.status
        };
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating weekly summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Helper function to group data
 */
function groupData(data: any[], groupBy: string) {
  const grouped = new Map<string, any[]>();

  data.forEach(item => {
    const key = (item as any)[groupBy] || 'Other';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(item);
  });

  return Array.from(grouped.entries()).map(([key, items]) => ({
    key,
    count: items.length,
    items
  }));
}

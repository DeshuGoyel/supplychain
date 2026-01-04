import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get inventory data for dashboard
 * Returns: total SKUs, stock value, low stock count, stock health, fast/slow movers
 */
export const getInventoryData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    // Get all inventory for the company
    const inventory = await prisma.inventory.findMany({
      where: { companyId },
    });

    // Calculate metrics
    const totalSKUs = inventory.length;
    const stockValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const lowStockCount = inventory.filter(item => item.stockLevel === 'LOW').length;
    const outOfStockCount = inventory.filter(item => item.stockLevel === 'OUT_OF_STOCK').length;

    // Calculate stock health percentage (healthy items / total items)
    const healthyCount = inventory.filter(item => item.stockLevel === 'HEALTHY').length;
    const stockHealth = totalSKUs > 0 ? Math.round((healthyCount / totalSKUs) * 100) : 100;

    // Get top 5 fast movers (highest turnover rate)
    const fastMovers = inventory
      .filter(item => item.turnoverRate !== null && item.turnoverRate > 0)
      .sort((a, b) => (b.turnoverRate || 0) - (a.turnoverRate || 0))
      .slice(0, 5)
      .map(item => ({
        sku: item.sku,
        qty: item.quantity,
      }));

    // Get top 5 slow movers (lowest turnover rate)
    const slowMovers = inventory
      .filter(item => item.turnoverRate !== null)
      .sort((a, b) => (a.turnoverRate || 0) - (b.turnoverRate || 0))
      .slice(0, 5)
      .map(item => ({
        sku: item.sku,
        qty: item.quantity,
      }));

    res.json({
      success: true,
      data: {
        totalSKUs,
        stockValue,
        lowStockCount,
        stockHealth,
        fastMovers,
        slowMovers,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get open orders data for dashboard
 * Returns: pending, delayed, on-time counts, and recent orders
 */
export const getOpenOrdersData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    // Get all open orders (not completed)
    const orders = await prisma.order.findMany({
      where: {
        companyId,
        status: {
          in: ['PENDING', 'ON_TIME', 'DELAYED'],
        },
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to 50 most recent
    });

    // Calculate counts
    const pending = orders.filter(order => order.status === 'PENDING').length;
    const delayed = orders.filter(order => order.status === 'DELAYED').length;
    const onTime = orders.filter(order => order.status === 'ON_TIME').length;

    // Format orders for response
    const formattedOrders = orders.map(order => ({
      id: order.orderNumber,
      supplierId: order.supplier.id,
      supplierName: order.supplier.name,
      status: order.status as 'PENDING' | 'DELAYED' | 'ON_TIME',
      eta: order.eta.toISOString().split('T')[0],
      daysOverdue: order.daysOverdue > 0 ? order.daysOverdue : undefined,
      priority: order.priority as 'LOW' | 'MEDIUM' | 'HIGH',
    }));

    res.json({
      success: true,
      data: {
        pending,
        delayed,
        onTime,
        orders: formattedOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get supplier performance data for dashboard
 * Returns: average metrics, top suppliers, underperforming suppliers
 */
export const getSupplierData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    // Get all active suppliers for the company
    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate averages
    const avgOnTime = suppliers.length > 0
      ? Math.round(suppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / suppliers.length)
      : 0;
    const avgQuality = suppliers.length > 0
      ? Math.round(suppliers.reduce((sum, s) => sum + s.qualityRate, 0) / suppliers.length)
      : 0;
    const avgLeadTime = suppliers.length > 0
      ? Math.round(suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length * 10) / 10
      : 0;

    // Get top 3 suppliers (highest combined performance score)
    const topSuppliers = suppliers
      .map(supplier => ({
        ...supplier,
        performanceScore: (supplier.onTimeRate + supplier.qualityRate) / 2 - supplier.leadTime,
      }))
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 3)
      .map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        onTime: Math.round(supplier.onTimeRate),
        quality: Math.round(supplier.qualityRate),
        leadTime: Math.round(supplier.leadTime * 10) / 10,
      }));

    // Get underperforming suppliers (low on-time or quality, or high lead time)
    const underperforming = suppliers
      .filter(supplier =>
        supplier.onTimeRate < 85 || supplier.qualityRate < 90 || supplier.leadTime > 10
      )
      .map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        onTime: Math.round(supplier.onTimeRate),
        quality: Math.round(supplier.qualityRate),
        leadTime: Math.round(supplier.leadTime * 10) / 10,
        issues: supplier.issues ? JSON.parse(supplier.issues) : [],
      }));

    res.json({
      success: true,
      data: {
        avgOnTime,
        avgQuality,
        avgLeadTime,
        topSuppliers,
        underperforming,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get demand forecast data for dashboard
 * Returns: 4-week forecast with demand, supply, gap, and risk levels
 */
export const getDemandData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentWeek = Math.ceil(now.getDate() / 7);

    // Get 4 weeks of forecast data starting from current week
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        companyId,
        year: currentYear,
        week: {
          gte: currentWeek,
        },
      },
      orderBy: {
        week: 'asc',
      },
      take: 4,
    });

    // Format forecast data
    const formattedForecast = forecasts.map(forecast => ({
      week: forecast.week,
      demand: forecast.demand,
      supply: forecast.supply,
      gap: forecast.gap,
      riskLevel: forecast.riskLevel as 'SAFE' | 'CAUTION' | 'RISK',
    }));

    res.json({
      success: true,
      data: {
        forecast: formattedForecast,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get KPI data for dashboard
 * Returns: OTIF, DIO, Fill Rate, and Turnover metrics
 */
export const getKPIData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    // Get current period (month)
    const now = new Date();
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get latest KPIs for the company
    const kpis = await prisma.kPI.findMany({
      where: {
        companyId,
        name: {
          in: ['OTIF', 'DIO', 'FILL_RATE', 'TURNOVER'],
        },
        period: currentPeriod,
      },
    });

    // Helper to format KPI value
    const formatKPI = (name: string, defaultValue: number, defaultTrend: number, defaultTarget: number) => {
      const kpi = kpis.find(k => k.name === name);
      if (!kpi) {
        return {
          value: defaultValue,
          trend: defaultTrend,
          status: 'ON_TRACK' as const,
          target: defaultTarget,
        };
      }

      return {
        value: name === 'DIO' || name === 'TURNOVER' ? Math.round(kpi.value * 10) / 10 : Math.round(kpi.value),
        trend: Math.round(kpi.trend * 10) / 10,
        status: kpi.status as 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK',
        target: name === 'DIO' || name === 'TURNOVER' ? Math.round(kpi.target * 10) / 10 : Math.round(kpi.target),
      };
    };

    res.json({
      success: true,
      data: {
        otif: formatKPI('OTIF', 95, 0, 95),
        dio: formatKPI('DIO', 45, 0, 50),
        fillRate: formatKPI('FILL_RATE', 98, 0, 98),
        turnover: formatKPI('TURNOVER', 6.0, 0, 5.0),
      },
    });
  } catch (error) {
    next(error);
  }
};

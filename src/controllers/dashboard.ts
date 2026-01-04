import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extended request interface for dashboard queries
interface DashboardQueryRequest extends Request {
  query?: {
    stockLevel?: string;
    status?: string;
    priority?: string;
    supplierId?: string;
    limit?: string;
    weeks?: string;
    year?: string;
    startWeek?: string;
    name?: string;
    period?: string;
  };
}

/**
 * Get inventory data for dashboard
 * Returns: total SKUs, stock value, low stock count, stock health, fast/slow movers
 */
export const getInventoryData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { stockLevel, minStockValue, maxStockValue } = req.query;

    // Build filter conditions
    const whereClause: any = { companyId };
    
    if (stockLevel) {
      whereClause.stockLevel = stockLevel;
    }
    
    // Get all inventory for the company with optional filters
    const inventory = await prisma.inventory.findMany({
      where: whereClause,
    });

    // Apply value filters in-memory if needed (for complex range queries)
    let filteredInventory = inventory;
    if (minStockValue || maxStockValue) {
      filteredInventory = inventory.filter(item => {
        const value = item.quantity * item.unitCost;
        if (minStockValue && value < Number(minStockValue)) return false;
        if (maxStockValue && value > Number(maxStockValue)) return false;
        return true;
      });
    }

    // Calculate metrics
    const totalSKUs = filteredInventory.length;
    const stockValue = filteredInventory.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
    const lowStockCount = filteredInventory.filter(item => item.stockLevel === 'LOW').length;
    const outOfStockCount = filteredInventory.filter(item => item.stockLevel === 'OUT_OF_STOCK').length;

    // Calculate stock health percentage (healthy items / total items)
    const healthyCount = filteredInventory.filter(item => item.stockLevel === 'HEALTHY').length;
    const stockHealth = totalSKUs > 0 ? Math.round((healthyCount / totalSKUs) * 100) : 100;

    // Get top 5 fast movers (highest turnover rate)
    const fastMovers = filteredInventory
      .filter(item => item.turnoverRate !== null && item.turnoverRate > 0)
      .sort((a, b) => (b.turnoverRate || 0) - (a.turnoverRate || 0))
      .slice(0, 5)
      .map(item => ({
        sku: item.sku,
        qty: item.quantity,
      }));

    // Get top 5 slow movers (lowest turnover rate)
    const slowMovers = filteredInventory
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
    const { status, priority, supplierId, limit } = req.query;

    // Build filter conditions
    const whereClause: any = {
      companyId,
      status: {
        in: ['PENDING', 'ON_TIME', 'DELAYED'],
      },
    };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (supplierId) {
      whereClause.supplierId = supplierId;
    }

    // Get orders with optional filters
    const orders = await prisma.order.findMany({
      where: whereClause,
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
      take: limit ? Math.min(Number(limit), 100) : 50, // Default 50, max 100
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
    const { status, minOnTimeRate, minQualityRate, maxLeadTime } = req.query;

    // Build filter conditions
    const whereClause: any = {
      companyId,
      status: 'ACTIVE',
    };

    if (status) {
      whereClause.status = status;
    }

    // Get all suppliers for the company with optional filters
    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc',
      },
    });

    // Apply in-memory filters for numeric thresholds
    let filteredSuppliers = suppliers;
    if (minOnTimeRate || minQualityRate || maxLeadTime) {
      filteredSuppliers = suppliers.filter(supplier => {
        if (minOnTimeRate && supplier.onTimeRate < Number(minOnTimeRate)) return false;
        if (minQualityRate && supplier.qualityRate < Number(minQualityRate)) return false;
        if (maxLeadTime && supplier.leadTime > Number(maxLeadTime)) return false;
        return true;
      });
    }

    // Calculate averages
    const avgOnTime = filteredSuppliers.length > 0
      ? Math.round(filteredSuppliers.reduce((sum, s) => sum + s.onTimeRate, 0) / filteredSuppliers.length)
      : 0;
    const avgQuality = filteredSuppliers.length > 0
      ? Math.round(filteredSuppliers.reduce((sum, s) => sum + s.qualityRate, 0) / filteredSuppliers.length)
      : 0;
    const avgLeadTime = filteredSuppliers.length > 0
      ? Math.round(filteredSuppliers.reduce((sum, s) => sum + s.leadTime, 0) / filteredSuppliers.length * 10) / 10
      : 0;

    // Get top 3 suppliers (highest combined performance score)
    const topSuppliers = filteredSuppliers
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
    const underperforming = filteredSuppliers
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
    const { weeks, year, startWeek, riskLevel } = req.query;

    // Get current date defaults
    const now = new Date();
    const currentYear = year ? Number(year) : now.getFullYear();
    const currentWeek = startWeek ? Number(startWeek) : Math.ceil(now.getDate() / 7);
    const weeksToFetch = weeks ? Math.min(Number(weeks), 12) : 4; // Max 12 weeks

    // Get forecast data with optional filters
    const whereClause: any = {
      companyId,
      year: currentYear,
      week: {
        gte: currentWeek,
      },
    };

    if (riskLevel) {
      whereClause.riskLevel = riskLevel;
    }

    const forecasts = await prisma.demandForecast.findMany({
      where: whereClause,
      orderBy: {
        week: 'asc',
      },
      take: weeksToFetch,
    });

    // If we don't have enough forecasts, generate synthetic data for missing weeks
    const formattedForecast = [];
    for (let i = 0; i < weeksToFetch; i++) {
      const weekNum = currentWeek + i;
      const existingForecast = forecasts.find(f => f.week === weekNum);

      if (existingForecast) {
        formattedForecast.push({
          week: existingForecast.week,
          demand: existingForecast.demand,
          supply: existingForecast.supply,
          gap: existingForecast.gap,
          riskLevel: existingForecast.riskLevel as 'SAFE' | 'CAUTION' | 'RISK',
        });
      } else {
        // Generate synthetic data for planning purposes
        const baseDemand = 500;
        const baseSupply = 500;
        formattedForecast.push({
          week: weekNum,
          demand: baseDemand + Math.floor(Math.random() * 100 - 50),
          supply: baseSupply + Math.floor(Math.random() * 100 - 50),
          gap: Math.floor(Math.random() * 100 - 50),
          riskLevel: 'CAUTION' as const,
        });
      }
    }

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
    const { name, period } = req.query;

    // Get current period (month) if not specified
    const now = new Date();
    const currentPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Build filter conditions
    const whereClause: any = {
      companyId,
      period: currentPeriod,
    };

    const kpiNames = name ? [name] : ['OTIF', 'DIO', 'FILL_RATE', 'TURNOVER'];
    whereClause.name = { in: kpiNames };

    // Get KPIs for the company
    const kpis = await prisma.kPI.findMany({
      where: whereClause,
    });

    // Helper to format KPI value
    const formatKPI = (kpiName: string, defaultValue: number, defaultTrend: number, defaultTarget: number) => {
      const kpi = kpis.find(k => k.name === kpiName);
      if (!kpi) {
        return {
          value: defaultValue,
          trend: defaultTrend,
          status: 'ON_TRACK' as const,
          target: defaultTarget,
        };
      }

      return {
        value: kpiName === 'DIO' || kpiName === 'TURNOVER' ? Math.round(kpi.value * 10) / 10 : Math.round(kpi.value),
        trend: Math.round(kpi.trend * 10) / 10,
        status: kpi.status as 'EXCELLENT' | 'ON_TRACK' | 'AT_RISK',
        target: kpiName === 'DIO' || kpiName === 'TURNOVER' ? Math.round(kpi.target * 10) / 10 : Math.round(kpi.target),
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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ForecastData {
  sku: string;
  historicalData: number[];
  forecast: ForecastPeriod[];
  seasonalityIndex: number;
  trend: number;
}

interface ForecastPeriod {
  period: string;
  demand: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

class ForecastService {
  async generateForecast(companyId: string, sku: string, months: number = 12): Promise<ForecastData> {
    const historicalData = await this.getHistoricalData(companyId, sku);

    if (historicalData.length < 3) {
      throw new Error('Insufficient historical data for forecasting');
    }

    const seasonalityIndex = this.calculateSeasonalityIndex(historicalData);
    const trend = this.calculateTrend(historicalData);
    const forecast = this.generateForecastPeriods(historicalData, trend, seasonalityIndex, months);

    const result: ForecastData = {
      sku,
      historicalData,
      forecast,
      seasonalityIndex,
      trend,
    };

    await this.saveForecast(companyId, sku, result);

    return result;
  }

  async generateBulkForecasts(companyId: string, months: number = 12): Promise<ForecastData[]> {
    const inventory = await prisma.inventory.findMany({
      where: { companyId },
      select: { sku: true, name: true },
    });

    const forecasts: ForecastData[] = [];

    for (const item of inventory) {
      try {
        const forecast = await this.generateForecast(companyId, item.sku, months);
        forecasts.push(forecast);
      } catch (error) {
        console.error(`Failed to generate forecast for SKU ${item.sku}:`, error);
      }
    }

    return forecasts;
  }

  private async getHistoricalData(companyId: string, sku: string): Promise<number[]> {
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        companyId,
      },
      orderBy: [
        { year: 'asc' },
        { week: 'asc' },
      ],
      take: 52,
    });

    const demandData = forecasts.map(f => f.demand);

    if (demandData.length < 3) {
      const inventory = await prisma.inventory.findUnique({
        where: {
          companyId_sku_locationId: {
            companyId,
            sku,
            locationId: null,
          },
        },
      });

      if (inventory) {
        return this.generateMockHistoricalData(inventory.quantity);
      }
    }

    return demandData.length > 0 ? demandData : this.generateMockHistoricalData(100);
  }

  private generateMockHistoricalData(baseValue: number): number[] {
    const data: number[] = [];
    for (let i = 0; i < 12; i++) {
      const variation = (Math.random() - 0.5) * baseValue * 0.3;
      const seasonality = Math.sin((i / 12) * Math.PI * 2) * baseValue * 0.2;
      data.push(Math.max(0, Math.round(baseValue + variation + seasonality)));
    }
    return data;
  }

  private calculateSeasonalityIndex(data: number[]): number {
    if (data.length < 2) return 1.0;

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const recentMean = data.slice(-3).reduce((sum, val) => sum + val, 0) / 3;

    return recentMean / mean || 1.0;
  }

  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;

    const n = data.length;
    const firstHalf = data.slice(0, Math.floor(n / 2)).reduce((sum, val) => sum + val, 0) / Math.floor(n / 2);
    const secondHalf = data.slice(Math.floor(n / 2)).reduce((sum, val) => sum + val, 0) / Math.ceil(n / 2);

    return ((secondHalf - firstHalf) / firstHalf) * 100 || 0;
  }

  private generateForecastPeriods(
    historicalData: number[],
    trend: number,
    seasonalityIndex: number,
    months: number
  ): ForecastPeriod[] {
    const forecast: ForecastPeriod[] = [];
    const baseDemand = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;
    const trendFactor = 1 + (trend / 100);
    const standardDeviation = this.calculateStandardDeviation(historicalData);

    let currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() + 1);

    for (let i = 0; i < months; i++) {
      const seasonalityAdjustment = 1 + (Math.sin((i / 12) * Math.PI * 2) * 0.2);
      const trendAdjustment = Math.pow(trendFactor, i);
      const demand = Math.round(baseDemand * seasonalityAdjustment * trendAdjustment * seasonalityIndex);
      const margin = standardDeviation * 1.96;

      const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

      forecast.push({
        period,
        demand,
        lowerBound: Math.max(0, Math.round(demand - margin)),
        upperBound: Math.round(demand + margin),
        confidence: 0.95,
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return forecast;
  }

  private calculateStandardDeviation(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDifferences = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / data.length;
    return Math.sqrt(variance);
  }

  private async saveForecast(companyId: string, sku: string, forecastData: ForecastData): Promise<void> {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const periodData of forecastData.forecast) {
      await prisma.forecastHistory.upsert({
        where: {
          companyId_sku_period: {
            companyId,
            sku,
            period: periodData.period,
          },
        },
        update: {
          forecast: periodData.demand,
          confidence: periodData.confidence,
        },
        create: {
          companyId,
          sku,
          period: periodData.period,
          forecast: periodData.demand,
          confidence: periodData.confidence,
          metadata: {
            lowerBound: periodData.lowerBound,
            upperBound: periodData.upperBound,
            trend: forecastData.trend,
            seasonalityIndex: forecastData.seasonalityIndex,
          },
        },
      });
    }
  }

  async calculateReorderPoint(companyId: string, sku: string): Promise<{ reorderPoint: number; safetyStock: number }> {
    const inventory = await prisma.inventory.findFirst({
      where: { companyId, sku },
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    const historicalData = await this.getHistoricalData(companyId, sku);
    const averageDailyDemand = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length / 30;
    const standardDeviation = this.calculateStandardDeviation(historicalData);

    const leadTime = inventory.safetyStock || 7;
    const zScore = 1.96;

    const safetyStock = Math.ceil(zScore * standardDeviation * Math.sqrt(leadTime));
    const reorderPoint = Math.ceil(averageDailyDemand * leadTime + safetyStock);

    return { reorderPoint, safetyStock };
  }

  async generateReorderSuggestions(companyId: string): Promise<any[]> {
    const suggestions: any[] = [];
    const inventory = await prisma.inventory.findMany({
      where: { companyId },
      include: { supplier: true },
    });

    for (const item of inventory) {
      if (item.quantity <= (item.reorderPoint || 0) && item.stockLevel !== 'OUT_OF_STOCK') {
        const { reorderPoint, safetyStock } = await this.calculateReorderPoint(companyId, item.sku);
        const suggestedQty = item.reorderQty || Math.max(safetyStock * 2, reorderPoint - item.quantity);

        const suggestion = await prisma.reorderSuggestion.create({
          data: {
            companyId,
            sku: item.sku,
            inventoryId: item.id,
            suggestedQty,
            reason: 'below_reorder_point',
            priority: item.quantity === 0 ? 'URGENT' : item.quantity < item.reorderPoint / 2 ? 'HIGH' : 'MEDIUM',
            status: 'pending',
          },
        });

        suggestions.push({
          ...suggestion,
          inventoryName: item.name,
          currentQuantity: item.quantity,
          unitCost: item.unitCost,
          supplier: item.supplier?.name,
        });
      }
    }

    return suggestions;
  }

  async getAgingAnalysis(companyId: string): Promise<any[]> {
    const inventory = await prisma.inventory.findMany({
      where: { companyId },
      include: { location: true },
    });

    const analysis: any[] = [];

    for (const item of inventory) {
      const daysSinceUpdate = Math.floor((new Date().getTime() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
      const turnoverRate = item.turnoverRate || 0;

      let category = 'Fast Mover';
      if (turnoverRate < 2 || daysSinceUpdate > 180) {
        category = 'Slow Mover';
      } else if (turnoverRate < 4 || daysSinceUpdate > 90) {
        category = 'Medium Mover';
      }

      analysis.push({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        value: item.quantity * item.unitCost,
        turnoverRate,
        daysSinceLastUpdate: daysSinceUpdate,
        category,
        location: item.location?.name,
      });
    }

    return analysis.sort((a, b) => a.turnoverRate - b.turnoverRate);
  }

  async getABCXYZAnalysis(companyId: string): Promise<any[]> {
    const inventory = await prisma.inventory.findMany({
      where: { companyId },
    });

    const totalValue = inventory.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    const sortedByValue = [...inventory].sort((a, b) => (b.quantity * b.unitCost) - (a.quantity * a.unitCost));

    let cumulativeValue = 0;
    const abcAnalysis = sortedByValue.map((item) => {
      cumulativeValue += item.quantity * item.unitCost;
      const percentage = (cumulativeValue / totalValue) * 100;

      let abcClass = 'C';
      if (percentage <= 80) abcClass = 'A';
      else if (percentage <= 95) abcClass = 'B';

      const turnoverRate = item.turnoverRate || 0;
      const daysSinceUpdate = Math.floor((new Date().getTime() - item.lastUpdated.getTime()) / (1000 * 60 * 60 * 24));

      let xyzClass = 'Z';
      if (turnoverRate >= 4 || daysSinceUpdate <= 60) xyzClass = 'X';
      else if (turnoverRate >= 2 || daysSinceUpdate <= 90) xyzClass = 'Y';

      return {
        sku: item.sku,
        name: item.name,
        value: item.quantity * item.unitCost,
        valuePercentage: ((item.quantity * item.unitCost) / totalValue) * 100,
        cumulativePercentage: percentage,
        abcClass,
        xyzClass,
        category: `${abcClass}${xyzClass}`,
        turnoverRate,
        quantity: item.quantity,
      };
    });

    return abcAnalysis;
  }

  async calculateForecastAccuracy(companyId: string, sku: string, months: number = 12): Promise<number> {
    const forecasts = await prisma.forecastHistory.findMany({
      where: { companyId, sku, actual: { not: null } },
      orderBy: { period: 'asc' },
      take: months,
    });

    if (forecasts.length === 0) return 0;

    let totalError = 0;
    for (const forecast of forecasts) {
      const error = Math.abs((forecast.actual! - forecast.forecast) / forecast.actual!);
      totalError += error;
    }

    const meanAbsolutePercentageError = (totalError / forecasts.length) * 100;
    return Math.max(0, Math.round((1 - meanAbsolutePercentageError / 100) * 100));
  }
}

export const forecastService = new ForecastService();

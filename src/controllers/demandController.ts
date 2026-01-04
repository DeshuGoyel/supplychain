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
 * Get 12-month demand forecast
 */
export const getDemandForecast = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { scenario = 'EXPECTED' } = req.query;

    const forecasts = await prisma.demandForecast.findMany({
      where: {
        companyId,
        scenario: scenario as string
      },
      orderBy: {
        period: 'asc'
      }
    });

    res.json({
      success: true,
      data: forecasts,
      scenario
    });
  } catch (error) {
    console.error('Error fetching demand forecast:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching demand forecast',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get historical demand data
 */
export const getHistoricalDemand = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    // Get forecasts with actual data (historical)
    const historical = await prisma.demandForecast.findMany({
      where: {
        companyId,
        actualQty: { not: null }
      },
      orderBy: {
        period: 'desc'
      },
      take: 24 // Last 24 months
    });

    res.json({
      success: true,
      data: historical
    });
  } catch (error) {
    console.error('Error fetching historical demand:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching historical demand',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get forecast accuracy
 */
export const getForecastAccuracy = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    // Get forecasts with actual data
    const forecasts = await prisma.demandForecast.findMany({
      where: {
        companyId,
        actualQty: { not: null }
      },
      orderBy: {
        period: 'desc'
      },
      take: 12
    });

    // Calculate accuracy metrics
    const monthlyAccuracy = forecasts.map(f => {
      if (!f.actualQty) return null;

      const variance = Math.abs(f.actualQty - f.forecastQty);
      const variancePct = (variance / f.actualQty) * 100;

      return {
        period: f.period,
        forecast: f.forecastQty,
        actual: f.actualQty,
        variance,
        variancePct: Math.round(variancePct * 10) / 10,
        accuracy: Math.round((1 - variance / f.actualQty) * 100 * 10) / 10
      };
    }).filter(Boolean);

    // Calculate overall accuracy
    const overallAccuracy = monthlyAccuracy.length > 0
      ? Math.round(monthlyAccuracy.reduce((sum, m: any) => sum + m.accuracy, 0) / monthlyAccuracy.length)
      : 0;

    // Identify top misses
    const topMisses = monthlyAccuracy
      .filter((m: any) => m.variancePct > 20)
      .sort((a: any, b: any) => b.variancePct - a.variancePct)
      .slice(0, 5);

    // Calculate trend
    const recentAccuracy = monthlyAccuracy.slice(0, 6);
    const olderAccuracy = monthlyAccuracy.slice(6);
    const recentAvg = recentAccuracy.length > 0
      ? recentAccuracy.reduce((sum: number, m: any) => sum + m.accuracy, 0) / recentAccuracy.length
      : 0;
    const olderAvg = olderAccuracy.length > 0
      ? olderAccuracy.reduce((sum: number, m: any) => sum + m.accuracy, 0) / olderAccuracy.length
      : 0;
    const trend = recentAvg - olderAvg;

    res.json({
      success: true,
      data: {
        overallAccuracy,
        monthlyAccuracy,
        topMisses,
        trend: trend > 0 ? 'IMPROVING' : trend < 0 ? 'DECLINING' : 'STABLE',
        trendValue: Math.round(trend * 10) / 10
      }
    });
  } catch (error) {
    console.error('Error fetching forecast accuracy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching forecast accuracy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Create scenario
 */
export const createScenario = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { name, adjustment, periods } = req.body;

    // Get base forecasts
    const baseForecasts = await prisma.demandForecast.findMany({
      where: {
        companyId,
        scenario: 'EXPECTED'
      },
      orderBy: {
        period: 'asc'
      }
    });

    // Create new scenario forecasts
    const scenarioForecasts = baseForecasts.map(forecast => {
      const adjustedQty = Math.round(forecast.forecastQty * (1 + adjustment / 100));
      const confidenceLevel = 0.7 + Math.random() * 0.1;

      return {
        companyId,
        period: forecast.period,
        forecastQty: adjustedQty,
        confidenceLevel,
        bestCase: Math.round(adjustedQty * (1 + confidenceLevel)),
        worstCase: Math.round(adjustedQty * (1 - confidenceLevel)),
        scenario: name
      };
    });

    // Delete existing scenario forecasts
    await prisma.demandForecast.deleteMany({
      where: {
        companyId,
        scenario: name
      }
    });

    // Create new scenario forecasts
    await prisma.demandForecast.createMany({
      data: scenarioForecasts
    });

    res.status(201).json({
      success: true,
      message: 'Scenario created successfully',
      data: {
        scenario: name,
        adjustment,
        forecasts: scenarioForecasts
      }
    });
  } catch (error) {
    console.error('Error creating scenario:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating scenario',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

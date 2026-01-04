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
 * Get active shipments
 */
export const getShipments = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { status, carrier, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { companyId };

    if (status) {
      where.status = status as string;
    } else {
      // Default to active shipments (not delivered)
      where.status = { not: 'DELIVERED' };
    }

    if (carrier) {
      where.carrier = carrier as string;
    }

    const [shipments, total] = await Promise.all([
      prisma.shipment.findMany({
        where,
        include: {
          purchaseOrder: {
            include: {
              supplier: true,
              items: true
            }
          },
          fromLocation: true,
          toLocation: true
        },
        skip,
        take: limitNum,
        orderBy: {
          estimatedDelivery: 'asc'
        }
      }),
      prisma.shipment.count({ where })
    ]);

    res.json({
      success: true,
      data: shipments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shipments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get shipment detail with tracking history
 */
export const getShipmentDetail = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;

    const shipment = await prisma.shipment.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            items: true
          }
        },
        fromLocation: true,
        toLocation: true
      }
    });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: 'Shipment not found'
      });
    }

    // Parse timeline if exists
    let timeline = null;
    if (shipment.timeline) {
      try {
        timeline = JSON.parse(shipment.timeline);
      } catch (e) {
        timeline = [];
      }
    }

    // Generate mock tracking events if timeline doesn't exist
    if (!timeline) {
      timeline = generateTrackingEvents(shipment);
    }

    res.json({
      success: true,
      data: {
        ...shipment,
        timeline
      }
    });
  } catch (error) {
    console.error('Error fetching shipment detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching shipment detail',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get delayed shipments (exceptions)
 */
export const getDelayedShipments = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    const delayedShipments = await prisma.shipment.findMany({
      where: {
        companyId,
        status: 'DELAYED'
      },
      include: {
        purchaseOrder: {
          include: {
            supplier: true
          }
        },
        toLocation: true
      },
      orderBy: {
        daysLate: 'desc'
      }
    });

    // Add severity-based recommendations
    const shipmentsWithAlerts = delayedShipments.map(shipment => {
      let recommendation = '';
      let impact = 'LOW';

      if (shipment.daysLate >= 5) {
        impact = 'HIGH';
        recommendation = `Critical delay. ${shipment.daysLate} days late. Escalate to supplier management team.`;
      } else if (shipment.daysLate >= 2) {
        impact = 'MEDIUM';
        recommendation = `Contact customer immediately to assess impact and discuss alternatives.`;
      } else {
        impact = 'LOW';
        recommendation = `Monitor shipment closely. Consider contingency planning if delay extends.`;
      }

      return {
        ...shipment,
        impact,
        recommendation
      };
    });

    res.json({
      success: true,
      data: shipmentsWithAlerts
    });
  } catch (error) {
    console.error('Error fetching delayed shipments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching delayed shipments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get carrier performance
 */
export const getCarrierPerformance = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;

    const shipments = await prisma.shipment.findMany({
      where: { companyId },
      select: {
        carrier: true,
        status: true,
        daysLate: true
      }
    });

    // Group by carrier
    const carrierStats = new Map<string, {
      total: number;
      onTime: number;
      delayed: number;
      totalDaysLate: number;
    }>();

    shipments.forEach(shipment => {
      const stats = carrierStats.get(shipment.carrier) || {
        total: 0,
        onTime: 0,
        delayed: 0,
        totalDaysLate: 0
      };

      stats.total++;
      if (shipment.status === 'DELIVERED' && shipment.daysLate <= 0) {
        stats.onTime++;
      } else if (shipment.daysLate > 0) {
        stats.delayed++;
        stats.totalDaysLate += shipment.daysLate;
      }

      carrierStats.set(shipment.carrier, stats);
    });

    // Convert to array and calculate metrics
    const carrierPerformance = Array.from(carrierStats.entries()).map(([carrier, stats]) => ({
      carrier,
      totalShipments: stats.total,
      onTimeShipments: stats.onTime,
      delayedShipments: stats.delayed,
      onTimePct: stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0,
      avgDaysLate: stats.delayed > 0 ? Math.round(stats.totalDaysLate / stats.delayed * 10) / 10 : 0,
      qualityRating: stats.delayed > 0
        ? Math.max(1, 5 - (stats.delayed / stats.total) * 3)
        : 5
    }));

    // Sort by on-time percentage
    carrierPerformance.sort((a, b) => b.onTimePct - a.onTimePct);

    res.json({
      success: true,
      data: carrierPerformance
    });
  } catch (error) {
    console.error('Error fetching carrier performance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching carrier performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Helper function to generate tracking events
 */
function generateTrackingEvents(shipment: any): any[] {
  const events = [];

  if (shipment.status === 'DELIVERED' && shipment.actualDelivery) {
    const actualDate = new Date(shipment.actualDelivery);
    events.push({
      event: 'Delivered',
      date: actualDate.toISOString(),
      location: shipment.toLocation?.name || 'Destination'
    });
  }

  const estimatedDate = new Date(shipment.estimatedDelivery);
  events.push({
    event: 'Out for Delivery',
    date: new Date(estimatedDate.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    location: shipment.toLocation?.city || 'Near destination'
  });

  events.push({
    event: 'In Transit',
    date: new Date(estimatedDate.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    location: 'Distribution Center'
  });

  events.push({
    event: 'Shipped',
    date: new Date(estimatedDate.getTime() - 72 * 60 * 60 * 1000).toISOString(),
    location: shipment.fromLocation?.name || 'Origin'
  });

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

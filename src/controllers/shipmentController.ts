import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getShipments = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { 
      page = '1', 
      limit = '50',
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = { companyId };
    if (status) {
      if (status === 'active') {
        where.status = { in: ['PENDING', 'PICKED', 'SHIPPED', 'IN_TRANSIT'] };
      } else {
        where.status = status;
      }
    }

    const [shipments, totalCount] = await Promise.all([
      prisma.shipment.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          timeline: {
            orderBy: { timestamp: 'desc' }
          }
        }
      }),
      prisma.shipment.count({ where })
    ]);

    const formattedShipments = shipments.map(shipment => {
      const now = new Date();
      const eta = shipment.eta ? new Date(shipment.eta) : null;
      const isDelayed = eta && now > eta && shipment.status !== 'DELIVERED';
      const daysLate = isDelayed && eta 
        ? Math.floor((now.getTime() - eta.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const items = shipment.items ? JSON.parse(shipment.items) : [];

      return {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        fromLocation: shipment.fromLocation,
        toLocation: shipment.toLocation,
        eta: shipment.eta,
        actualDelivery: shipment.actualDelivery,
        daysLate: daysLate,
        isDelayed: isDelayed,
        orderReference: shipment.orderReference,
        totalValue: shipment.totalValue,
        items: items,
        latestUpdate: shipment.timeline[0] || null,
        createdAt: shipment.createdAt
      };
    });

    res.json({
      success: true,
      data: {
        shipments: formattedShipments,
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

export const getShipmentById = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const shipment = await prisma.shipment.findFirst({
      where: { id, companyId },
      include: {
        timeline: {
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!shipment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found'
        }
      });
      return;
    }

    const now = new Date();
    const eta = shipment.eta ? new Date(shipment.eta) : null;
    const isDelayed = eta && now > eta && shipment.status !== 'DELIVERED';
    const daysLate = isDelayed && eta 
      ? Math.floor((now.getTime() - eta.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const items = shipment.items ? JSON.parse(shipment.items) : [];

    res.json({
      success: true,
      data: {
        ...shipment,
        items,
        isDelayed,
        daysLate
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createShipment = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { 
      trackingNumber,
      carrier,
      fromLocation,
      toLocation,
      eta,
      orderReference,
      totalValue,
      items
    } = req.body;

    if (!trackingNumber || !carrier || !fromLocation || !toLocation) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Tracking number, carrier, from location, and to location are required',
          details: { requiredFields: ['trackingNumber', 'carrier', 'fromLocation', 'toLocation'] }
        }
      });
      return;
    }

    const shipment = await prisma.shipment.create({
      data: {
        companyId,
        trackingNumber,
        carrier,
        fromLocation,
        toLocation,
        eta: eta ? new Date(eta) : null,
        orderReference,
        totalValue,
        items: items ? JSON.stringify(items) : null,
        status: 'PENDING',
        timeline: {
          create: {
            status: 'PENDING',
            location: fromLocation,
            notes: 'Shipment created'
          }
        }
      },
      include: {
        timeline: true
      }
    });

    res.status(201).json({
      success: true,
      data: shipment
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_TRACKING',
          message: 'Tracking number already exists'
        }
      });
      return;
    }
    next(error);
  }
};

export const updateShipmentStatus = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { status, location, notes } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status is required',
          details: { field: 'status' }
        }
      });
      return;
    }

    const existing = await prisma.shipment.findFirst({
      where: { id, companyId }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Shipment not found'
        }
      });
      return;
    }

    const updateData: any = { status };
    if (status === 'DELIVERED') {
      updateData.actualDelivery = new Date();
    }

    const [updated] = await Promise.all([
      prisma.shipment.update({
        where: { id },
        data: updateData,
        include: {
          timeline: {
            orderBy: { timestamp: 'desc' }
          }
        }
      }),
      prisma.shipmentTimeline.create({
        data: {
          shipmentId: id,
          status,
          location: location || existing.toLocation,
          notes: notes || `Status updated to ${status}`
        }
      })
    ]);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const getDelayedShipments = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;
    const now = new Date();

    const shipments = await prisma.shipment.findMany({
      where: {
        companyId,
        status: { in: ['PENDING', 'PICKED', 'SHIPPED', 'IN_TRANSIT'] },
        eta: { lt: now }
      },
      include: {
        timeline: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { eta: 'asc' }
    });

    const delayedShipments = shipments.map(shipment => {
      const eta = shipment.eta!;
      const daysLate = Math.floor((now.getTime() - eta.getTime()) / (1000 * 60 * 60 * 24));
      const items = shipment.items ? JSON.parse(shipment.items) : [];

      return {
        id: shipment.id,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        fromLocation: shipment.fromLocation,
        toLocation: shipment.toLocation,
        eta: shipment.eta,
        daysLate,
        orderReference: shipment.orderReference,
        totalValue: shipment.totalValue,
        items,
        latestUpdate: shipment.timeline[0] || null
      };
    });

    res.json({
      success: true,
      data: delayedShipments
    });
  } catch (error) {
    next(error);
  }
};

export const getCarrierPerformance = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { companyId } = req.user;

    const shipments = await prisma.shipment.findMany({
      where: { companyId },
      select: {
        carrier: true,
        status: true,
        eta: true,
        actualDelivery: true,
        daysLate: true
      }
    });

    const carrierStats: { [key: string]: any } = {};

    shipments.forEach(shipment => {
      if (!carrierStats[shipment.carrier]) {
        carrierStats[shipment.carrier] = {
          total: 0,
          onTime: 0,
          late: 0,
          totalDaysLate: 0,
          delivered: 0
        };
      }

      const stats = carrierStats[shipment.carrier];
      stats.total++;

      if (shipment.status === 'DELIVERED') {
        stats.delivered++;
        const eta = shipment.eta ? new Date(shipment.eta) : null;
        const actual = shipment.actualDelivery ? new Date(shipment.actualDelivery) : null;

        if (eta && actual) {
          if (actual <= eta) {
            stats.onTime++;
          } else {
            stats.late++;
            const daysLate = Math.floor((actual.getTime() - eta.getTime()) / (1000 * 60 * 60 * 24));
            stats.totalDaysLate += daysLate;
          }
        }
      }
    });

    const carriers = Object.keys(carrierStats).map(carrier => {
      const stats = carrierStats[carrier];
      const onTimeRate = stats.delivered > 0 
        ? Math.round((stats.onTime / stats.delivered) * 100)
        : 0;
      const avgDaysLate = stats.late > 0 
        ? Math.round((stats.totalDaysLate / stats.late) * 10) / 10
        : 0;

      return {
        carrier,
        onTimeRate,
        avgDaysLate,
        totalShipments: stats.total,
        deliveredShipments: stats.delivered
      };
    });

    carriers.sort((a, b) => b.onTimeRate - a.onTimeRate);

    res.json({
      success: true,
      data: carriers
    });
  } catch (error) {
    next(error);
  }
};

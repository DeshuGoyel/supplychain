import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Extended seed data for Supply Chain MVP
 * Creates comprehensive demo data for all modules
 */
const seedSupplyChainData = async () => {
  try {
    console.log('🌱 Starting supply chain data seeding...');

    // Get existing companies
    const companies = await prisma.company.findMany();
    if (companies.length === 0) {
      throw new Error('No companies found. Please run basic seed first.');
    }

    const acmeCompany = companies.find(c => c.name === 'Acme Manufacturing');
    const techRetailCompany = companies.find(c => c.name === 'TechRetail Inc');

    if (!acmeCompany || !techRetailCompany) {
      throw new Error('Required companies not found');
    }

    // Create Locations
    console.log('📍 Creating locations...');
    const locations = await Promise.all([
      // Acme locations
      prisma.location.create({
        data: {
          companyId: acmeCompany.id,
          name: 'Main Warehouse',
          type: 'WAREHOUSE',
          address: '123 Industrial Blvd, Detroit, MI',
          manager: 'John Smith',
          capacity: 10000
        }
      }),
      prisma.location.create({
        data: {
          companyId: acmeCompany.id,
          name: 'DC East',
          type: 'DC',
          address: '456 Logistics Way, Pittsburgh, PA',
          manager: 'Sarah Johnson',
          capacity: 5000
        }
      }),
      // TechRetail locations
      prisma.location.create({
        data: {
          companyId: techRetailCompany.id,
          name: 'Flagship Store',
          type: 'RETAIL',
          address: '789 Market St, San Francisco, CA',
          manager: 'Lisa Davis',
          capacity: 1000
        }
      }),
      prisma.location.create({
        data: {
          companyId: techRetailCompany.id,
          name: 'Central Warehouse',
          type: 'WAREHOUSE',
          address: '321 Commerce Ave, Los Angeles, CA',
          manager: 'Michael Brown',
          capacity: 15000
        }
      })
    ]);

    console.log(`✅ Created ${locations.length} locations`);

    // Create Suppliers
    console.log('🏭 Creating suppliers...');
    const suppliers = await Promise.all([
      // Acme suppliers
      prisma.supplier.create({
        data: {
          companyId: acmeCompany.id,
          name: 'SteelCo Industries',
          contactName: 'Robert Chen',
          email: 'robert@steelco.com',
          phone: '+1-555-0101',
          leadTimeDays: 7,
          paymentTerms: 'NET 30',
          performanceScore: 92,
          onTimePct: 95,
          qualityRating: 4.5,
          priceTier: 'PREMIUM',
          status: 'ACTIVE'
        }
      }),
      prisma.supplier.create({
        data: {
          companyId: acmeCompany.id,
          name: 'ElectroParts Ltd',
          contactName: 'Maria Garcia',
          email: 'maria@electroparts.com',
          phone: '+1-555-0102',
          leadTimeDays: 5,
          paymentTerms: 'NET 45',
          performanceScore: 78,
          onTimePct: 82,
          qualityRating: 3.8,
          priceTier: 'STANDARD',
          status: 'ACTIVE'
        }
      }),
      prisma.supplier.create({
        data: {
          companyId: acmeCompany.id,
          name: 'Global Logistics',
          contactName: 'James Wilson',
          email: 'james@globallogistics.com',
          phone: '+1-555-0103',
          leadTimeDays: 10,
          paymentTerms: 'NET 30',
          performanceScore: 85,
          onTimePct: 88,
          qualityRating: 4.2,
          priceTier: 'STANDARD',
          status: 'ACTIVE'
        }
      }),
      // TechRetail suppliers
      prisma.supplier.create({
        data: {
          companyId: techRetailCompany.id,
          name: 'TechComponents Inc',
          contactName: 'Emily Zhang',
          email: 'emily@techcomponents.com',
          phone: '+1-555-0201',
          leadTimeDays: 3,
          paymentTerms: 'NET 15',
          performanceScore: 96,
          onTimePct: 98,
          qualityRating: 4.8,
          priceTier: 'PREMIUM',
          status: 'ACTIVE'
        }
      }),
      prisma.supplier.create({
        data: {
          companyId: techRetailCompany.id,
          name: 'Asian Manufacturing',
          contactName: 'Kenji Tanaka',
          email: 'kenji@asianmfg.com',
          phone: '+1-555-0202',
          leadTimeDays: 14,
          paymentTerms: 'NET 60',
          performanceScore: 72,
          onTimePct: 75,
          qualityRating: 3.5,
          priceTier: 'BUDGET',
          status: 'ACTIVE'
        }
      })
    ]);

    console.log(`✅ Created ${suppliers.length} suppliers`);

    // Create Inventory items
    console.log('📦 Creating inventory items...');
    const inventoryItems = [];

    const acmeInventory = [
      { sku: 'ASM-001', name: 'Steel Sheet 2mm', qty: 500, cost: 25.00, reorderPoint: 100 },
      { sku: 'ASM-002', name: 'Aluminum Rod 1in', qty: 300, cost: 18.50, reorderPoint: 75 },
      { sku: 'ASM-003', name: 'Copper Wire 5mm', qty: 800, cost: 12.00, reorderPoint: 200 },
      { sku: 'ASM-004', name: 'Plastic Pellets', qty: 2000, cost: 3.50, reorderPoint: 500 },
      { sku: 'ASM-005', name: 'Steel Sheet 5mm', qty: 200, cost: 45.00, reorderPoint: 50 },
      { sku: 'ASM-006', name: 'Electrical Motor', qty: 50, cost: 150.00, reorderPoint: 20 },
      { sku: 'ASM-007', name: 'Control Panel', qty: 30, cost: 350.00, reorderPoint: 10 },
      { sku: 'ASM-008', name: 'Hydraulic Pump', qty: 40, cost: 280.00, reorderPoint: 15 },
      { sku: 'ASM-009', name: 'Bearing Set', qty: 150, cost: 45.00, reorderPoint: 40 },
      { sku: 'ASM-010', name: 'Fastener Kit', qty: 600, cost: 8.00, reorderPoint: 150 },
      { sku: 'ASM-011', name: 'Rivets 10mm', qty: 1200, cost: 0.50, reorderPoint: 300 },
      { sku: 'ASM-012', name: 'Welding Rod', qty: 400, cost: 15.00, reorderPoint: 100 }
    ];

    const techRetailInventory = [
      { sku: 'TRT-001', name: 'Smartphone X', qty: 150, cost: 200.00, reorderPoint: 50 },
      { sku: 'TRT-002', name: 'Laptop Pro', qty: 80, cost: 450.00, reorderPoint: 25 },
      { sku: 'TRT-003', name: 'Wireless Earbuds', qty: 300, cost: 35.00, reorderPoint: 100 },
      { sku: 'TRT-004', name: 'Smart Watch', qty: 120, cost: 120.00, reorderPoint: 40 },
      { sku: 'TRT-005', name: 'Tablet Air', qty: 60, cost: 320.00, reorderPoint: 20 },
      { sku: 'TRT-006', name: 'Power Bank', qty: 250, cost: 25.00, reorderPoint: 80 },
      { sku: 'TRT-007', name: 'USB-C Cable', qty: 500, cost: 8.00, reorderPoint: 150 },
      { sku: 'TRT-008', name: 'Wireless Charger', qty: 90, cost: 45.00, reorderPoint: 30 },
      { sku: 'TRT-009', name: 'Bluetooth Speaker', qty: 70, cost: 65.00, reorderPoint: 25 },
      { sku: 'TRT-010', name: 'Phone Case', qty: 400, cost: 12.00, reorderPoint: 120 }
    ];

    for (const item of acmeInventory) {
      const stockLevel = item.qty <= item.reorderPoint ? 'LOW' : 'HEALTHY';
      inventoryItems.push(
        prisma.inventory.create({
          data: {
            companyId: acmeCompany.id,
            locationId: locations[0].id,
            sku: item.sku,
            productName: item.name,
            quantityOnHand: item.qty,
            quantityReserved: Math.floor(item.qty * 0.1),
            reorderPoint: item.reorderPoint,
            reorderQty: item.reorderPoint * 2,
            lastCountDate: new Date(),
            unitCost: item.cost,
            stockLevel,
            turnoverRate: 4 + Math.random() * 4
          }
        })
      );
    }

    for (const item of techRetailInventory) {
      const stockLevel = item.qty <= item.reorderPoint ? 'LOW' : 'HEALTHY';
      inventoryItems.push(
        prisma.inventory.create({
          data: {
            companyId: techRetailCompany.id,
            locationId: locations[2].id,
            sku: item.sku,
            productName: item.name,
            quantityOnHand: item.qty,
            quantityReserved: Math.floor(item.qty * 0.15),
            reorderPoint: item.reorderPoint,
            reorderQty: item.reorderPoint * 2,
            lastCountDate: new Date(),
            unitCost: item.cost,
            stockLevel,
            turnoverRate: 6 + Math.random() * 4
          }
        })
      );
    }

    const createdInventory = await Promise.all(inventoryItems);
    console.log(`✅ Created ${createdInventory.length} inventory items`);

    // Create Purchase Orders
    console.log('📋 Creating purchase orders...');
    const purchaseOrders = [];

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);

    for (let i = 0; i < 5; i++) {
      const poDate = new Date(today);
      poDate.setDate(poDate.getDate() - i * 3);
      const dueDate = new Date(poDate);
      dueDate.setDate(dueDate.getDate() + 7);

      const supplier = suppliers[i % suppliers.length];
      const inventoryItem = createdInventory[i];

      if (!supplier || !inventoryItem) {
        throw new Error('Missing supplier or inventory item for PO creation');
      }

      purchaseOrders.push(
        prisma.purchaseOrder.create({
          data: {
            companyId: acmeCompany.id,
            supplierId: supplier.id,
            poNumber: `PO-2025-${String(i + 1).padStart(4, '0')}`,
            poDate,
            dueDate,
            status: ['DRAFT', 'SENT', 'CONFIRMED', 'IN_TRANSIT', 'RECEIVED'][i % 5] as any,
            totalAmount: 5000 + Math.random() * 10000,
            items: {
              create: [
                {
                  sku: inventoryItem.sku,
                  productName: inventoryItem.productName,
                  quantity: 50 + Math.floor(Math.random() * 100),
                  unitPrice: inventoryItem.unitCost * 0.9,
                  totalPrice: 0 // Will be calculated
                }
              ]
            }
          }
        })
      );
    }

    const createdPOs = await Promise.all(purchaseOrders);
    console.log(`✅ Created ${createdPOs.length} purchase orders`);

    // Create Shipments
    console.log('🚚 Creating shipments...');
    const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];

    const shipments = [];
    for (let i = 0; i < 8; i++) {
      const eta = new Date(today);
      eta.setDate(eta.getDate() + 2 + i);
      const actualDelivery = i > 5 ? new Date(eta) : null;

      const po = createdPOs[i % createdPOs.length];
      const fromLocation = locations[i % locations.length];
      const toLocation = locations[(i + 1) % locations.length];
      const carrier = carriers[i % carriers.length] || 'FedEx';

      // Determine status based on index
      let status: string;
      if (i < 3) {
        status = 'IN_TRANSIT';
      } else if (i === 3) {
        status = 'DELAYED';
      } else if (i === 4) {
        status = 'IN_TRANSIT';
      } else {
        status = 'DELIVERED';
      }

      if (!po || !fromLocation || !toLocation) {
        throw new Error('Missing PO or location for shipment creation');
      }

      shipments.push(
        prisma.shipment.create({
          data: {
            companyId: i < 5 ? acmeCompany.id : techRetailCompany.id,
            purchaseOrderId: po.id,
            fromLocationId: fromLocation.id,
            toLocationId: toLocation.id,
            trackingNumber: `TRK-2025-${String(i + 1).padStart(6, '0')}`,
            carrier: carrier,
            status: status,
            estimatedDelivery: eta,
            actualDelivery,
            daysLate: i === 3 ? 2 : 0,
            trackingUrl: `https://track.${carrier.toLowerCase()}.com/${i}`,
            severity: i === 3 ? 4 : 0
          }
        })
      );
    }

    const createdShipments = await Promise.all(shipments);
    console.log(`✅ Created ${createdShipments.length} shipments`);

    // Create Demand Forecasts (12 months)
    console.log('📊 Creating demand forecasts...');
    const forecasts = [];

    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const period = new Date(today);
      period.setMonth(period.getMonth() + monthOffset);
      const periodStr = period.toISOString().slice(0, 7); // YYYY-MM

      const baseDemand = 1000 + Math.random() * 500;
      const confidence = 0.75 + Math.random() * 0.15;

      forecasts.push(
        prisma.demandForecast.create({
          data: {
            companyId: acmeCompany.id,
            period: periodStr,
            forecastQty: Math.floor(baseDemand),
            confidenceLevel: confidence,
            bestCase: Math.floor(baseDemand * (1 + confidence)),
            worstCase: Math.floor(baseDemand * (1 - confidence)),
            scenario: 'EXPECTED'
          }
        })
      );

      forecasts.push(
        prisma.demandForecast.create({
          data: {
            companyId: acmeCompany.id,
            period: periodStr,
            forecastQty: Math.floor(baseDemand * 1.2),
            confidenceLevel: 0.6,
            bestCase: Math.floor(baseDemand * 1.4),
            worstCase: Math.floor(baseDemand * 1.1),
            scenario: 'BEST_CASE'
          }
        })
      );
    }

    const createdForecasts = await Promise.all(forecasts);
    console.log(`✅ Created ${createdForecasts.length} demand forecasts`);

    // Create Issues/Alerts
    console.log('⚠️ Creating issues...');
    const issues = await Promise.all([
      prisma.issue.create({
        data: {
          companyId: acmeCompany.id,
          type: 'STOCKOUT',
          severity: 5,
          title: 'Critical: Steel Sheet 5mm at stockout risk',
          description: 'Only 200 units remaining. Reorder point is 50 units. Immediate action required to prevent production stoppage.',
          status: 'OPEN',
          metadata: JSON.stringify({ sku: 'ASM-005', currentQty: 200, reorderPoint: 50 })
        }
      }),
      prisma.issue.create({
        data: {
          companyId: acmeCompany.id,
          type: 'DELAY',
          severity: 3,
          title: 'Shipment TRK-2025-000004 delayed 2 days',
          description: 'TRK-2025-000004 is 2 days late. ETA now Jan 15. Consider contacting customer to assess impact.',
          status: 'OPEN',
          metadata: JSON.stringify({ trackingNumber: 'TRK-2025-000004', daysLate: 2 })
        }
      }),
      prisma.issue.create({
        data: {
          companyId: techRetailCompany.id,
          type: 'FORECAST_MISS',
          severity: 2,
          title: 'December forecast accuracy at 82%',
          description: 'December actual demand exceeded forecast by 18%. Review forecasting model and adjust safety stock levels.',
          status: 'ACKNOWLEDGED',
          acknowledgedAt: new Date(),
          metadata: JSON.stringify({ period: '2024-12', accuracy: 82 })
        }
      }),
      prisma.issue.create({
        data: {
          companyId: acmeCompany.id,
          type: 'QUALITY',
          severity: 3,
          title: 'Supplier ElectroParts Ltd quality concerns',
          description: 'Recent shipments from ElectroParts Ltd showing 85% quality rate vs. target of 95%. Consider quality review.',
          status: 'OPEN',
          metadata: JSON.stringify({ supplierId: suppliers[1].id, qualityRate: 85 })
        }
      })
    ]);

    console.log(`✅ Created ${issues.length} issues`);

    // Create KPIs
    console.log('📈 Creating KPIs...');
    const currentPeriod = today.toISOString().slice(0, 7);
    const kpis = await Promise.all([
      // Acme KPIs
      prisma.kPI.create({
        data: {
          companyId: acmeCompany.id,
          name: 'OTIF',
          value: 92.5,
          trend: 2.3,
          target: 95,
          status: 'ON_TRACK',
          period: currentPeriod
        }
      }),
      prisma.kPI.create({
        data: {
          companyId: acmeCompany.id,
          name: 'DIO',
          value: 45,
          trend: -5.2,
          target: 40,
          status: 'AT_RISK',
          period: currentPeriod
        }
      }),
      prisma.kPI.create({
        data: {
          companyId: acmeCompany.id,
          name: 'FILL_RATE',
          value: 96.8,
          trend: 1.1,
          target: 98,
          status: 'ON_TRACK',
          period: currentPeriod
        }
      }),
      prisma.kPI.create({
        data: {
          companyId: acmeCompany.id,
          name: 'TURNOVER',
          value: 5.2,
          trend: 0.3,
          target: 6,
          status: 'ON_TRACK',
          period: currentPeriod
        }
      }),
      prisma.kPI.create({
        data: {
          companyId: acmeCompany.id,
          name: 'LEAD_TIME',
          value: 8.5,
          trend: 10,
          target: 7,
          status: 'AT_RISK',
          period: currentPeriod
        }
      }),
      prisma.kPI.create({
        data: {
          companyId: acmeCompany.id,
          name: 'COST_PER_UNIT',
          value: 42.50,
          trend: -2.5,
          target: 40,
          status: 'EXCELLENT',
          period: currentPeriod
        }
      }),
      // TechRetail KPIs
      prisma.kPI.create({
        data: {
          companyId: techRetailCompany.id,
          name: 'OTIF',
          value: 94.2,
          trend: 1.8,
          target: 95,
          status: 'EXCELLENT',
          period: currentPeriod
        }
      }),
      prisma.kPI.create({
        data: {
          companyId: techRetailCompany.id,
          name: 'DIO',
          value: 38,
          trend: -3.2,
          target: 35,
          status: 'ON_TRACK',
          period: currentPeriod
        }
      })
    ]);

    console.log(`✅ Created ${kpis.length} KPIs`);

    // Create Inventory Movements
    console.log('📝 Creating inventory movements...');
    const movements = [];

    for (let i = 0; i < 20; i++) {
      const movementDate = new Date(today);
      movementDate.setDate(movementDate.getDate() - i);

      const inventoryItem = createdInventory[i % createdInventory.length];
      const location = locations[i % locations.length];

      // Determine movement type
      let movementType: string;
      const modVal = i % 4;
      if (modVal === 0) {
        movementType = 'INBOUND';
      } else if (modVal === 1) {
        movementType = 'OUTBOUND';
      } else if (modVal === 2) {
        movementType = 'TRANSFER';
      } else {
        movementType = 'ADJUSTMENT';
      }

      if (!inventoryItem || !location) {
        throw new Error('Missing inventory item or location for movement creation');
      }

      movements.push(
        prisma.inventoryMovement.create({
          data: {
            companyId: acmeCompany.id,
            inventoryId: inventoryItem.id,
            type: movementType,
            quantity: 10 + Math.floor(Math.random() * 100),
            locationId: location.id,
            reference: `PO-2025-${String(Math.floor(i / 2) + 1).padStart(4, '0')}`,
            notes: modVal === 3 ? 'Cycle count adjustment' : null,
            createdAt: movementDate
          }
        })
      );
    }

    const createdMovements = await Promise.all(movements);
    console.log(`✅ Created ${createdMovements.length} inventory movements`);

    // Summary
    console.log('\n📊 Supply chain seeding completed successfully!');
    console.log(`📍 Locations: ${locations.length}`);
    console.log(`🏭 Suppliers: ${suppliers.length}`);
    console.log(`📦 Inventory: ${createdInventory.length} items`);
    console.log(`📋 Purchase Orders: ${createdPOs.length}`);
    console.log(`🚚 Shipments: ${createdShipments.length}`);
    console.log(`📊 Demand Forecasts: ${createdForecasts.length}`);
    console.log(`⚠️ Issues: ${issues.length}`);
    console.log(`📈 KPIs: ${kpis.length}`);
    console.log(`📝 Movements: ${createdMovements.length}`);

  } catch (error) {
    console.error('❌ Error during supply chain seeding:', error);
    throw error;
  }
};

export { seedSupplyChainData };

// Run seeding if this file is executed directly
if (require.main === module) {
  seedSupplyChainData()
    .then(() => {
      console.log('🎉 Supply chain seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

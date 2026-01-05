import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Realistic data sets
const COMPANIES = [
  {
    name: 'TechFlow Manufacturing',
    industry: 'Technology',
    employees: 250,
    subscriptionStatus: 'trial',
    subscriptionTier: 'starter',
    admin: {
      email: 'admin@techflow.com',
      name: 'Alex Chen',
      password: 'SecurePass123!'
    }
  },
  {
    name: 'Global Parts Corp',
    industry: 'Manufacturing', 
    employees: 500,
    subscriptionStatus: 'active',
    subscriptionTier: 'professional',
    admin: {
      email: 'admin@globalparts.com',
      name: 'Maria Rodriguez',
      password: 'SecurePass123!'
    }
  },
  {
    name: 'SupplyChain Solutions',
    industry: 'Logistics',
    employees: 100,
    subscriptionStatus: 'trial',
    subscriptionTier: 'starter',
    admin: {
      email: 'admin@supplychainsol.com',
      name: 'David Kim',
      password: 'SecurePass123!'
    }
  }
];

const LOCATIONS = [
  { name: 'Main Warehouse Chicago', type: 'WAREHOUSE', address: '123 Industrial Pkwy', city: 'Chicago', state: 'IL', capacity: 10000 },
  { name: 'Distribution Center East', type: 'DISTRIBUTION_CENTER', address: '456 Commerce Dr', city: 'New York', state: 'NY', capacity: 5000 },
  { name: 'West Coast Hub', type: 'WAREHOUSE', address: '789 Port Ave', city: 'Los Angeles', state: 'CA', capacity: 8000 },
  { name: 'Retail Store Downtown', type: 'RETAIL', address: '321 Main St', city: 'Seattle', state: 'WA', capacity: 500 },
  { name: 'Manufacturing Plant', type: 'MANUFACTURING', address: '654 Factory Rd', city: 'Detroit', state: 'MI', capacity: 15000 },
];

const SUPPLIERS = [
  {
    name: 'Global Electronics Inc',
    contactName: 'John Smith',
    contactEmail: 'john.smith@globalelectronics.com',
    contactPhone: '+1-555-0101',
    address: '100 Tech Drive, San Jose, CA 95134',
    onTimeRate: 96,
    qualityRate: 98,
    leadTime: 7,
    performanceScore: 95,
    paymentTerms: 'Net 30',
    industry: 'Electronics'
  },
  {
    name: 'Pacific Manufacturing Co',
    contactName: 'Sarah Johnson',
    contactEmail: 'sarah.johnson@pacificmfg.com',
    contactPhone: '+1-555-0102', 
    address: '200 Factory Rd, Seattle, WA 98101',
    onTimeRate: 92,
    qualityRate: 95,
    leadTime: 10,
    performanceScore: 88,
    paymentTerms: 'Net 45',
    industry: 'Manufacturing'
  },
  {
    name: 'Quality Parts Ltd',
    contactName: 'Mike Davis',
    contactEmail: 'mike.davis@qualityparts.com',
    contactPhone: '+1-555-0103',
    address: '300 Industrial Blvd, Detroit, MI 48201',
    onTimeRate: 88,
    qualityRate: 92,
    leadTime: 14,
    performanceScore: 82,
    paymentTerms: 'Net 60',
    industry: 'Automotive'
  },
  {
    name: 'Precision Components LLC',
    contactName: 'Lisa Wang',
    contactEmail: 'lisa.wang@precision.com',
    contactPhone: '+1-555-0104',
    address: '400 Precision Way, Austin, TX 78701',
    onTimeRate: 94,
    qualityRate: 97,
    leadTime: 12,
    performanceScore: 91,
    paymentTerms: 'Net 30',
    industry: 'Aerospace'
  },
  {
    name: 'Industrial Supplies Plus',
    contactName: 'Robert Brown',
    contactEmail: 'robert.brown@industrialsupplies.com',
    contactPhone: '+1-555-0105',
    address: '500 Supply St, Houston, TX 77001',
    onTimeRate: 89,
    qualityRate: 90,
    leadTime: 8,
    performanceScore: 85,
    paymentTerms: 'Net 45',
    industry: 'Industrial'
  }
];

const PRODUCT_CATEGORIES = [
  { prefix: 'ELEC', name: 'Electronic Components', baseCost: 45.50, avgDemand: 1200 },
  { prefix: 'MECH', name: 'Mechanical Parts', baseCost: 28.75, avgDemand: 800 },
  { prefix: 'CHEM', name: 'Chemical Supplies', baseCost: 67.20, avgDemand: 600 },
  { prefix: 'TOOL', name: 'Tools & Equipment', baseCost: 156.80, avgDemand: 300 },
  { prefix: 'PACK', name: 'Packaging Materials', baseCost: 12.30, avgDemand: 2000 },
];

async function generateInventoryItems(companyId: string, locations: any[], suppliers: any[]) {
  const inventoryItems = [];
  const usedSkus = new Set<string>();
  
  // Generate 75 unique inventory items
  for (let i = 0; i < 75; i++) {
    const categoryIndex = i % PRODUCT_CATEGORIES.length;
    const category = PRODUCT_CATEGORIES[categoryIndex]!;
    const locationIndex = i % locations.length;
    const supplierIndex = i % suppliers.length;
    const location = locations[locationIndex]!;
    const supplier = suppliers[supplierIndex]!;
    
    // Generate unique SKU
    let sku;
    let attempts = 0;
    do {
      sku = `${category.prefix}-${String(i + 1).padStart(4, '0')}`;
      attempts++;
      if (attempts > 10) {
        sku = `${category.prefix}-${Date.now()}-${i}`;
        break;
      }
    } while (usedSkus.has(sku));
    usedSkus.add(sku);
    
    const baseQuantity = category.avgDemand;
    const quantity = Math.floor(Math.random() * baseQuantity * 2) + Math.floor(baseQuantity * 0.1);
    const reorderPoint = Math.floor(quantity * 0.3);
    const safetyStock = Math.floor(quantity * 0.2);
    
    // Determine stock level
    let stockLevel = 'HEALTHY';
    if (quantity === 0) {
      stockLevel = 'OUT_OF_STOCK';
    } else if (quantity <= reorderPoint) {
      stockLevel = 'LOW';
    }
    
    const unitCost = parseFloat((category.baseCost + (Math.random() - 0.5) * category.baseCost * 0.3).toFixed(2));
    const turnoverRate = parseFloat((Math.random() * 8 + 2).toFixed(1));
    
    inventoryItems.push({
      companyId,
      locationId: location.id,
      supplierId: supplier.id,
      sku,
      name: `${category.name} ${String(i + 1).padStart(3, '0')}`,
      description: `High-quality ${category.name.toLowerCase()} for industrial applications`,
      quantity,
      quantityReserved: Math.floor(Math.random() * Math.min(quantity, 50)),
      unitCost,
      stockLevel,
      turnoverRate,
      reorderPoint,
      reorderQty: Math.floor(reorderPoint * 1.5),
      safetyStock,
      lastRestocked: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
    });
  }
  
  return inventoryItems;
}

async function generatePurchaseOrders(companyId: string, suppliers: any[], inventoryItems: any[]) {
  const purchaseOrders = [];
  const statuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'CONFIRMED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'];
  const statusWeights = [0.1, 0.15, 0.15, 0.15, 0.2, 0.2, 0.05]; // More recent orders
  
  for (let i = 0; i < 25; i++) {
    const supplier = suppliers[i % suppliers.length];
    const status = getWeightedRandomStatus(statuses, statusWeights);
    const createdDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const expectedDelivery = new Date(createdDate.getTime() + (supplier.leadTime + Math.random() * 7) * 24 * 60 * 60 * 1000);
    
    // Generate line items for this PO
    const lineItemCount = Math.floor(Math.random() * 5) + 1;
    const lineItems = [];
    let totalAmount = 0;
    
    for (let j = 0; j < lineItemCount; j++) {
      const inventoryItem = inventoryItems[(i * lineItemCount + j) % inventoryItems.length];
      const quantity = Math.floor(Math.random() * 500) + 50;
      const unitPrice = inventoryItem.unitCost * (0.9 + Math.random() * 0.2); // ±10% variance
      lineItems.push({
        sku: inventoryItem.sku,
        productName: inventoryItem.name,
        quantity,
        unitPrice: parseFloat(unitPrice.toFixed(2)),
        totalPrice: parseFloat((quantity * unitPrice).toFixed(2))
      });
      totalAmount += quantity * unitPrice;
    }
    
    const isReceived = status === 'RECEIVED';
    const isCancelled = status === 'CANCELLED';
    
    purchaseOrders.push({
      companyId,
      supplierId: supplier.id,
      poNumber: `PO-${String(i + 1).padStart(6, '0')}`,
      status,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      dueDate: expectedDelivery,
      receivedDate: isReceived ? new Date(expectedDelivery.getTime() + (Math.random() - 0.5) * 5 * 24 * 60 * 60 * 1000) : null,
      notes: `Purchase order for ${supplier.name} - ${lineItems.length} items`,
      lineItems: {
        create: lineItems
      }
    });
  }
  
  return purchaseOrders;
}

function getWeightedRandomStatus(statuses: string[], weights: number[]): string {
  const random = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < statuses.length; i++) {
    const weight = weights[i] || 0;
    cumulative += weight;
    if (random <= cumulative) {
      return statuses[i]!;
    }
  }
  
  return statuses[statuses.length - 1] || 'PENDING';
}

async function generateShipments(companyId: string, purchaseOrders: any[]) {
  const shipments = [];
  const carriers = ['FedEx', 'UPS', 'DHL', 'USPS', 'Local Courier'];
  const statuses = ['CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'];
  const statusWeights = [0.05, 0.1, 0.3, 0.2, 0.3, 0.05];
  
  for (let i = 0; i < 30; i++) {
    const po = purchaseOrders[i % purchaseOrders.length];
    const status = getWeightedRandomStatus(statuses, statusWeights);
    const createdDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000);
    const estimatedDelivery = new Date(createdDate.getTime() + (3 + Math.random() * 7) * 24 * 60 * 60 * 1000);
    
    const isDelayed = Math.random() > 0.85;
    const daysLate = isDelayed ? Math.floor(Math.random() * 5 + 1) : 0;
    const actualDelivery = status === 'DELIVERED' 
      ? new Date(estimatedDelivery.getTime() + daysLate * 24 * 60 * 60 * 1000)
      : null;
    
    shipments.push({
      companyId,
      purchaseOrderId: po.id,
      trackingNumber: `TRK${Date.now()}${String(i + 1).padStart(4, '0')}`,
      carrier: carriers[i % carriers.length] || 'FedEx',
      status: isDelayed ? 'DELAYED' : status,
      fromLocation: 'Main Warehouse Chicago',
      toLocation: 'Distribution Center East',
      eta: estimatedDelivery,
      actualDelivery: actualDelivery,
      daysLate: isDelayed ? daysLate : 0,
      totalValue: po.totalAmount,
      weight: parseFloat((Math.random() * 100 + 10).toFixed(2)),
      items: `${Math.floor(Math.random() * 50 + 10)}x${Math.floor(Math.random() * 30 + 10)}x${Math.floor(Math.random() * 20 + 5)} cm`,
    });
  }
  
  return shipments;
}

async function generateDemandForecasts(companyId: string, inventoryItems: any[]) {
  const forecasts = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Generate forecasts for next 12 months
  for (let i = 0; i < 12; i++) {
    const month = currentMonth + i;
    const year = currentYear + Math.floor((month - 1) / 12);
    const adjustedMonth = ((month - 1) % 12) + 1;
    
    // Select random inventory items for forecasting
    const forecastItems = inventoryItems.slice(i * 5, (i + 1) * 5);
    
    for (const item of forecastItems) {
      const baseDemand = item.turnoverRate * item.quantity / 12; // Monthly demand based on turnover
      const seasonalFactor = 0.8 + Math.random() * 0.4; // ±20% seasonal variation
      const trendFactor = 0.95 + Math.random() * 0.1; // ±5% trend variation
      const predictedDemand = Math.floor(baseDemand * seasonalFactor * trendFactor);
      const confidence = parseFloat((0.7 + Math.random() * 0.25).toFixed(2)); // 70-95% confidence
      
      forecasts.push({
        companyId,
        week: Math.ceil(adjustedMonth * 4.33),
        year,
        demand: predictedDemand,
        supply: Math.floor(predictedDemand * (0.95 + Math.random() * 0.1)),
        gap: Math.floor(predictedDemand * (Math.random() * 0.2 - 0.1)),
        riskLevel: Math.random() > 0.7 ? 'RISK' : Math.random() > 0.4 ? 'CAUTION' : 'SAFE',
      });
    }
  }
  
  return forecasts;
}

async function generateKPIs(companyId: string) {
  const kpis = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const period = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  
  const kpiData = [
    { name: 'OTIF', value: 94.5, trend: 2.1, target: 95.0, status: 'ON_TRACK', description: 'On-Time In-Full Delivery Rate' },
    { name: 'DIO', value: 42, trend: -3.8, target: 45, status: 'EXCELLENT', description: 'Days Inventory Outstanding' },
    { name: 'FILL_RATE', value: 97.8, trend: 1.5, target: 98.0, status: 'ON_TRACK', description: 'Order Fill Rate' },
    { name: 'INVENTORY_TURNOVER', value: 6.8, trend: 0.8, target: 6.0, status: 'EXCELLENT', description: 'Annual Inventory Turnover' },
    { name: 'SUPPLIER_QUALITY', value: 92.3, trend: -0.5, target: 95.0, status: 'AT_RISK', description: 'Supplier Quality Score' },
    { name: 'LEAD_TIME_VARIANCE', value: 12.5, trend: -2.3, target: 15.0, status: 'EXCELLENT', description: 'Lead Time Variance %' },
    { name: 'COST_VARIANCE', value: 3.2, trend: 0.8, target: 5.0, status: 'EXCELLENT', description: 'Cost Variance from Budget %' },
    { name: 'STOCKOUT_RATE', value: 2.1, trend: -0.6, target: 2.5, status: 'EXCELLENT', description: 'Stockout Rate %' },
  ];
  
  for (const kpi of kpiData) {
    kpis.push({
      companyId,
      name: kpi.name,
      value: kpi.value,
      trend: kpi.trend,
      target: kpi.target,
      status: kpi.status,
      period,
      description: kpi.description
    });
  }
  
  return kpis;
}

async function main() {
  console.log('🚀 Starting enhanced production database seeding...');

  try {
    // Clean existing data (optional - remove in production)
    console.log('🧹 Cleaning existing data...');
    
    // Use individual deletions instead of deleteMany to avoid Prisma method naming issues
    const tables = [
      'kPI',
      'shipmentTimeline', 
      'shipment',
      'demandForecast',
      'pOLineItem',
      'purchaseOrder',
      'inventory',
      'supplier',
      'location',
      'user',
      'company'
    ];
    
    for (const table of tables) {
      try {
        // @ts-ignore - Prisma method name conversion
        await prisma[table].deleteMany({});
      } catch (error: any) {
        console.log(`Could not delete from ${table}: ${error?.message || 'Unknown error'}`);
      }
    }
    
    console.log('✅ Database cleaned');

    for (const companyData of COMPANIES) {
      console.log(`\n📊 Processing company: ${companyData.name}`);
      
      // Create company
      const company = await prisma.company.create({
        data: {
          name: companyData.name,
          industry: companyData.industry,
          employees: companyData.employees,
          subscriptionStatus: companyData.subscriptionStatus as any,
          subscriptionTier: companyData.subscriptionTier as any,
          trialStart: companyData.subscriptionStatus === 'trial' ? new Date() : null,
          trialEnd: companyData.subscriptionStatus === 'trial' 
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) 
            : null,
          stripeCustomerId: `cus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
      });

      console.log(`✅ Created company: ${company.name} (ID: ${company.id})`);

      // Create admin user
      const hashedPassword = await bcrypt.hash(companyData.admin.password, 12);
      const adminUser = await prisma.user.create({
        data: {
          email: companyData.admin.email,
          password: hashedPassword,
          name: companyData.admin.name,
          role: 'MANAGER',
          companyId: company.id,
        },
      });

      console.log(`✅ Created admin user: ${adminUser.email}`);

      // Create locations
      const locationPromises = LOCATIONS.map(locationData => 
        prisma.location.create({
          data: {
            companyId: company.id,
            name: locationData.name,
            type: locationData.type as any,
            address: locationData.address,
            city: locationData.city,
            state: locationData.state,
            country: 'USA',
            zipCode: String(10000 + Math.floor(Math.random() * 89999)),
            capacity: locationData.capacity,
          },
        })
      );
      
      const locations = await Promise.all(locationPromises);
      console.log(`✅ Created ${locations.length} locations`);

      // Create suppliers
      const supplierPromises = SUPPLIERS.map(supplierData => 
        prisma.supplier.create({
          data: {
            companyId: company.id,
            name: supplierData.name,
            contactName: supplierData.contactName,
            contactEmail: supplierData.contactEmail,
            contactPhone: supplierData.contactPhone,
            address: supplierData.address,
            onTimeRate: supplierData.onTimeRate,
            qualityRate: supplierData.qualityRate,
            leadTime: supplierData.leadTime,
            performanceScore: supplierData.performanceScore,
            paymentTerms: supplierData.paymentTerms,
            status: 'ACTIVE',
          },
        })
      );
      
      const suppliers = await Promise.all(supplierPromises);
      console.log(`✅ Created ${suppliers.length} suppliers`);

      // Generate and create inventory items
      console.log('📦 Generating inventory items...');
      const inventoryItems = await generateInventoryItems(company.id, locations, suppliers);
      const createdInventory = await prisma.inventory.createMany({
        data: inventoryItems,
      });
      console.log(`✅ Created ${createdInventory.count} inventory items`);

      // Retrieve created inventory items with IDs
      const fullInventoryItems = await prisma.inventory.findMany({
        where: { companyId: company.id },
      });

      // Generate and create purchase orders
      console.log('📋 Generating purchase orders...');
      const purchaseOrdersData = await generatePurchaseOrders(company.id, suppliers, fullInventoryItems);
      
      for (const poData of purchaseOrdersData) {
        await prisma.purchaseOrder.create({
          data: poData,
        });
      }
      console.log(`✅ Created ${purchaseOrdersData.length} purchase orders`);

      // Retrieve created POs
      const fullPurchaseOrders = await prisma.purchaseOrder.findMany({
        where: { companyId: company.id },
        include: { lineItems: true },
      });

      // Generate and create shipments
      console.log('🚚 Generating shipments...');
      const shipments = await generateShipments(company.id, fullPurchaseOrders);
      const createdShipments = await prisma.shipment.createMany({
        data: shipments,
      });
      console.log(`✅ Created ${createdShipments.count} shipments`);

      // Generate and create demand forecasts
      console.log('📈 Generating demand forecasts...');
      const demandForecasts = await generateDemandForecasts(company.id, fullInventoryItems);
      const createdForecasts = await prisma.demandForecast.createMany({
        data: demandForecasts,
      });
      console.log(`✅ Created ${createdForecasts.count} demand forecasts`);

      // Generate and create KPIs
      console.log('📊 Generating KPIs...');
      const kpis = await generateKPIs(company.id);
      const createdKpis = await prisma.kPI.createMany({
        data: kpis,
      });
      console.log(`✅ Created ${createdKpis.count} KPIs`);
    }

    console.log('\n🎉 Enhanced production database seeding completed successfully!');
    console.log('\n📝 Login credentials for test companies:');
    console.log('\n1. TechFlow Manufacturing (Trial):');
    console.log('   Email: admin@techflow.com');
    console.log('   Password: SecurePass123!');
    console.log('\n2. Global Parts Corp (Professional):');
    console.log('   Email: admin@globalparts.com');
    console.log('   Password: SecurePass123!');
    console.log('\n3. SupplyChain Solutions (Trial):');
    console.log('   Email: admin@supplychainsol.com');
    console.log('   Password: SecurePass123!');
    console.log('\n⚠️  Remember to change passwords after first login!');
    console.log('\n✨ Data includes: Companies, Users, Locations, Suppliers, Inventory, Purchase Orders, Shipments, Demand Forecasts, and KPIs');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Fatal error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

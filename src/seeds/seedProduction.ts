import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting production database seeding...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const company = await prisma.company.create({
    data: {
      name: 'Demo Supply Chain Co',
      industry: 'Manufacturing',
      employees: 250,
      subscriptionStatus: 'trial',
      subscriptionTier: 'starter',
      trialStart: new Date(),
      trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Created company: ${company.name}`);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'MANAGER',
      companyId: company.id,
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  const locations = await Promise.all([
    prisma.location.create({
      data: {
        companyId: company.id,
        name: 'Main Warehouse',
        type: 'WAREHOUSE',
        address: '123 Industrial Pkwy',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        zipCode: '60601',
        capacity: 10000,
      },
    }),
    prisma.location.create({
      data: {
        companyId: company.id,
        name: 'Distribution Center East',
        type: 'DISTRIBUTION_CENTER',
        address: '456 Commerce Dr',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        zipCode: '10001',
        capacity: 5000,
      },
    }),
    prisma.location.create({
      data: {
        companyId: company.id,
        name: 'Retail Store 1',
        type: 'RETAIL',
        address: '789 Main St',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        zipCode: '90001',
        capacity: 500,
      },
    }),
  ]);

  console.log(`✅ Created ${locations.length} locations`);

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        companyId: company.id,
        name: 'Global Electronics Inc',
        contactName: 'John Smith',
        contactEmail: 'john@globalelectronics.com',
        contactPhone: '+1-555-0101',
        address: '100 Tech Drive, San Jose, CA',
        onTimeRate: 96,
        qualityRate: 98,
        leadTime: 7,
        performanceScore: 95,
        paymentTerms: 'Net 30',
        status: 'ACTIVE',
      },
    }),
    prisma.supplier.create({
      data: {
        companyId: company.id,
        name: 'Pacific Manufacturing Co',
        contactName: 'Sarah Johnson',
        contactEmail: 'sarah@pacificmfg.com',
        contactPhone: '+1-555-0102',
        address: '200 Factory Rd, Seattle, WA',
        onTimeRate: 92,
        qualityRate: 95,
        leadTime: 10,
        performanceScore: 88,
        paymentTerms: 'Net 45',
        status: 'ACTIVE',
      },
    }),
    prisma.supplier.create({
      data: {
        companyId: company.id,
        name: 'Quality Parts Ltd',
        contactName: 'Mike Davis',
        contactEmail: 'mike@qualityparts.com',
        contactPhone: '+1-555-0103',
        address: '300 Industrial Blvd, Detroit, MI',
        onTimeRate: 88,
        qualityRate: 92,
        leadTime: 14,
        performanceScore: 82,
        paymentTerms: 'Net 60',
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log(`✅ Created ${suppliers.length} suppliers`);

  const skuNames = [
    'Widget A-100', 'Component B-200', 'Part C-300', 'Module D-400',
    'Assembly E-500', 'Unit F-600', 'Device G-700', 'Product H-800',
    'Item I-900', 'Element J-1000'
  ];

  const inventoryItems = [];
  for (let i = 0; i < 50; i++) {
    const location = locations[i % locations.length];
    const supplier = suppliers[i % suppliers.length];
    const quantity = Math.floor(Math.random() * 1000) + 100;
    const reorderPoint = Math.floor(quantity * 0.3);
    const reorderQty = Math.floor(quantity * 0.5);
    const safetyStock = Math.floor(quantity * 0.2);
    const stockLevel = quantity <= reorderPoint ? 'LOW' : quantity === 0 ? 'OUT_OF_STOCK' : 'HEALTHY';

    if (!location || !supplier) {
      continue;
    }

    inventoryItems.push(
      prisma.inventory.create({
        data: {
          companyId: company.id,
          locationId: location.id,
          supplierId: supplier.id,
          sku: `SKU-${String(i + 1).padStart(5, '0')}`,
          name: skuNames[i % skuNames.length] || `Product ${i + 1}`,
          quantity,
          quantityReserved: Math.floor(Math.random() * 50),
          unitCost: parseFloat((Math.random() * 100 + 10).toFixed(2)),
          stockLevel,
          turnoverRate: parseFloat((Math.random() * 10 + 1).toFixed(2)),
          reorderPoint,
          reorderQty,
          safetyStock,
        },
      })
    );
  }

  await Promise.all(inventoryItems);
  console.log(`✅ Created ${inventoryItems.length} inventory items`);

  const pos = [];
  for (let i = 0; i < 10; i++) {
    const supplier = suppliers[i % suppliers.length];
    const status = ['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_TRANSIT', 'RECEIVED'][i % 5];
    const dueDate = new Date(Date.now() + (Math.random() * 30 + 7) * 24 * 60 * 60 * 1000);

    if (!supplier) {
      continue;
    }

    pos.push(
      prisma.purchaseOrder.create({
        data: {
          companyId: company.id,
          supplierId: supplier.id,
          poNumber: `PO-${String(i + 1).padStart(6, '0')}`,
          status: status || 'DRAFT',
          totalAmount: parseFloat((Math.random() * 50000 + 10000).toFixed(2)),
          dueDate,
          notes: `Purchase order for ${supplier.name}`,
          receivedDate: status === 'RECEIVED' ? new Date() : null,
        },
      })
    );
  }

  await Promise.all(pos);
  console.log(`✅ Created ${pos.length} purchase orders`);

  const shipments = [];
  const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];
  const statuses = ['PENDING', 'PICKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'];

  for (let i = 0; i < 20; i++) {
    const status = statuses[i % statuses.length];
    const eta = new Date(Date.now() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000);
    const isDelayed = Math.random() > 0.8;
    const daysLate = isDelayed ? Math.floor(Math.random() * 5 + 1) : 0;

    shipments.push(
      prisma.shipment.create({
        data: {
          companyId: company.id,
          trackingNumber: `TRK-${String(i + 1).padStart(10, '0')}`,
          carrier: carriers[i % carriers.length] || 'FedEx',
          status: (isDelayed ? 'DELAYED' : status) || 'PENDING',
          fromLocation: locations[0].name,
          toLocation: locations[1].name,
          eta: isDelayed ? new Date(eta.getTime() - daysLate * 24 * 60 * 60 * 1000) : eta,
          actualDelivery: status === 'DELIVERED' ? new Date() : null,
          daysLate,
          orderReference: `ORD-${String(i + 1).padStart(6, '0')}`,
          totalValue: parseFloat((Math.random() * 10000 + 1000).toFixed(2)),
          items: JSON.stringify([
            { sku: `SKU-${String(i + 1).padStart(5, '0')}`, name: skuNames[i % skuNames.length], quantity: Math.floor(Math.random() * 100 + 10) }
          ]),
        },
      })
    );
  }

  await Promise.all(shipments);
  console.log(`✅ Created ${shipments.length} shipments`);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const forecasts = [];
  for (let i = 0; i < 12; i++) {
    const month = currentMonth + i;
    const year = currentYear + Math.floor((month - 1) / 12);
    const adjustedMonth = ((month - 1) % 12) + 1;
    const demand = Math.floor(Math.random() * 5000 + 10000);
    const supply = Math.floor(demand * (0.95 + Math.random() * 0.1));
    const gap = demand - supply;

    forecasts.push(
      prisma.demandForecast.create({
        data: {
          companyId: company.id,
          week: Math.ceil(adjustedMonth * 4.33),
          year,
          demand,
          supply,
          gap,
          riskLevel: gap > 1000 ? 'RISK' : gap > 0 ? 'CAUTION' : 'SAFE',
        },
      })
    );
  }

  await Promise.all(forecasts);
  console.log(`✅ Created ${forecasts.length} demand forecasts`);

  const kpis = [
    { name: 'OTIF', value: 95, trend: 2.5, target: 95, status: 'ON_TRACK' },
    { name: 'DIO', value: 45, trend: -3.2, target: 50, status: 'EXCELLENT' },
    { name: 'FILL_RATE', value: 98, trend: 1.8, target: 98, status: 'ON_TRACK' },
    { name: 'TURNOVER', value: 6.2, trend: 5.5, target: 5.0, status: 'EXCELLENT' },
  ];

  const period = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  for (const kpiData of kpis) {
    await prisma.kPI.create({
      data: {
        companyId: company.id,
        ...kpiData,
        period,
      },
    });
  }

  console.log(`✅ Created ${kpis.length} KPIs`);

  console.log('\n🎉 Production database seeding completed successfully!');
  console.log('\nLogin credentials:');
  console.log(`Email: ${adminUser.email}`);
  console.log(`Password: admin123`);
  console.log('\n⚠️  Remember to change the password after first login!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

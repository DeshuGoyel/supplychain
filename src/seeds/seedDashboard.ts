import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed dashboard data for development and testing
 * Creates realistic demo data for inventory, orders, suppliers, demand forecasts, and KPIs
 */
const seedDashboardData = async () => {
  try {
    console.log('🌱 Starting dashboard data seeding...');

    // Get all companies
    const companies = await prisma.company.findMany();

    if (companies.length === 0) {
      console.log('⚠️  No companies found. Please run the main seed script first.');
      return;
    }

    console.log(`📊 Found ${companies.length} companies to seed dashboard data for`);

    for (const company of companies) {
      console.log(`\n🏢 Seeding dashboard data for: ${company.name}`);

      // Create Suppliers
      console.log('  📦 Creating suppliers...');
      const suppliersData = [
        {
          companyId: company.id,
          name: 'Acme Corp',
          onTimeRate: 98.5,
          qualityRate: 99.2,
          leadTime: 7.0,
          status: 'ACTIVE',
          issues: null,
        },
        {
          companyId: company.id,
          name: 'Tech Supplies Ltd',
          onTimeRate: 95.0,
          qualityRate: 94.5,
          leadTime: 9.0,
          status: 'ACTIVE',
          issues: null,
        },
        {
          companyId: company.id,
          name: 'Global Parts Inc',
          onTimeRate: 96.5,
          qualityRate: 97.0,
          leadTime: 8.0,
          status: 'ACTIVE',
          issues: null,
        },
        {
          companyId: company.id,
          name: 'Prime Materials',
          onTimeRate: 97.0,
          qualityRate: 98.5,
          leadTime: 6.0,
          status: 'ACTIVE',
          issues: null,
        },
        {
          companyId: company.id,
          name: 'Slow Shipper Inc',
          onTimeRate: 78.0,
          qualityRate: 85.0,
          leadTime: 14.0,
          status: 'ACTIVE',
          issues: JSON.stringify(['Low on-time rate', 'High lead time']),
        },
        {
          companyId: company.id,
          name: 'Budget Supplies Ltd',
          onTimeRate: 82.0,
          qualityRate: 88.0,
          leadTime: 12.0,
          status: 'ACTIVE',
          issues: JSON.stringify(['Quality below threshold']),
        },
      ];

      const createdSuppliers = [];
      for (const supplierData of suppliersData) {
        const supplier = await prisma.supplier.create({
          data: supplierData,
        });
        createdSuppliers.push(supplier);
      }
      console.log(`    ✅ Created ${createdSuppliers.length} suppliers`);

      // Create Inventory
      console.log('  📦 Creating inventory items...');
      const inventoryData = [];

      // Create fast movers (high turnover)
      for (let i = 1; i <= 20; i++) {
        inventoryData.push({
          companyId: company.id,
          sku: `SKU-${String(i).padStart(3, '0')}`,
          name: `Fast Mover Product ${i}`,
          quantity: Math.floor(Math.random() * 500) + 200,
          unitCost: Math.floor(Math.random() * 100) + 20,
          stockLevel: i % 5 === 0 ? 'LOW' : 'HEALTHY',
          turnoverRate: parseFloat((Math.random() * 5 + 5).toFixed(2)), // 5-10
        });
      }

      // Create slow movers (low turnover)
      for (let i = 1; i <= 15; i++) {
        inventoryData.push({
          companyId: company.id,
          sku: `SKU-${String(1000 - i).padStart(3, '0')}`,
          name: `Slow Mover Product ${i}`,
          quantity: Math.floor(Math.random() * 50) + 5,
          unitCost: Math.floor(Math.random() * 200) + 50,
          stockLevel: i % 3 === 0 ? 'LOW' : 'HEALTHY',
          turnoverRate: parseFloat((Math.random() * 2).toFixed(2)), // 0-2
        });
      }

      // Create out of stock items
      for (let i = 1; i <= 3; i++) {
        inventoryData.push({
          companyId: company.id,
          sku: `SKU-OOS-${i}`,
          name: `Out of Stock Product ${i}`,
          quantity: 0,
          unitCost: Math.floor(Math.random() * 150) + 30,
          stockLevel: 'OUT_OF_STOCK',
          turnoverRate: parseFloat((Math.random() * 8 + 2).toFixed(2)),
        });
      }

      // Create regular items
      for (let i = 21; i <= 50; i++) {
        inventoryData.push({
          companyId: company.id,
          sku: `SKU-${String(i).padStart(3, '0')}`,
          name: `Regular Product ${i}`,
          quantity: Math.floor(Math.random() * 200) + 50,
          unitCost: Math.floor(Math.random() * 80) + 10,
          stockLevel: i % 8 === 0 ? 'LOW' : 'HEALTHY',
          turnoverRate: parseFloat((Math.random() * 4 + 3).toFixed(2)), // 3-7
        });
      }

      for (const itemData of inventoryData) {
        await prisma.inventory.create({
          data: itemData,
        });
      }
      console.log(`    ✅ Created ${inventoryData.length} inventory items`);

      // Create Orders
      console.log('  📝 Creating orders...');
      const ordersData = [];
      const statuses = ['PENDING', 'ON_TIME', 'DELAYED'];
      const priorities = ['LOW', 'MEDIUM', 'HIGH'];

      // Create 113 total orders to match mock data: 23 pending, 3 delayed, 87 on-time
      for (let i = 0; i < 23; i++) {
        const randomSupplier = createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)];
        ordersData.push({
          companyId: company.id,
          supplierId: randomSupplier!.id,
          orderNumber: `ORD-${String(i + 1).padStart(3, '0')}`,
          status: 'PENDING',
          priority: priorities[Math.floor(Math.random() * priorities.length)] as 'LOW' | 'MEDIUM' | 'HIGH',
          eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          daysOverdue: 0,
          totalAmount: Math.floor(Math.random() * 10000) + 1000,
        });
      }

      for (let i = 0; i < 3; i++) {
        const randomSupplier = createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)];
        ordersData.push({
          companyId: company.id,
          supplierId: randomSupplier!.id,
          orderNumber: `ORD-${String(100 + i).padStart(3, '0')}`,
          status: 'DELAYED',
          priority: 'HIGH',
          eta: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
          daysOverdue: Math.floor(Math.random() * 5) + 1,
          totalAmount: Math.floor(Math.random() * 10000) + 1000,
        });
      }

      for (let i = 0; i < 87; i++) {
        const randomSupplier = createdSuppliers[Math.floor(Math.random() * createdSuppliers.length)];
        ordersData.push({
          companyId: company.id,
          supplierId: randomSupplier!.id,
          orderNumber: `ORD-${String(200 + i).padStart(3, '0')}`,
          status: 'ON_TIME',
          priority: priorities[Math.floor(Math.random() * priorities.length)] as 'LOW' | 'MEDIUM' | 'HIGH',
          eta: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000),
          daysOverdue: 0,
          totalAmount: Math.floor(Math.random() * 10000) + 1000,
        });
      }

      for (const orderData of ordersData) {
        await prisma.order.create({
          data: orderData,
        });
      }
      console.log(`    ✅ Created ${ordersData.length} orders`);

      // Create Demand Forecasts
      console.log('  📊 Creating demand forecasts...');
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentWeek = Math.ceil(now.getDate() / 7);

      const forecastData = [
        {
          companyId: company.id,
          week: currentWeek,
          year: currentYear,
          demand: 520,
          supply: 500,
          gap: -20,
          riskLevel: 'RISK',
        },
        {
          companyId: company.id,
          week: currentWeek + 1,
          year: currentYear,
          demand: 480,
          supply: 480,
          gap: 0,
          riskLevel: 'CAUTION',
        },
        {
          companyId: company.id,
          week: currentWeek + 2,
          year: currentYear,
          demand: 530,
          supply: 580,
          gap: 50,
          riskLevel: 'SAFE',
        },
        {
          companyId: company.id,
          week: currentWeek + 3,
          year: currentYear,
          demand: 510,
          supply: 540,
          gap: 30,
          riskLevel: 'SAFE',
        },
      ];

      for (const forecast of forecastData) {
        await prisma.demandForecast.create({
          data: forecast,
        });
      }
      console.log(`    ✅ Created ${forecastData.length} demand forecasts`);

      // Create KPIs
      console.log('  📈 Creating KPIs...');
      const nowKPI = new Date();
      const currentPeriod = `${nowKPI.getFullYear()}-${String(nowKPI.getMonth() + 1).padStart(2, '0')}`;

      const kpiData = [
        {
          companyId: company.id,
          name: 'OTIF',
          value: 96.0,
          trend: 2.0,
          target: 95.0,
          status: 'EXCELLENT',
          period: currentPeriod,
        },
        {
          companyId: company.id,
          name: 'DIO',
          value: 45.0,
          trend: -3.0,
          target: 50.0,
          status: 'ON_TRACK',
          period: currentPeriod,
        },
        {
          companyId: company.id,
          name: 'FILL_RATE',
          value: 98.0,
          trend: 1.0,
          target: 98.0,
          status: 'EXCELLENT',
          period: currentPeriod,
        },
        {
          companyId: company.id,
          name: 'TURNOVER',
          value: 6.2,
          trend: 0.3,
          target: 5.0,
          status: 'ON_TRACK',
          period: currentPeriod,
        },
      ];

      for (const kpi of kpiData) {
        await prisma.kPI.create({
          data: kpi,
        });
      }
      console.log(`    ✅ Created ${kpiData.length} KPIs`);
    }

    console.log('\n📊 Dashboard data seeding completed successfully!');

    // Verify the data
    const totalInventory = await prisma.inventory.count();
    const totalOrders = await prisma.order.count();
    const totalSuppliers = await prisma.supplier.count();
    const totalForecasts = await prisma.demandForecast.count();
    const totalKPIs = await prisma.kPI.count();

    console.log('\n📈 Dashboard Data Summary:');
    console.log(`Total Inventory Items: ${totalInventory}`);
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Total Suppliers: ${totalSuppliers}`);
    console.log(`Total Demand Forecasts: ${totalForecasts}`);
    console.log(`Total KPIs: ${totalKPIs}`);

  } catch (error) {
    console.error('❌ Error during dashboard data seeding:', error);
    throw error;
  }
};

/**
 * Reset dashboard data
 */
const resetDashboardData = async () => {
  try {
    console.log('🔄 Resetting dashboard data...');

    await prisma.kPI.deleteMany();
    await prisma.demandForecast.deleteMany();
    await prisma.order.deleteMany();
    await prisma.supplier.deleteMany();
    await prisma.inventory.deleteMany();

    console.log('✅ Dashboard data reset complete');

    await seedDashboardData();

  } catch (error) {
    console.error('❌ Error during dashboard data reset:', error);
    throw error;
  }
};

// Export functions
export { seedDashboardData, resetDashboardData };

// Run seeding if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'reset') {
    resetDashboardData()
      .then(() => {
        console.log('🎉 Dashboard data reset and seeding completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
      });
  } else {
    seedDashboardData()
      .then(() => {
        console.log('🎉 Dashboard data seeding completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
      });
  }
}

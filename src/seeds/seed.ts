import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/auth';

const prisma = new PrismaClient();

/**
 * Seed data for development and testing
 * Creates 3 companies and 5 users with different roles
 */
const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Check if data already exists
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      console.log('⚠️  Database already contains users. Skipping seed to avoid duplicates.');
      console.log(`📊 Found ${existingUsers} existing users`);
      return;
    }

    // Define seed data
    const companies = [
      {
        name: 'Acme Manufacturing',
        industry: 'Manufacturing',
        employees: 150
      },
      {
        name: 'TechRetail Inc',
        industry: 'Retail',
        employees: 200
      },
      {
        name: 'HealthCare Logistics',
        industry: 'Healthcare',
        employees: 100
      }
    ];

    const users = [
      // Acme Manufacturing users
      {
        email: 'manager@acme.com',
        name: 'John Smith',
        role: 'MANAGER' as const,
        password: 'demo123',
        companyName: 'Acme Manufacturing'
      },
      {
        email: 'planner@acme.com',
        name: 'Sarah Johnson',
        role: 'PLANNER' as const,
        password: 'demo123',
        companyName: 'Acme Manufacturing'
      },
      
      // TechRetail Inc users
      {
        email: 'manager@techretail.com',
        name: 'Michael Brown',
        role: 'MANAGER' as const,
        password: 'demo123',
        companyName: 'TechRetail Inc'
      },
      {
        email: 'coordinator@techretail.com',
        name: 'Lisa Davis',
        role: 'COORDINATOR' as const,
        password: 'demo123',
        companyName: 'TechRetail Inc'
      },
      
      // HealthCare Logistics users
      {
        email: 'manager@healthcare.com',
        name: 'Dr. Emily Wilson',
        role: 'MANAGER' as const,
        password: 'demo123',
        companyName: 'HealthCare Logistics'
      }
    ];

    console.log('🏢 Creating companies...');
    const createdCompanies = [];
    
    for (const companyData of companies) {
      const company = await prisma.company.create({
        data: companyData
      });
      createdCompanies.push(company);
      console.log(`✅ Created company: ${company.name} (${company.industry})`);
    }

    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of users) {
      // Find the company for this user
      const company = createdCompanies.find(c => c.name === userData.companyName);
      
      if (!company) {
        throw new Error(`Company not found for user ${userData.email}`);
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          companyId: company.id
        },
        include: {
          company: true
        }
      });

      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} (${user.role}) at ${user.company.name}`);
    }

    // Summary
    console.log('\n📊 Seeding completed successfully!');
    console.log(`🏢 Companies created: ${createdCompanies.length}`);
    console.log(`👥 Users created: ${createdUsers.length}`);
    console.log('\n🔑 Demo Credentials:');
    console.log('Email: manager@acme.com | Password: demo123 | Role: Manager');
    console.log('Email: planner@acme.com | Password: demo123 | Role: Planner');
    console.log('Email: manager@techretail.com | Password: demo123 | Role: Manager');
    console.log('Email: coordinator@techretail.com | Password: demo123 | Role: Coordinator');
    console.log('Email: manager@healthcare.com | Password: demo123 | Role: Manager');
    
    // Verify the data
    const totalUsers = await prisma.user.count();
    const totalCompanies = await prisma.company.count();
    
    console.log(`\n📈 Database Summary:`);
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Total Companies: ${totalCompanies}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
};

/**
 * Reset and seed database (for development)
 */
const resetAndSeed = async () => {
  try {
    console.log('🔄 Resetting database...');
    
    // Delete all data in reverse order to avoid foreign key constraints
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();
    
    console.log('✅ Database reset complete');
    
    // Run seeding
    await seedData();
    
  } catch (error) {
    console.error('❌ Error during database reset and seed:', error);
    throw error;
  }
};

// Export functions for different use cases
export { seedData, resetAndSeed };

// Run seeding if this file is executed directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'reset') {
    resetAndSeed()
      .then(() => {
        console.log('🎉 Database reset and seeding completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
      });
  } else {
    seedData()
      .then(() => {
        console.log('🎉 Seeding completed!');
        process.exit(0);
      })
      .catch((error) => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
      });
  }
}
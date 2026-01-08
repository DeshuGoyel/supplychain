import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 5 seeds...');

  const companies = await prisma.company.findMany();

  for (const company of companies) {
    console.log(`\n📦 Processing company: ${company.name}`);

    // Create WhiteLabelConfig
    const whiteLabelConfig = await prisma.whiteLabelConfig.upsert({
      where: { companyId: company.id },
      update: {},
      create: {
        companyId: company.id,
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        fontFamily: 'Inter, sans-serif',
        removedBranding: false,
        status: 'active'
      }
    });
    console.log(`  ✅ WhiteLabelConfig created`);

    // Create Email Templates
    const templateTypes = ['invoice', 'welcome', 'alert', 'trial_expiration', 'upgrade'];

    for (const templateType of templateTypes) {
      await prisma.emailTemplate.upsert({
        where: {
          companyId_templateType: {
            companyId: company.id,
            templateType
          }
        },
        update: {},
        create: {
          companyId: company.id,
          templateType,
          brandColor: '#3B82F6'
        }
      });
    }
    console.log(`  ✅ Email templates created`);

    // Create sample Audit Logs
    const users = await prisma.user.findMany({
      where: { companyId: company.id }
    });

    for (const user of users.slice(0, 3)) {
      await prisma.auditLog.createMany({
        data: [
          {
            companyId: company.id,
            userId: user.id,
            action: 'LOGIN',
            resource: 'User',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
          },
          {
            companyId: company.id,
            userId: user.id,
            action: 'VIEW',
            resource: 'Dashboard',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
          },
          {
            companyId: company.id,
            userId: user.id,
            action: 'UPDATE',
            resource: 'Inventory',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
          }
        ]
      });
    }
    console.log(`  ✅ Audit logs created`);

    // For Enterprise tier companies, create sample SAML config
    if (company.subscriptionTier === 'enterprise') {
      await prisma.sAMLConfig.upsert({
        where: { companyId: company.id },
        update: {},
        create: {
          companyId: company.id,
          idpUrl: 'https://example.okta.com',
          certificate: 'MIIDpDCCAoygAwIBAgIEX...',
          entityId: 'urn:example:entity',
          status: 'active'
        }
      });
      console.log(`  ✅ SAML config created (Enterprise)`);
    }
  }

  console.log('\n✅ Phase 5 seeds completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding Phase 5 data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

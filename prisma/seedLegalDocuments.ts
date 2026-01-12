import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGAL_DOCUMENTS = [
  {
    type: 'TERMS_OF_SERVICE',
    version: '1.0.0',
    title: 'Terms of Service',
    content: `
      <h2>Terms of Service</h2>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Acceptance of Terms</h3>
      <p>By accessing and using Supply Chain AI Control Assistant, you accept and agree to be bound by the terms and provisions of this agreement.</p>
      
      <h3>2. Description of Service</h3>
      <p>Supply Chain AI Control Assistant is a cloud-based supply chain management platform that provides analytics, forecasting, and management tools for businesses.</p>
      
      <h3>3. User Responsibilities</h3>
      <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.</p>
      
      <h3>4. Limitation of Liability</h3>
      <p>The service is provided "as is" without warranty of any kind, either express or implied.</p>
      
      <h3>5. Termination</h3>
      <p>We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability.</p>
      
      <h3>6. Governing Law</h3>
      <p>These terms shall be governed by and construed in accordance with applicable laws.</p>
    `,
    effectiveDate: new Date()
  },
  {
    type: 'PRIVACY_POLICY',
    version: '1.0.0',
    title: 'Privacy Policy',
    content: `
      <h2>Privacy Policy</h2>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Information We Collect</h3>
      <p>We collect information you provide directly to us, including account information, usage data, and communications.</p>
      
      <h3>2. How We Use Your Information</h3>
      <p>We use the information we collect to provide, maintain, and improve our services.</p>
      
      <h3>3. Data Sharing</h3>
      <p>We do not sell your personal information. We may share data with service providers who assist in our operations.</p>
      
      <h3>4. Data Security</h3>
      <p>We implement appropriate security measures to protect your information.</p>
      
      <h3>5. Your Rights</h3>
      <p>You have the right to access, correct, or delete your personal information at any time.</p>
      
      <h3>6. Contact Us</h3>
      <p>For privacy-related inquiries, please contact us at privacy@example.com.</p>
    `,
    effectiveDate: new Date()
  },
  {
    type: 'COOKIE_POLICY',
    version: '1.0.0',
    title: 'Cookie Policy',
    content: `
      <h2>Cookie Policy</h2>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h3>1. What Are Cookies</h3>
      <p>Cookies are small text files stored on your device when you visit our website.</p>
      
      <h3>2. Types of Cookies We Use</h3>
      <ul>
        <li><strong>Essential cookies:</strong> Required for the service to function properly</li>
        <li><strong>Analytics cookies:</strong> Help us understand how you use our service</li>
        <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
      </ul>
      
      <h3>3. Managing Cookies</h3>
      <p>You can control cookies through your browser settings at any time.</p>
    `,
    effectiveDate: new Date()
  },
  {
    type: 'ACCEPTABLE_USE',
    version: '1.0.0',
    title: 'Acceptable Use Policy',
    content: `
      <h2>Acceptable Use Policy</h2>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Prohibited Activities</h3>
      <p>You agree not to use the service for any unlawful, harmful, or abusive purposes.</p>
      
      <h3>2. Security Requirements</h3>
      <p>Users must maintain the security of their account and report any security breaches immediately.</p>
      
      <h3>3. Compliance</h3>
      <p>You agree to comply with all applicable laws and regulations while using our service.</p>
    `,
    effectiveDate: new Date()
  },
  {
    type: 'DPA',
    version: '1.0.0',
    title: 'Data Processing Agreement',
    content: `
      <h2>Data Processing Agreement</h2>
      <p>Last updated: ${new Date().toLocaleDateString()}</p>
      
      <h3>1. Purpose</h3>
      <p>This Data Processing Agreement (DPA) governs the processing of personal data by the platform on behalf of customers.</p>
      
      <h3>2. Data Processing Terms</h3>
      <p>We process personal data only as instructed by our customers and in accordance with GDPR requirements.</p>
      
      <h3>3. Security Measures</h3>
      <p>We implement appropriate technical and organizational measures to ensure security of personal data.</p>
      
      <h3>4. Sub-processors</h3>
      <p>We may use third-party sub-processors who have access to personal data, subject to contractual obligations.</p>
    `,
    effectiveDate: new Date()
  }
];

async function main() {
  console.log('Seeding legal documents...');

  for (const doc of LEGAL_DOCUMENTS) {
    // Check if document already exists
    const existing = await prisma.legalDocument.findFirst({
      where: { type: doc.type, version: doc.version }
    });

    if (!existing) {
      await prisma.legalDocument.create({ data: doc });
      console.log(`Created ${doc.type}`);
    } else {
      console.log(`${doc.type} already exists, skipping...`);
    }
  }

  console.log('Legal documents seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

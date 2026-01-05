import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getLegalDocument = (type: string): string => {
  switch (type) {
    case 'terms':
      return getTermsOfService();
    case 'privacy':
      return getPrivacyPolicy();
    case 'dpa':
      return getDataProcessingAgreement();
    case 'sla':
      return getServiceLevelAgreement();
    case 'aup':
      return getAcceptableUsePolicy();
    default:
      throw new Error('Invalid document type');
  }
};

const getTermsOfService = (): string => {
  return `
# Terms of Service

**Effective Date:** January 1, 2025

## 1. Acceptance of Terms

By accessing and using Supply Chain AI Control Assistant (the "Service"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License

Permission is granted to temporarily access the Service for personal or commercial use. This is the grant of a license, not a transfer of title.

### This license shall automatically terminate if you violate any of these restrictions:

- Use the Service for any illegal purpose
- Attempt to gain unauthorized access to the Service
- Transmit any malicious code or viruses
- Interfere with or disrupt the Service
- Attempt to reverse engineer the Service

## 3. User Obligations

You agree to:
- Provide accurate and complete registration information
- Maintain the security of your account credentials
- Notify us immediately of any unauthorized use
- Comply with all applicable laws and regulations
- Use the Service only for lawful business purposes

## 4. Subscription and Billing

- Subscriptions are billed in advance on a monthly or annual basis
- All fees are non-refundable except as required by law
- We reserve the right to modify pricing with 30 days notice
- You may cancel your subscription at any time

## 5. Data and Privacy

- We collect and process data as described in our Privacy Policy
- You retain ownership of all data you upload to the Service
- We implement industry-standard security measures
- We may use aggregated, anonymized data for service improvements

## 6. Service Availability

- We strive to maintain 99.9% uptime as outlined in our SLA
- Scheduled maintenance will be announced in advance
- We are not liable for downtime beyond our reasonable control

## 7. Intellectual Property

- The Service and its original content, features, and functionality are owned by Supply Chain AI
- You may not copy, modify, distribute, or reverse engineer any part of the Service
- Your company data and customizations remain your property

## 8. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.

## 9. Termination

We may terminate or suspend your account immediately, without prior notice, for:
- Breach of these Terms
- Non-payment of fees
- Violation of applicable laws
- Upon your request

Upon termination:
- Your right to access the Service ceases immediately
- You must stop using the Service
- We will provide data export for 30 days

## 10. Changes to Terms

We reserve the right to modify these terms at any time. We will notify users of material changes via email or in-app notification.

## 11. Governing Law

These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.

## 12. Contact Information

For questions about these Terms, please contact:
- Email: legal@supplychainai.com
- Address: [Company Address]

---

Last Updated: January 1, 2025
  `.trim();
};

const getPrivacyPolicy = (): string => {
  return `
# Privacy Policy

**Effective Date:** January 1, 2025

## 1. Introduction

Supply Chain AI ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy describes how we collect, use, and share information.

## 2. Information We Collect

### Personal Information
- Name and contact information
- Email address
- Company information
- Billing information
- Account credentials

### Usage Data
- Log data (IP address, browser type, pages visited)
- Device information
- Cookies and tracking technologies
- Feature usage analytics

### Business Data
- Inventory data
- Supplier information
- Purchase orders
- Shipment details
- Demand forecasts
- Any data you upload to the Service

## 3. How We Use Your Information

We use collected information for:
- Providing and improving the Service
- Processing transactions
- Sending administrative communications
- Responding to customer support requests
- Detecting and preventing fraud
- Analyzing usage patterns
- Marketing (with your consent)

## 4. Legal Basis for Processing (GDPR)

We process personal data based on:
- Contract performance
- Legitimate interests
- Legal obligations
- Your consent (where required)

## 5. Data Sharing and Disclosure

We may share your information with:
- Service providers (hosting, payment processing, analytics)
- Professional advisors
- Law enforcement (when legally required)
- Business transfer scenarios

We do NOT sell your personal data to third parties.

## 6. Data Security

We implement appropriate technical and organizational measures:
- Encryption in transit (TLS/SSL)
- Encryption at rest
- Access controls and authentication
- Regular security audits
- Employee training on data protection

## 7. Data Retention

- Account data: Retained while your account is active
- Business data: Retained per your subscription terms
- Audit logs: Retained for 1 year
- Backups: Retained for 90 days
- Legal requirements may extend retention periods

## 8. Your Rights (GDPR/CCPA)

You have the right to:
- Access your personal data
- Rectify inaccurate data
- Request deletion ("right to be forgotten")
- Data portability
- Restrict processing
- Object to processing
- Withdraw consent
- Lodge a complaint with a supervisory authority

## 9. International Data Transfers

Your data may be transferred to and processed in countries outside your jurisdiction. We ensure appropriate safeguards are in place.

## 10. Cookies and Tracking

We use cookies for:
- Authentication
- Preferences
- Analytics
- Security

You can control cookies through your browser settings.

## 11. Children's Privacy

The Service is not intended for users under 18 years of age. We do not knowingly collect data from children.

## 12. Third-Party Links

The Service may contain links to third-party websites. We are not responsible for their privacy practices.

## 13. California Privacy Rights (CCPA)

California residents have additional rights:
- Right to know what personal information is collected
- Right to know if personal information is sold or disclosed
- Right to opt-out of the sale of personal information
- Right to non-discrimination

## 14. Changes to This Policy

We may update this policy from time to time. We will notify you of material changes via email or in-app notification.

## 15. Contact Us

For privacy questions or to exercise your rights:
- Email: privacy@supplychainai.com
- Data Protection Officer: dpo@supplychainai.com
- Address: [Company Address]

---

Last Updated: January 1, 2025
  `.trim();
};

const getDataProcessingAgreement = (): string => {
  return `
# Data Processing Agreement (DPA)

**Effective Date:** January 1, 2025

This Data Processing Agreement ("DPA") forms part of the Terms of Service between you ("Customer" or "Data Controller") and Supply Chain AI ("Processor").

## 1. Definitions

- **Personal Data**: Any information relating to an identified or identifiable natural person
- **Processing**: Any operation performed on Personal Data
- **Data Subject**: The individual to whom Personal Data relates
- **Sub-processor**: Any third party engaged by Processor

## 2. Scope and Roles

- Customer acts as Data Controller
- Supply Chain AI acts as Data Processor
- This DPA applies to all Personal Data processed by Supply Chain AI on behalf of Customer

## 3. Processor Obligations

Supply Chain AI agrees to:
- Process Personal Data only on documented instructions from Customer
- Ensure authorized personnel are subject to confidentiality obligations
- Implement appropriate technical and organizational measures
- Assist Customer in responding to Data Subject requests
- Assist Customer with data protection impact assessments
- Delete or return Personal Data upon termination (at Customer's choice)
- Make available all information necessary to demonstrate compliance
- Allow for and contribute to audits

## 4. Security Measures

Technical and organizational measures include:
- Encryption of Personal Data in transit and at rest
- Regular security assessments and penetration testing
- Access controls and authentication (including 2FA)
- Audit logging of all access to Personal Data
- Incident response procedures
- Business continuity and disaster recovery plans
- Employee security training

## 5. Sub-processors

### Current Sub-processors:
- AWS (hosting infrastructure)
- Stripe (payment processing)
- SendGrid (email delivery)
- [Other service providers as applicable]

Customer authorizes the use of these Sub-processors. Supply Chain AI will notify Customer of any changes to Sub-processors with 30 days notice.

## 6. Data Subject Rights

Supply Chain AI will assist Customer in fulfilling Data Subject requests:
- Right of access
- Right to rectification
- Right to erasure
- Right to data portability
- Right to restrict processing
- Right to object

Response time: Within 10 business days of Customer's request.

## 7. Personal Data Breach

In the event of a breach:
- Supply Chain AI will notify Customer without undue delay (within 72 hours)
- Notification will include nature of breach, affected data, and mitigation measures
- Supply Chain AI will assist Customer in breach notification obligations

## 8. Data Transfers

Personal Data may be transferred to:
- United States
- European Union
- Other jurisdictions where Sub-processors operate

For transfers outside the EU/EEA, Supply Chain AI implements Standard Contractual Clauses approved by the European Commission.

## 9. Audits and Compliance

- Customer may audit Supply Chain AI's compliance once per year
- Audits must be scheduled with reasonable notice (30 days)
- Customer may use a qualified third-party auditor
- Supply Chain AI maintains SOC 2 compliance (or similar)

## 10. Data Retention and Deletion

- Personal Data is retained for the duration of the subscription
- Upon termination, data is deleted or returned within 30 days
- Backup copies are deleted within 90 days
- Legal requirements may extend retention

## 11. Liability and Indemnification

- Each party is liable for damages caused by its breach of this DPA
- Supply Chain AI will indemnify Customer for breaches of GDPR obligations
- Liability limitations in the Terms of Service apply

## 12. Term and Termination

This DPA remains in effect for the duration of the Terms of Service and survives termination for the data retention period.

## 13. Governing Law

This DPA is governed by the same law as the Terms of Service.

## 14. Contact for DPA

For DPA-related questions:
- Email: dpo@supplychainai.com
- Data Protection Officer
- Address: [Company Address]

---

**Signatures:**

By using the Service, Customer acknowledges and accepts this DPA.

For enterprise customers requiring a separately executed DPA, please contact legal@supplychainai.com.

---

Last Updated: January 1, 2025
  `.trim();
};

const getServiceLevelAgreement = (): string => {
  return `
# Service Level Agreement (SLA)

**Effective Date:** January 1, 2025

This Service Level Agreement ("SLA") applies to customers subscribed to the Growth or Enterprise tier.

## 1. Service Availability

### Uptime Commitment

**99.9% Monthly Uptime**

- Calculated as: (Total Minutes in Month - Downtime Minutes) / Total Minutes in Month × 100
- Excludes scheduled maintenance
- Measured per calendar month

### Definitions

- **Uptime**: Service is accessible and functional
- **Downtime**: Service is unavailable or materially impaired
- **Scheduled Maintenance**: Pre-announced maintenance windows

## 2. Scheduled Maintenance

- Performed during off-peak hours (weekends, late night UTC)
- Advance notice: 7 days for major maintenance, 48 hours for minor maintenance
- Maximum duration: 4 hours per maintenance window
- Maximum frequency: Once per month

## 3. Exclusions from SLA

Downtime is not counted if caused by:
- Customer's internet connectivity issues
- Third-party service failures beyond our control
- Customer's misuse or violation of Terms
- Force majeure events
- Scheduled maintenance
- Customer-requested changes or configurations

## 4. Service Credits

If we fail to meet the uptime commitment, you may be eligible for service credits:

| Monthly Uptime | Service Credit |
|---------------|----------------|
| 99.0% - 99.9% | 10% of monthly fee |
| 95.0% - 99.0% | 25% of monthly fee |
| < 95.0%       | 50% of monthly fee |

### Credit Process

- Credits must be requested within 30 days of the end of the month
- Credits are applied to future invoices
- Credits are your sole remedy for service availability failures
- Maximum credit per month: 50% of monthly subscription fee

## 5. Support Response Times

### Enterprise Tier

| Priority | Response Time | Resolution Time |
|----------|--------------|----------------|
| Critical (P1) | 1 hour | 4 hours |
| High (P2) | 4 hours | 1 business day |
| Medium (P3) | 1 business day | 3 business days |
| Low (P4) | 2 business days | 5 business days |

### Growth Tier

| Priority | Response Time | Resolution Time |
|----------|--------------|----------------|
| Critical (P1) | 4 hours | 8 hours |
| High (P2) | 8 hours | 2 business days |
| Medium (P3) | 2 business days | 5 business days |
| Low (P4) | 3 business days | 10 business days |

### Starter Tier

- Best-effort support
- Email support only
- No guaranteed response times

### Priority Definitions

- **P1 (Critical)**: Service completely unavailable or data loss
- **P2 (High)**: Major functionality impaired
- **P3 (Medium)**: Minor functionality impaired
- **P4 (Low)**: General questions, feature requests

### Support Hours

- Enterprise: 24/7 support
- Growth: Business hours (9 AM - 6 PM PST, Monday-Friday)
- Starter: Business hours (email only)

## 6. Performance Metrics

### API Response Times

- 95th percentile response time: < 500ms
- 99th percentile response time: < 2000ms
- Measured for successful API requests

### Data Processing

- Batch processing jobs: Completed within 24 hours
- Real-time updates: Reflected within 5 minutes

## 7. Security and Compliance

- SOC 2 Type II compliant (in progress)
- GDPR compliant
- Data encrypted in transit (TLS 1.2+)
- Data encrypted at rest (AES-256)
- Regular security audits and penetration testing

## 8. Backup and Recovery

### Backup Schedule

- Database backups: Daily
- Full system backups: Weekly
- Backup retention: 90 days

### Recovery Time Objective (RTO)

- Target: 4 hours for service restoration

### Recovery Point Objective (RPO)

- Target: 24 hours of data loss maximum

## 9. Incident Response

### Incident Communication

- Status page: status.supplychainai.com
- Email notifications for major incidents
- In-app notifications
- Incident post-mortems for P1 incidents

### Escalation Path

1. Support Team
2. Engineering Team
3. Engineering Manager
4. CTO (for critical incidents)

## 10. Service Modifications

We reserve the right to:
- Add new features without prior notice
- Modify existing features with 30 days notice if material
- Deprecate features with 90 days notice

## 11. Monitoring and Reporting

Enterprise customers receive:
- Monthly uptime reports
- Performance metrics dashboard
- Incident summaries
- Custom SLA reports upon request

## 12. SLA Review

This SLA is reviewed and may be updated:
- Annually
- With 60 days notice of material changes
- Customers will be notified via email

## 13. Contact

For SLA-related questions or to request service credits:
- Email: support@supplychainai.com
- Enterprise customers: Dedicated account manager

---

Last Updated: January 1, 2025
  `.trim();
};

const getAcceptableUsePolicy = (): string => {
  return `
# Acceptable Use Policy (AUP)

**Effective Date:** January 1, 2025

This Acceptable Use Policy describes prohibited uses of Supply Chain AI Control Assistant (the "Service").

## 1. Prohibited Activities

You may NOT use the Service to:

### Illegal Activities
- Violate any applicable laws or regulations
- Infringe on intellectual property rights
- Engage in fraud or financial crimes
- Facilitate illegal trade or transactions

### Security and Integrity
- Attempt to gain unauthorized access to the Service or other accounts
- Distribute malware, viruses, or malicious code
- Conduct denial-of-service attacks
- Circumvent security measures or authentication
- Attempt to reverse engineer the Service
- Probe, scan, or test vulnerabilities without permission

### Abuse and Harassment
- Harass, threaten, or abuse others
- Send unsolicited communications (spam)
- Impersonate others or misrepresent affiliation
- Engage in discriminatory practices

### Data Misuse
- Upload data you don't have the right to use
- Collect or harvest personal data without consent
- Share or sell access credentials
- Violate privacy rights of individuals

### Service Interference
- Overload or disrupt the Service infrastructure
- Use automated systems to access the Service excessively
- Interfere with other users' enjoyment of the Service
- Consume unreasonable bandwidth or storage

## 2. Compliance Obligations

You must:
- Comply with all applicable export control laws
- Maintain appropriate data protection measures
- Ensure your use complies with industry regulations
- Obtain necessary consents for data processing
- Maintain accurate account information

## 3. Content Restrictions

You may not upload or transmit:
- Illegal content
- Infringing content
- Malicious code or harmful files
- Excessive or irrelevant data
- Confidential information without authorization

## 4. API Usage

When using our API:
- Respect rate limits
- Don't create excessive API keys
- Don't share API keys
- Implement proper error handling
- Cache responses appropriately

## 5. Resource Usage

Fair usage limits apply:
- Storage limits per tier
- API call limits per tier
- User limits per tier
- Excessive usage may result in throttling or suspension

## 6. Monitoring and Enforcement

We reserve the right to:
- Monitor usage for compliance
- Investigate suspected violations
- Suspend or terminate accounts for violations
- Report illegal activity to law enforcement
- Preserve evidence of violations

## 7. Consequences of Violations

Violations may result in:
- Warning and request to cease activity
- Temporary suspension of account
- Permanent termination of account
- Legal action
- Reporting to authorities

## 8. Reporting Violations

To report violations:
- Email: abuse@supplychainai.com
- Include: Description, evidence, affected parties
- We will investigate within 5 business days

## 9. Security Vulnerabilities

If you discover a security vulnerability:
- Report it to security@supplychainai.com
- Do not exploit or disclose publicly
- Allow reasonable time for remediation
- We may offer a bug bounty (for approved researchers)

## 10. Account Security

You are responsible for:
- Maintaining credential confidentiality
- All activities under your account
- Notifying us of unauthorized access
- Using strong passwords
- Enabling two-factor authentication (recommended)

## 11. Third-Party Services

When integrating third-party services:
- Ensure they comply with this AUP
- Obtain necessary permissions
- You remain responsible for their actions

## 12. Acceptable Security Testing

You may conduct security testing if:
- You have explicit written permission
- Testing is limited to your own account
- You report findings responsibly
- You don't disrupt the Service

Unauthorized testing is prohibited.

## 13. Changes to This Policy

We may update this policy:
- With notice to users
- Changes effective immediately upon posting
- Continued use constitutes acceptance

## 14. Questions and Clarifications

For questions about this policy:
- Email: legal@supplychainai.com
- We'll respond within 3 business days

---

**Your Commitment**

By using the Service, you agree to comply with this Acceptable Use Policy. Violations may result in immediate termination without refund.

---

Last Updated: January 1, 2025
  `.trim();
};

export const createEnterpriseAgreement = async (
  companyId: string,
  agreementType: 'MSA' | 'DPA'
) => {
  try {
    // Check if company has enterprise tier
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionTier: true, name: true },
    });

    if (company?.subscriptionTier !== 'enterprise') {
      throw new Error('Enterprise agreements require enterprise tier');
    }

    // In production, generate actual PDF
    const pdfUrl = `https://supplychainai.com/agreements/${companyId}/${agreementType.toLowerCase()}.pdf`;

    const agreement = await prisma.enterpriseAgreement.create({
      data: {
        companyId,
        agreementType,
        status: 'pending',
        pdfUrl,
      },
    });

    return agreement;
  } catch (error) {
    console.error('Error creating enterprise agreement:', error);
    throw error;
  }
};

export const signEnterpriseAgreement = async (agreementId: string, companyId: string) => {
  try {
    const agreement = await prisma.enterpriseAgreement.findFirst({
      where: {
        id: agreementId,
        companyId,
      },
    });

    if (!agreement) {
      throw new Error('Agreement not found');
    }

    if (agreement.status === 'signed') {
      throw new Error('Agreement already signed');
    }

    const updated = await prisma.enterpriseAgreement.update({
      where: { id: agreementId },
      data: {
        status: 'signed',
        signedDate: new Date(),
        updatedAt: new Date(),
      },
    });

    return updated;
  } catch (error) {
    console.error('Error signing enterprise agreement:', error);
    throw error;
  }
};

export const getEnterpriseAgreements = async (companyId: string) => {
  try {
    const agreements = await prisma.enterpriseAgreement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return agreements;
  } catch (error) {
    console.error('Error fetching enterprise agreements:', error);
    throw new Error('Failed to fetch enterprise agreements');
  }
};

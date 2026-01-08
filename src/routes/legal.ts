import { Router, Request, Response } from 'express';

const router = Router();

const TERMS_OF_SERVICE = `
# Terms of Service

**Last Updated: January 2025**

## 1. Acceptance of Terms

By accessing and using Supply Chain AI Control Assistant ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service.

## 2. User Obligations

You agree to:
- Provide accurate and complete information during registration
- Maintain the security of your account credentials
- Notify us immediately of any unauthorized use
- Use the Service only for lawful purposes
- Comply with all applicable laws and regulations

## 3. Acceptable Use

You shall not:
- Use the Service for any illegal purpose
- Attempt to gain unauthorized access to the Service
- Interfere with or disrupt the Service or servers
- Transmit viruses or malicious code
- Use the Service to harass or harm others
- Violate any intellectual property rights

## 4. Intellectual Property

All content, features, and functionality of the Service are owned by Supply Chain AI Control Assistant and are protected by international copyright, trademark, and other intellectual property laws.

## 5. Data Privacy

Your use of the Service is subject to our Privacy Policy, which describes how we collect, use, and protect your information.

## 6. Limitation of Liability

To the fullest extent permitted by law, Supply Chain AI Control Assistant shall not be liable for:
- Any indirect, incidental, special, or consequential damages
- Loss of profits, data, or business opportunities
- Damages exceeding the amount you paid for the Service in the past 12 months

## 7. Indemnification

You agree to indemnify and hold harmless Supply Chain AI Control Assistant from any claims arising from your use of the Service or violation of these Terms.

## 8. Termination

We may terminate or suspend your access to the Service at any time, with or without cause, with or without notice.

Upon termination:
- Your right to use the Service will immediately cease
- We may delete your account and data
- You remain liable for all charges incurred

## 9. Governing Law

These Terms shall be governed by the laws of the jurisdiction in which Supply Chain AI Control Assistant is headquartered.

## 10. Changes to Terms

We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service.

## 11. Contact Information

For questions about these Terms, please contact us at legal@supplychain.ai
`;

const PRIVACY_POLICY = `
# Privacy Policy

**Last Updated: January 2025**

## 1. Introduction

Supply Chain AI Control Assistant ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.

## 2. Data Collection

We collect:
- **Account Information**: Name, email address, company details
- **Usage Data**: Pages visited, features used, time spent
- **Technical Data**: IP address, browser type, device information
- **Business Data**: Inventory, orders, suppliers, forecasts

## 3. Data Usage

We use your information to:
- Provide and improve the Service
- Process transactions and send related information
- Send technical notices and support messages
- Respond to comments and questions
- Monitor and analyze trends
- Detect, prevent, and address technical issues

## 4. Data Sharing

We do not sell your personal information. We may share data with:
- **Service Providers**: Third parties who assist in operating the Service
- **Business Partners**: With your consent for integrated services
- **Legal Authorities**: When required by law or to protect our rights
- **Successors**: In connection with a merger, acquisition, or sale of assets

## 5. Data Retention

We retain your data for:
- **Active Accounts**: As long as your account is active
- **Legal Requirements**: As required by applicable laws
- **Business Purposes**: As necessary for legitimate business interests
- **Audit Logs**: 1 year (configurable)

## 6. User Rights

You have the right to:
- **Access**: Request a copy of your personal data
- **Rectification**: Request correction of inaccurate data
- **Erasure**: Request deletion of your data (right to be forgotten)
- **Portability**: Request transfer of your data
- **Objection**: Object to processing of your data
- **Withdraw Consent**: Withdraw consent at any time

## 7. Data Security

We implement:
- Encryption in transit and at rest
- Access controls and authentication
- Regular security audits
- Incident response procedures

## 8. International Transfers

Your data may be transferred to and processed in countries other than your own. We ensure adequate safeguards are in place.

## 9. Third-Party Services

We use third-party services including:
- Payment processors (Stripe)
- Email services (SendGrid)
- Analytics tools
- Cloud infrastructure providers

## 10. Children's Privacy

The Service is not intended for children under 13. We do not knowingly collect information from children.

## 11. California Residents (CCPA)

If you are a California resident, you have additional rights:
- Right to know what personal information we collect
- Right to know if we sell or disclose your information
- Right to opt-out of the sale of personal information
- Right to equal service and non-discrimination

## 12. European Residents (GDPR)

If you are a European resident, you have additional rights:
- Right to be informed about data processing
- Right of access to your personal data
- Right to rectification
- Right to erasure
- Right to restrict processing
- Right to data portability
- Right to object
- Rights in relation to automated decision-making

## 13. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes.

## 14. Contact Information

For privacy inquiries, please contact us at privacy@supplychain.ai
`;

const DATA_PROCESSING_AGREEMENT = `
# Data Processing Agreement (DPA)

**Last Updated: January 2025**

## 1. Introduction

This Data Processing Agreement ("DPA") is entered into between Supply Chain AI Control Assistant ("Processor") and the customer ("Controller") and supplements the Terms of Service.

## 2. Definitions

- **Controller**: The entity that determines the purposes and means of processing personal data
- **Processor**: The entity that processes personal data on behalf of the Controller
- **Personal Data**: Information relating to an identified or identifiable natural person
- **Data Subject**: An individual whose personal data is processed

## 3. Scope and Duration

This DPA applies to all processing of personal data by the Processor on behalf of the Controller, for the duration of the Services Agreement.

## 4. Roles and Responsibilities

### Controller Responsibilities
- Determine the purposes and means of processing
- Obtain necessary consents from data subjects
- Provide lawful basis for processing
- Respond to data subject requests
- Notify Processor of legal requirements

### Processor Responsibilities
- Process only on documented instructions
- Implement appropriate security measures
- Assist with data subject requests
- Notify Controller of data breaches
- Maintain processing records

## 5. Nature and Purpose of Processing

The Processor shall process personal data for the following purposes:
- Providing supply chain management services
- Storing and managing business data
- Generating analytics and reports
- Customer support and service delivery

## 6. Categories of Data Subjects

Personal data may relate to:
- Company employees and managers
- Customer contacts
- Supplier representatives

## 7. Categories of Personal Data

- Contact information (name, email, phone)
- Professional information (job title, department)
- Usage and interaction data

## 8. Data Security Measures

The Processor shall implement:
- Technical measures: Encryption, access controls, authentication
- Organizational measures: Policies, training, incident response
- Physical measures: Secure facilities, access logging

## 9. Sub-Processing

The Processor may engage sub-processors with prior written consent. Common sub-processors include:
- Cloud infrastructure providers (AWS, Google Cloud)
- Payment processors (Stripe)
- Email providers (SendGrid)
- Analytics providers

The Processor remains liable for sub-processor compliance.

## 10. Data Subject Rights

The Processor shall assist the Controller in:
- Providing access to personal data
- Rectifying inaccurate data
- Erasing data when requested
- Restricting processing
- Data portability

## 11. Data Breach Notification

The Processor shall:
- Notify Controller without undue delay of any personal data breach
- Provide information about the breach nature and scope
- Assist in meeting notification obligations to authorities

## 12. Data Transfers

The Processor shall ensure:
- Adequate safeguards for international transfers
- Use of standard contractual clauses or other legal mechanisms
- Compliance with GDPR Chapter V requirements

## 13. Data Protection Impact Assessments

The Processor shall assist the Controller in conducting data protection impact assessments when required by law.

## 14. Audit Rights

The Controller (or an independent auditor) may audit Processor's compliance with this DPA, subject to:
- Reasonable notice
- During business hours
- No more than once per year
- Confidentiality obligations

## 15. Deletion and Return of Data

Upon termination of the Services Agreement, the Processor shall:
- Delete or return all personal data
- Confirm deletion in writing
- Retain data only as required by law

## 16. Governing Law

This DPA shall be governed by the laws of the European Union for EU customers, and applicable state/federal law for US customers.

## 17. Dispute Resolution

Any disputes shall be resolved through good faith negotiation, followed by binding arbitration if necessary.

## 18. Contact Information

For DPA inquiries, please contact us at dpa@supplychain.ai
`;

const SERVICE_LEVEL_AGREEMENT = `
# Service Level Agreement (SLA)

**Last Updated: January 2025**

## 1. Overview

This Service Level Agreement ("SLA") defines the service levels and performance commitments for Supply Chain AI Control Assistant.

## 2. Service Description

Supply Chain AI Control Assistant provides a cloud-based supply chain management platform including:
- Inventory management
- Supplier relationship management
- Purchase order management
- Shipment tracking
- Demand forecasting
- Analytics and reporting

## 3. Service Availability Commitment

We commit to **99.9% monthly uptime** for the Service.

### Uptime Calculation

Uptime is calculated as:
\[
Uptime\% = \frac{\text{Total Minutes in Month} - \text{Downtime Minutes}}{\text{Total Minutes in Month}} \times 100
\]

### Exclusions

Downtime excludes:
- Scheduled maintenance (up to 4 hours per month with 48-hour notice)
- Force majeure events
- Third-party service failures
- Customer network or equipment issues
- Beta or preview features

## 4. Response Time Commitments

### Critical Issues (P1)
- System completely unavailable
- Data loss or corruption
- Security breach
- **Response time**: 1 hour
- **Resolution target**: 4 hours

### High Priority Issues (P2)
- Major functionality unavailable
- Performance degradation >50%
- Data inconsistency
- **Response time**: 4 hours
- **Resolution target**: 24 hours

### Medium Priority Issues (P3)
- Minor functionality unavailable
- Performance degradation <50%
- User interface issues
- **Response time**: 8 hours
- **Resolution target**: 48 hours

### Low Priority Issues (P4)
- Cosmetic issues
- Documentation errors
- Enhancement requests
- **Response time**: 24 hours
- **Resolution target**: 5 business days

## 5. Incident Response Procedures

### Detection and Acknowledgment
- Automated monitoring detects issues
- Support team acknowledges within response time targets

### Investigation and Diagnosis
- Technical team investigates root cause
- Regular updates provided to affected customers

### Resolution and Recovery
- Implement fix or workaround
- Verify service restoration
- Document incident details

### Post-Incident Review
- Analyze root cause
- Update procedures as needed
- Share lessons learned

## 6. Support Channels

### Support Tiers
- **Basic**: Email support (48-hour response)
- **Growth**: Email + chat support (24-hour response)
- **Enterprise**: 24/7 phone + email + chat (1-hour response)

### Support Hours
- Email: 24/7
- Chat: Business hours (9 AM - 5 PM, Mon-Fri)
- Phone: Enterprise only (24/7)

### Contact Information
- Email: support@supplychain.ai
- Chat: Available in the application
- Phone: Enterprise customers only

## 7. Performance Metrics

We monitor and report on:
- Service availability (99.9% target)
- Response times (per priority level)
- API latency (<200ms p95 target)
- Data accuracy (>99.9% target)

## 8. Service Credits

If we fail to meet our uptime commitment, you may be eligible for service credits:

| Monthly Uptime | Service Credit |
|---------------|---------------|
| 99.0% - 99.9% | 10% of monthly fee |
| 95.0% - 98.9% | 25% of monthly fee |
| <95.0% | 50% of monthly fee |

### Credit Eligibility
- Maximum credit: 100% of monthly fee
- Must request credit within 30 days
- Credits applied to future invoices
- No cash refunds

## 9. Customer Responsibilities

To ensure we can meet our commitments, you must:
- Provide accurate contact information
- Report issues promptly with sufficient detail
- Grant access to necessary systems for troubleshooting
- Maintain network connectivity and compatible browsers

## 10. Limitations and Exclusions

No service credits will be provided for:
- Failure to meet response time targets
- Issues caused by customer actions
- Third-party service failures
- Scheduled maintenance
- Force majeure events

## 11. Reporting and Transparency

### Monthly Reports
Enterprise customers receive monthly reports including:
- Actual uptime percentage
- Incident summary
- Performance metrics
- Any service credits earned

### Transparency
- Public status page at status.supplychain.ai
- Incident post-mortems for major outages
- Quarterly performance reviews for Enterprise

## 12. Modifications

We may modify this SLA with 30-day notice. Material changes require Enterprise customer consent.

## 13. Termination

Either party may terminate this SLA upon material breach by the other party, with 30-day written notice.

## 14. Contact Information

For SLA inquiries, please contact us at sla@supplychain.ai
`;

const ACCEPTABLE_USE_POLICY = `
# Acceptable Use Policy (AUP)

**Last Updated: January 2025**

## 1. Purpose

This Acceptable Use Policy ("AUP") outlines the rules and guidelines for using Supply Chain AI Control Assistant.

## 2. Prohibited Uses

You shall not use the Service to:

### Illegal Activities
- Violate any applicable laws or regulations
- Engage in fraud or money laundering
- Distribute illegal content or materials

### Security Violations
- Attempt to circumvent security measures
- Probe, scan, or test system vulnerabilities
- Introduce viruses, malware, or malicious code
- Gain unauthorized access to other accounts
- Interfere with service operation

### Abuse and Harassment
- Harass, threaten, or abuse others
- Send unsolicited commercial messages (spam)
- Engage in phishing or social engineering
- Distribute defamatory or offensive content

### Intellectual Property Infringement
- Violate copyright, trademark, or patent rights
- Distribute pirated software or media
- Use third-party content without permission
- Reverse engineer the Service

### Misuse of Resources
- Exceed permitted usage limits
- Attempt to circumvent rate limits
- Use automated tools without permission
- Interfere with other users' experience

## 3. Security Obligations

### Password Security
- Use strong, unique passwords
- Never share passwords
- Change passwords periodically
- Report suspected compromises immediately

### Access Control
- Grant access only to authorized personnel
- Review access rights regularly
- Revoke access promptly when needed
- Use role-based permissions

### Data Protection
- Classify sensitive data appropriately
- Implement access controls
- Encrypt sensitive data at rest and in transit
- Follow data retention policies

## 4. Compliance Requirements

### Industry Regulations
You must comply with:
- GDPR (if processing EU data)
- CCPA (if processing California data)
- HIPAA (if in healthcare)
- SOC 2 controls (if applicable)

### Financial Regulations
- Maintain accurate records
- Implement segregation of duties
- Conduct regular audits
- Report suspicious activity

### Export Controls
- Comply with export control laws
- Obtain necessary licenses
- Restricted party screening

## 5. Content Standards

All content you provide must be:
- Lawful and non-infringing
- Accurate and truthful
- Not misleading or deceptive
- Professional and respectful

## 6. Email and Communications

When using our email features:
- Include proper opt-out mechanisms
- Honor unsubscribe requests
- Include accurate header information
- Comply with CAN-SPAM Act

## 7. API Usage

If using our API:
- Follow rate limiting guidelines
- Use authentication properly
- Handle errors gracefully
- Implement retry logic with backoff
- Monitor usage and quotas

## 8. Monitoring and Enforcement

We monitor the Service for:
- Security threats
- Policy violations
- Performance issues
- Abuse patterns

### Enforcement Actions
We may:
- Issue warnings
- Temporarily suspend access
- Permanently terminate accounts
- Report violations to authorities
- Pursue legal remedies

## 9. Reporting Violations

To report policy violations:
- Email: abuse@supplychain.ai
- Include detailed description and evidence
- We investigate all reports

## 10. Policy Changes

We may update this AUP at any time. Material changes will be notified via email or in-app notice.

## 11. Contact Information

For AUP questions, contact us at compliance@supplychain.ai
`;

router.get('/terms', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Terms of Service',
      content: TERMS_OF_SERVICE,
      lastUpdated: '2025-01-08'
    }
  });
});

router.get('/privacy', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Privacy Policy',
      content: PRIVACY_POLICY,
      lastUpdated: '2025-01-08'
    }
  });
});

router.get('/dpa', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Data Processing Agreement',
      content: DATA_PROCESSING_AGREEMENT,
      lastUpdated: '2025-01-08'
    }
  });
});

router.get('/sla', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Service Level Agreement',
      content: SERVICE_LEVEL_AGREEMENT,
      lastUpdated: '2025-01-08'
    }
  });
});

router.get('/aup', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      title: 'Acceptable Use Policy',
      content: ACCEPTABLE_USE_POLICY,
      lastUpdated: '2025-01-08'
    }
  });
});

export default router;

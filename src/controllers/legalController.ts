import { Request, Response } from 'express';

export function getTermsOfService(req: Request, res: Response) {
  const terms = {
    title: 'Terms of Service',
    lastUpdated: '2025-01-08',
    content: `
# Terms of Service

Last Updated: January 8, 2025

## 1. Acceptance of Terms

By accessing and using Supply Chain AI Control Assistant ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Use License

Permission is granted to temporarily access the Service for personal or commercial use. This is the grant of a license, not a transfer of title.

### This license shall automatically terminate if you violate any of these restrictions:
- Use the Service for any illegal purpose
- Attempt to gain unauthorized access to the Service
- Interfere with or disrupt the Service
- Share your account credentials with others

## 3. Subscription and Payment

- Subscriptions are billed monthly or annually
- 14-day free trial available (no credit card required)
- Refunds available within 30 days of initial payment
- You may cancel your subscription at any time
- Service continues until the end of the billing period after cancellation

## 4. User Data

- You retain all rights to your data
- We may use aggregated, anonymized data for analytics
- You are responsible for the accuracy of your data
- We will not sell your data to third parties

## 5. Service Availability

- We strive for 99.9% uptime (see SLA for details)
- Scheduled maintenance will be announced in advance
- We are not liable for downtime outside our control

## 6. Intellectual Property

- The Service and its original content are owned by us
- You may not copy, modify, or distribute our software
- Your feedback may be used to improve the Service

## 7. Limitation of Liability

The Service is provided "as is" without warranties of any kind. We shall not be liable for any damages arising from the use of the Service.

## 8. Changes to Terms

We reserve the right to modify these terms at any time. Continued use of the Service constitutes acceptance of modified terms.

## 9. Governing Law

These terms shall be governed by the laws of the jurisdiction in which our company is registered.

## 10. Contact Information

For questions about these Terms, please contact us at legal@supplychain-ai.com
    `,
  };

  res.json(terms);
}

export function getPrivacyPolicy(req: Request, res: Response) {
  const policy = {
    title: 'Privacy Policy',
    lastUpdated: '2025-01-08',
    content: `
# Privacy Policy

Last Updated: January 8, 2025

## 1. Information We Collect

### Personal Information:
- Name and email address
- Company name and details
- Payment information (processed securely via Stripe)
- Usage data and analytics

### Automatically Collected:
- IP address
- Browser type and version
- Pages visited and time spent
- Device information

## 2. How We Use Your Information

- Provide and maintain the Service
- Process payments and send invoices
- Send product updates and marketing communications
- Improve and personalize the Service
- Detect and prevent fraud
- Comply with legal obligations

## 3. Data Sharing

We do not sell your personal information. We may share data with:
- Payment processors (Stripe)
- Email service providers (SendGrid)
- Analytics providers (anonymized data)
- Legal authorities when required by law

## 4. Data Security

- All data is encrypted in transit (TLS/SSL)
- Sensitive data is encrypted at rest
- Regular security audits
- Access controls and authentication
- Two-factor authentication available

## 5. Your Rights (GDPR & CCPA)

You have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your data (right to erasure)
- Export your data (data portability)
- Opt-out of marketing communications
- Object to data processing

To exercise these rights, contact privacy@supplychain-ai.com

## 6. Data Retention

- Account data: Retained while account is active
- Deleted account data: Retained for 90 days then permanently deleted
- Billing data: Retained for 7 years for tax compliance
- Anonymized analytics: Retained indefinitely

## 7. Cookies

We use cookies to:
- Maintain your session
- Remember your preferences
- Analyze usage patterns
- Improve the Service

You can disable cookies in your browser settings.

## 8. Children's Privacy

The Service is not intended for users under 18. We do not knowingly collect data from children.

## 9. International Data Transfers

Your data may be processed in countries other than your own. We ensure appropriate safeguards are in place.

## 10. Changes to This Policy

We may update this policy from time to time. We will notify you of significant changes via email.

## 11. Contact Us

For privacy questions or to exercise your rights:
- Email: privacy@supplychain-ai.com
- Data Protection Officer: dpo@supplychain-ai.com
    `,
  };

  res.json(policy);
}

export function getDataProcessingAgreement(req: Request, res: Response) {
  const dpa = {
    title: 'Data Processing Agreement (GDPR)',
    lastUpdated: '2025-01-08',
    content: `
# Data Processing Agreement

Last Updated: January 8, 2025

This Data Processing Agreement ("DPA") forms part of the Terms of Service between you ("Customer") and Supply Chain AI Control Assistant ("Processor").

## 1. Definitions

- **Personal Data**: Any information relating to an identified or identifiable natural person
- **Processing**: Any operation performed on Personal Data
- **Controller**: The entity determining purposes and means of Processing
- **Processor**: The entity Processing Personal Data on behalf of Controller
- **Sub-processor**: Third party engaged by Processor

## 2. Roles and Responsibilities

Customer is the Controller. Supply Chain AI is the Processor.

## 3. Processor Obligations

The Processor shall:
- Process Personal Data only on documented instructions from Controller
- Ensure confidentiality of persons authorized to process Personal Data
- Implement appropriate technical and organizational measures
- Engage Sub-processors only with prior written consent
- Assist Controller in responding to data subject requests
- Assist Controller with data breach notifications
- Delete or return Personal Data upon termination

## 4. Security Measures

- Encryption of data in transit and at rest
- Regular security assessments
- Access controls and authentication
- Incident response procedures
- Business continuity planning
- Regular backups

## 5. Sub-processors

Current Sub-processors:
- Stripe (payment processing)
- SendGrid (email delivery)
- AWS/Railway (hosting infrastructure)

Controller consents to engagement of these Sub-processors. Processor will notify Controller of any changes.

## 6. Data Subject Rights

Processor will assist Controller in fulfilling data subject rights:
- Right of access
- Right to rectification
- Right to erasure
- Right to restriction of processing
- Right to data portability
- Right to object

## 7. Data Breach Notification

Processor will notify Controller without undue delay (within 24 hours) of any Personal Data breach.

## 8. Data Transfers

Data may be transferred to and processed in the United States. Processor ensures appropriate safeguards through Standard Contractual Clauses.

## 9. Audits

Controller may audit Processor's compliance with this DPA once per year with 30 days notice.

## 10. Term and Termination

This DPA remains in effect while Processor processes Personal Data on behalf of Controller. Upon termination, Processor will delete or return all Personal Data within 90 days.

## 11. Liability

Each party's liability under this DPA is subject to the limitations in the Terms of Service.

## 12. Governing Law

This DPA is governed by the same law as the Terms of Service.
    `,
  };

  res.json(dpa);
}

export function getServiceLevelAgreement(req: Request, res: Response) {
  const sla = {
    title: 'Service Level Agreement (SLA)',
    lastUpdated: '2025-01-08',
    content: `
# Service Level Agreement

Last Updated: January 8, 2025

This Service Level Agreement ("SLA") applies to Enterprise customers of Supply Chain AI Control Assistant.

## 1. Service Availability

### Uptime Commitment: 99.9%

- **Measurement Period**: Calendar month
- **Calculation**: (Total Minutes - Downtime Minutes) / Total Minutes × 100
- **Exclusions**: Scheduled maintenance, customer-caused issues, force majeure

### Scheduled Maintenance

- Announced 7 days in advance
- Performed during off-peak hours (typically 2-4 AM UTC)
- Limited to 4 hours per month

## 2. Performance Metrics

### API Response Times:
- **Target**: 95% of requests < 500ms
- **Measurement**: P95 latency over 24-hour period

### Data Processing:
- **Reports**: Generated within 5 minutes
- **Bulk Imports**: Processed within 30 minutes for up to 10,000 records

## 3. Support Response Times

### Critical (Service Down):
- **Response**: 1 hour
- **Resolution Target**: 4 hours

### High (Major Feature Unavailable):
- **Response**: 4 hours
- **Resolution Target**: 24 hours

### Medium (Minor Issue):
- **Response**: 8 hours
- **Resolution Target**: 48 hours

### Low (General Question):
- **Response**: 24 hours
- **Resolution Target**: 72 hours

## 4. Service Credits

If we fail to meet the 99.9% uptime commitment:

| Uptime % | Service Credit |
|----------|----------------|
| 99.0% - 99.8% | 10% of monthly fee |
| 95.0% - 98.9% | 25% of monthly fee |
| < 95.0% | 50% of monthly fee |

### Claiming Credits:
- Must be requested within 30 days of incident
- Credits applied to next month's invoice
- Credits are sole remedy for SLA breaches

## 5. Data Backup and Recovery

- **Backup Frequency**: Every 24 hours
- **Retention**: 30 days
- **Recovery Time Objective (RTO)**: 4 hours
- **Recovery Point Objective (RPO)**: 24 hours

## 6. Security Incidents

- **Detection**: 24/7 monitoring
- **Notification**: Within 24 hours of confirmed breach
- **Remediation**: Immediate action plan

## 7. Exclusions

This SLA does not apply to:
- Free trial accounts
- Starter and Growth plans (best-effort support)
- Issues caused by customer's infrastructure
- Third-party service failures
- Scheduled maintenance
- Force majeure events

## 8. Monitoring and Reporting

- Real-time status page: status.supplychain-ai.com
- Monthly uptime reports provided upon request
- Incident post-mortems for major outages

## 9. Changes to SLA

We may modify this SLA with 30 days notice to Enterprise customers.

## 10. Contact

For SLA-related inquiries: sla@supplychain-ai.com
    `,
  };

  res.json(sla);
}

export function getAcceptableUsePolicy(req: Request, res: Response) {
  const aup = {
    title: 'Acceptable Use Policy',
    lastUpdated: '2025-01-08',
    content: `
# Acceptable Use Policy

Last Updated: January 8, 2025

This Acceptable Use Policy ("AUP") governs your use of Supply Chain AI Control Assistant.

## 1. Prohibited Activities

You may not use the Service to:

### Illegal Activities:
- Violate any laws or regulations
- Infringe intellectual property rights
- Engage in fraud or deceptive practices

### Security:
- Attempt unauthorized access
- Introduce malware or viruses
- Conduct security testing without permission
- Share account credentials
- Bypass rate limits or usage restrictions

### Abuse:
- Send spam or unsolicited communications
- Harass or threaten others
- Impersonate others
- Scrape or harvest data without permission

### Resource Abuse:
- Excessive API requests beyond plan limits
- Store inappropriate content
- Use Service to compete with us

## 2. Data Usage

- You are responsible for the accuracy of your data
- Do not upload malicious or corrupted data
- Do not store personal data without proper consent
- Comply with data protection laws (GDPR, CCPA, etc.)

## 3. Account Security

- Keep credentials confidential
- Use strong passwords
- Enable two-factor authentication (recommended)
- Report suspicious activity immediately

## 4. Content Standards

Any content you upload must:
- Be accurate and not misleading
- Not violate third-party rights
- Not contain malware or harmful code
- Comply with applicable laws

## 5. Resource Limits

- Respect plan limits (API calls, storage, users)
- Excessive usage may result in throttling
- Enterprise customers: contact us for custom limits

## 6. Enforcement

Violations may result in:
- Warning notice
- Temporary suspension
- Account termination
- Legal action
- Reporting to authorities

## 7. Reporting Violations

Report AUP violations to: abuse@supplychain-ai.com

We investigate all reports and take appropriate action.

## 8. Changes to This Policy

We may update this policy. Continued use constitutes acceptance.

## 9. Contact

Questions about this policy: support@supplychain-ai.com
    `,
  };

  res.json(aup);
}

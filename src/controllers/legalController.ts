import { Request, Response } from 'express';

const docs = {
  terms: {
    title: 'Terms of Service',
    updatedAt: '2026-01-01',
    content: `Terms of Service\n\nBy using this service, you agree to these terms. This document is provided as a template and should be reviewed by legal counsel before production use.\n\n1. Service\nWe provide a supply chain analytics SaaS platform.\n\n2. Subscription & Billing\nSubscriptions renew automatically unless cancelled.\n\n3. Acceptable Use\nYou agree not to abuse the service or attempt unauthorized access.\n\n4. Data\nYou retain ownership of your data; you grant us permission to process it to provide the service.\n\n5. Liability\nService is provided \"as is\"; liability is limited to fees paid in the prior 3 months.\n`
  },
  privacy: {
    title: 'Privacy Policy',
    updatedAt: '2026-01-01',
    content: `Privacy Policy\n\nWe collect account data (email, name), usage telemetry, and billing metadata to provide the service.\n\nWe do not sell personal information.\n\nFor GDPR/CCPA requests, contact support.`
  },
  dpa: {
    title: 'Data Processing Agreement (DPA)',
    updatedAt: '2026-01-01',
    content: `DPA\n\nThis DPA describes data processing terms for customers subject to GDPR. Provided as a template.`
  },
  sla: {
    title: 'Service Level Agreement (SLA)',
    updatedAt: '2026-01-01',
    content: `SLA\n\nWe target 99.9% monthly uptime. This document is a template and should be reviewed by legal counsel.`
  },
  aup: {
    title: 'Acceptable Use Policy (AUP)',
    updatedAt: '2026-01-01',
    content: `AUP\n\nYou must not use the service for unlawful activity, malware distribution, or abusive automated traffic.`
  }
};

export const getTerms = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, ...docs.terms });
};

export const getPrivacy = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, ...docs.privacy });
};

export const getDpa = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, ...docs.dpa });
};

export const getSla = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, ...docs.sla });
};

export const getAup = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, ...docs.aup });
};

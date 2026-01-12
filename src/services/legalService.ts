import { LegalDocumentType, Prisma, PrismaClient } from '@prisma/client';

const DEFAULT_VERSION = '1.0.0';

const defaultDocs: Record<LegalDocumentType, string> = {
  TERMS_OF_SERVICE: `# Terms of Service\n\nThese Terms of Service ("Terms") govern your access to and use of the platform.\n\n## Acceptable Use\nYou agree not to misuse the service, attempt to disrupt it, or access it without authorization.\n\n## Limitation of Liability\nTo the maximum extent permitted by law, the service is provided "as is" without warranties.\n`,
  PRIVACY_POLICY: `# Privacy Policy\n\nThis Privacy Policy describes how we collect, use, and share information.\n\n## Data Collected\nWe collect account and usage information necessary to provide the service.\n\n## GDPR/CCPA\nDepending on your location, you may have rights to access, delete, or export your data.\n`,
  COOKIE_POLICY: `# Cookie Policy\n\nWe use cookies for authentication, preferences, and analytics.\n\n## Managing Cookies\nYou can manage consent preferences via the cookie banner.\n`,
  ACCEPTABLE_USE_POLICY: `# Acceptable Use Policy\n\nYou may not use the service for illegal activities, abuse, spam, or attempts to compromise system security.\n`,
  DATA_PROCESSING_AGREEMENT: `# Data Processing Agreement\n\nThis DPA describes the processor/controller relationship for business customers.\n`,
};

export const isLegalDocumentType = (value: unknown): value is LegalDocumentType => {
  return typeof value === 'string' && (Object.values(LegalDocumentType) as string[]).includes(value);
};

type PrismaLike = PrismaClient | Prisma.TransactionClient;

export const ensureDefaultDocuments = async (prisma: PrismaLike): Promise<void> => {
  const existingCount = await prisma.legalDocument.count();
  if (existingCount > 0) return;

  const effectiveDate = new Date();

  await prisma.legalDocument.createMany({
    data: (Object.keys(defaultDocs) as LegalDocumentType[]).map((type) => ({
      type,
      version: DEFAULT_VERSION,
      content: defaultDocs[type],
      effectiveDate,
    })),
  });
};

export const getLatestDocument = async (prisma: PrismaLike, type: LegalDocumentType) => {
  return prisma.legalDocument.findFirst({
    where: { type },
    orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
  });
};

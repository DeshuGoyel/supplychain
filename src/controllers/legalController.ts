import { Request, Response } from 'express';
import { LegalDocumentType, PrismaClient } from '@prisma/client';
import { ensureDefaultDocuments, getLatestDocument, isLegalDocumentType } from '../services/legalService';

const prisma = new PrismaClient();

/**
 * GET /api/legal/documents
 * Public endpoint returning latest effective versions.
 */
export const getLegalDocuments = async (_req: Request, res: Response): Promise<void> => {
  try {
    await ensureDefaultDocuments(prisma);

    const docs = await prisma.legalDocument.findMany({
      orderBy: [{ type: 'asc' }, { effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });

    const latestByType = new Map<LegalDocumentType, typeof docs[number]>();
    for (const doc of docs) {
      if (!latestByType.has(doc.type)) latestByType.set(doc.type, doc);
    }

    res.status(200).json({
      success: true,
      documents: Array.from(latestByType.values()),
    });
  } catch (error) {
    console.error('Get legal documents error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching legal documents' });
  }
};

/**
 * POST /api/legal/accept
 * { documentType, version? }
 */
export const acceptLegalDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId as string | undefined;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { documentType, version } = req.body as { documentType?: unknown; version?: unknown };

    if (!isLegalDocumentType(documentType)) {
      res.status(400).json({ success: false, message: 'Invalid documentType' });
      return;
    }

    await ensureDefaultDocuments(prisma);

    const docVersion =
      typeof version === 'string' && version
        ? version
        : (await getLatestDocument(prisma, documentType))?.version;

    if (!docVersion) {
      res.status(404).json({ success: false, message: 'Document not found' });
      return;
    }

    const acceptance = await prisma.userLegalAcceptance.upsert({
      where: {
        userId_documentType_version: {
          userId,
          documentType,
          version: docVersion,
        },
      },
      update: {
        acceptedAt: new Date(),
      },
      create: {
        userId,
        documentType,
        version: docVersion,
        acceptedAt: new Date(),
      },
    });

    res.status(200).json({ success: true, acceptance });
  } catch (error) {
    console.error('Accept legal document error:', error);
    res.status(500).json({ success: false, message: 'Internal server error accepting legal document' });
  }
};

/**
 * GET /api/legal/versions
 * Admin endpoint listing all versions (optionally filtered by type)
 */
export const getLegalVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDefaultDocuments(prisma);

    const type = req.query.type;
    if (type !== undefined && !isLegalDocumentType(type)) {
      res.status(400).json({ success: false, message: 'Invalid type query parameter' });
      return;
    }

    const documents = await prisma.legalDocument.findMany({
      where: type ? { type } : undefined,
      orderBy: [{ type: 'asc' }, { effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });

    res.status(200).json({ success: true, documents });
  } catch (error) {
    console.error('Get legal versions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching legal versions' });
  }
};

/**
 * POST /api/legal/versions
 * Admin endpoint to publish a new document version
 */
export const publishLegalVersion = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, version, content, effectiveDate } = req.body as {
      type?: unknown;
      version?: unknown;
      content?: unknown;
      effectiveDate?: unknown;
    };

    if (!isLegalDocumentType(type)) {
      res.status(400).json({ success: false, message: 'Invalid type' });
      return;
    }

    if (typeof version !== 'string' || !version.trim()) {
      res.status(400).json({ success: false, message: 'version is required' });
      return;
    }

    if (typeof content !== 'string' || !content.trim()) {
      res.status(400).json({ success: false, message: 'content is required' });
      return;
    }

    const parsedEffectiveDate =
      typeof effectiveDate === 'string' || effectiveDate instanceof Date
        ? new Date(effectiveDate)
        : new Date();

    const doc = await prisma.legalDocument.create({
      data: {
        type,
        version: version.trim(),
        content,
        effectiveDate: parsedEffectiveDate,
      },
    });

    res.status(201).json({ success: true, document: doc });
  } catch (error) {
    console.error('Publish legal version error:', error);
    res.status(500).json({ success: false, message: 'Internal server error publishing legal version' });
  }
};

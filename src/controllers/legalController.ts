import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all active public documents (metadata only)
 * GET /api/legal/public
 */
export const getPublicDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await prisma.legalDocument.findMany({
      where: { isActive: true },
      select: {
        id: true,
        type: true,
        version: true,
        title: true,
        effectiveDate: true
      },
      orderBy: [{ type: 'asc' }, { version: 'desc' }]
    });

    // Get latest version for each type
    const latestByType = documents.reduce((acc: Record<string, typeof documents[0]>, doc) => {
      if (doc.type && (!acc[doc.type] || doc.version > acc[doc.type].version)) {
        acc[doc.type] = doc;
      }
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      documents: Object.values(latestByType)
    });
  } catch (error) {
    console.error('Get public documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching documents'
    });
  }
};

/**
 * Get specific document by type
 * GET /api/legal/public/:type
 */
export const getDocumentByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;

    const document = await prisma.legalDocument.findFirst({
      where: { 
        type: type.toUpperCase(),
        isActive: true
      },
      orderBy: { version: 'desc' }
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: `No active ${type} document found`
      });
      return;
    }

    res.status(200).json({
      success: true,
      document: {
        ...document,
        documentType: document.type
      }
    });
  } catch (error) {
    console.error('Get document by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching document'
    });
  }
};

/**
 * Accept a legal document
 * POST /api/legal/accept
 */
export const acceptDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;
    const { documentType, documentVersion } = req.body;

    if (!documentType || !documentVersion) {
      res.status(400).json({
        success: false,
        message: 'Document type and version are required'
      });
      return;
    }

    const normalizedType = documentType.toUpperCase();

    // Verify document exists and is active
    const document = await prisma.legalDocument.findFirst({
      where: {
        type: normalizedType,
        version: documentVersion,
        isActive: true
      }
    });

    if (!document) {
      res.status(404).json({
        success: false,
        message: 'Document not found or not active'
      });
      return;
    }

    const ipAddress = req.ip || null;
    const userAgent = req.get('user-agent') || null;

    // Upsert acceptance record
    await prisma.userLegalAcceptance.upsert({
      where: {
        userId_documentType: {
          userId,
          documentType: normalizedType
        }
      },
      update: {
        version: documentVersion,
        acceptedAt: new Date(),
        ipAddress,
        userAgent
      },
      create: {
        userId,
        documentType: normalizedType,
        version: documentVersion,
        ipAddress,
        userAgent
      }
    });

    res.status(200).json({
      success: true,
      message: `${documentType} version ${documentVersion} accepted successfully`
    });
  } catch (error) {
    console.error('Accept document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error accepting document'
    });
  }
};

/**
 * Get user's legal acceptances
 * GET /api/legal/acceptances
 */
export const getUserAcceptances = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const acceptances = await prisma.userLegalAcceptance.findMany({
      where: { userId }
    });

    // Get latest required versions
    const latestDocuments = await prisma.legalDocument.groupBy({
      by: ['type'],
      _max: { version: true }
    });

    const acceptedVersions = acceptances.reduce((acc: Record<string, string>, a) => {
      acc[a.documentType] = a.version;
      return acc;
    }, {});

    const requiredVersions = latestDocuments.reduce((acc: Record<string, string>, d) => {
      acc[d.type] = d._max.version || '';
      return acc;
    }, {});

    // Check which documents need acceptance
    const needsAcceptance = Object.keys(requiredVersions).filter(
      type => !acceptedVersions[type] || acceptedVersions[type] !== requiredVersions[type]
    );

    res.status(200).json({
      success: true,
      acceptances: acceptances.map(a => ({
        documentType: a.documentType,
        version: a.version,
        acceptedAt: a.acceptedAt
      })),
      needsAcceptance,
      requiredVersions
    });
  } catch (error) {
    console.error('Get user acceptances error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching acceptances'
    });
  }
};

/**
 * Create new legal document (Admin)
 * POST /api/legal/admin
 */
export const createDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, version, title, content, effectiveDate } = req.body;

    if (!type || !version || !title || !content || !effectiveDate) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: type, version, title, content, effectiveDate'
      });
      return;
    }

    const normalizedType = type.toUpperCase();

    // Deactivate old versions of same type
    await prisma.legalDocument.updateMany({
      where: { type: normalizedType },
      data: { isActive: false }
    });

    const document = await prisma.legalDocument.create({
      data: {
        type: normalizedType,
        version,
        title,
        content,
        effectiveDate: new Date(effectiveDate),
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Document created successfully',
      document
    });
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error creating document'
    });
  }
};

/**
 * Get all documents for admin
 * GET /api/legal/admin
 */
export const getAllDocuments = async (req: Request, res: Response): Promise<void> => {
  try {
    const documents = await prisma.legalDocument.findMany({
      orderBy: [{ type: 'asc' }, { version: 'desc' }]
    });

    res.status(200).json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error fetching documents'
    });
  }
};

/**
 * Delete document (Admin)
 * DELETE /api/legal/admin/:id
 */
export const deleteDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // First find the document to get type and version
    const doc = await prisma.legalDocument.findUnique({
      where: { id }
    });

    if (!doc) {
      res.status(404).json({
        success: false,
        message: 'Document not found'
      });
      return;
    }

    await prisma.legalDocument.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error deleting document'
    });
  }
};

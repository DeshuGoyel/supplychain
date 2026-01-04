import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get issues for a company
 */
export const getIssues = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { type, status, severity } = req.query;

    const where: any = { companyId };

    if (type) {
      where.type = type as string;
    }

    if (status) {
      where.status = status as string;
    }

    if (severity) {
      where.severity = parseInt(severity as string);
    }

    // Default to open/acknowledged issues
    if (!status) {
      where.status = {
        in: ['OPEN', 'ACKNOWLEDGED']
      } as any;
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Parse metadata
    const issuesWithMetadata = issues.map(issue => ({
      ...issue,
      metadata: issue.metadata ? JSON.parse(issue.metadata) : null
    }));

    res.json({
      success: true,
      data: issuesWithMetadata
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issues',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Update issue status (acknowledge/resolve)
 */
export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { id } = req.params;
    const { status, resolutionNotes } = req.body;

    const validStatuses = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const updateData: any = { status };

    if (status === 'ACKNOWLEDGED') {
      updateData.acknowledgedAt = new Date();
    }

    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date();
      updateData.description = resolutionNotes;
    }

    const issue = await prisma.issue.updateMany({
      where: {
        id,
        companyId
      },
      data: updateData
    });

    if (issue.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    res.json({
      success: true,
      message: 'Issue updated successfully'
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating issue',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

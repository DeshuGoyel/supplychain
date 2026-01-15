import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from './advancedLogger';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedTime: number; // in minutes
  dependencies?: string[];
}

export interface CompanyOnboarding {
  id: string;
  companyId: string;
  userId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'paused';
  metadata: Record<string, any>;
}

// Define the complete onboarding flow
export const ONBOARDING_FLOW: OnboardingStep[] = [
  {
    id: 'account_setup',
    title: 'Account Setup',
    description: 'Complete your company profile and team setup',
    completed: false,
    required: true,
    estimatedTime: 5
  },
  {
    id: 'database_connection',
    title: 'Database Connection',
    description: 'Connect your existing systems and data sources',
    completed: false,
    required: true,
    estimatedTime: 15,
    dependencies: ['account_setup']
  },
  {
    id: 'supplier_import',
    title: 'Supplier Import',
    description: 'Import your supplier data and contacts',
    completed: false,
    required: true,
    estimatedTime: 10,
    dependencies: ['database_connection']
  },
  {
    id: 'inventory_setup',
    title: 'Inventory Configuration',
    description: 'Set up your inventory items and locations',
    completed: false,
    required: true,
    estimatedTime: 20,
    dependencies: ['supplier_import']
  },
  {
    id: 'workflow_configuration',
    title: 'Workflow Setup',
    description: 'Configure approval workflows and notifications',
    completed: false,
    required: true,
    estimatedTime: 15,
    dependencies: ['inventory_setup']
  },
  {
    id: 'team_invitation',
    title: 'Team Invitation',
    description: 'Invite your team members and set up roles',
    completed: false,
    required: false,
    estimatedTime: 5,
    dependencies: ['workflow_configuration']
  },
  {
    id: 'integration_setup',
    title: 'System Integrations',
    description: 'Connect external systems (ERP, CRM, etc.)',
    completed: false,
    required: false,
    estimatedTime: 30,
    dependencies: ['workflow_configuration']
  },
  {
    id: 'data_migration',
    title: 'Data Migration',
    description: 'Import historical data and set up reporting',
    completed: false,
    required: false,
    estimatedTime: 45,
    dependencies: ['integration_setup']
  },
  {
    id: 'training_completion',
    title: 'Team Training',
    description: 'Complete team training and certification',
    completed: false,
    required: false,
    estimatedTime: 60,
    dependencies: ['data_migration']
  },
  {
    id: 'go_live',
    title: 'Go Live',
    description: 'Activate your production environment',
    completed: false,
    required: true,
    estimatedTime: 10,
    dependencies: ['training_completion']
  }
];

export class OnboardingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Initialize onboarding for a new company
  async initializeOnboarding(companyId: string, userId: string): Promise<CompanyOnboarding> {
    try {
      const onboarding = await this.prisma.companyOnboarding.create({
        data: {
          companyId,
          userId,
          currentStep: 0,
          totalSteps: ONBOARDING_FLOW.length,
          completedSteps: [],
          startedAt: new Date(),
          status: 'in_progress',
          metadata: {}
        }
      });

      logger.info('Onboarding initialized', {
        companyId,
        userId,
        onboardingId: onboarding.id,
        totalSteps: ONBOARDING_FLOW.length
      });

      return onboarding;
    } catch (error) {
      logger.error('Failed to initialize onboarding', {
        companyId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // Get current onboarding status
  async getOnboardingStatus(companyId: string): Promise<CompanyOnboarding | null> {
    try {
      return await this.prisma.companyOnboarding.findFirst({
        where: { companyId, status: { in: ['in_progress', 'paused'] } }
      });
    } catch (error) {
      logger.error('Failed to get onboarding status', {
        companyId,
        error: error.message
      });
      throw error;
    }
  }

  // Get available steps for current progress
  getAvailableSteps(completedSteps: string[]): OnboardingStep[] {
    return ONBOARDING_FLOW.filter(step => {
      if (completedSteps.includes(step.id)) return false;
      
      // Check dependencies
      if (step.dependencies) {
        return step.dependencies.every(dep => completedSteps.includes(dep));
      }
      
      return true;
    });
  }

  // Complete a specific step
  async completeStep(companyId: string, stepId: string, metadata?: any): Promise<CompanyOnboarding> {
    try {
      const onboarding = await this.getOnboardingStatus(companyId);
      if (!onboarding) {
        throw new Error('Onboarding not found');
      }

      if (onboarding.completedSteps.includes(stepId)) {
        throw new Error('Step already completed');
      }

      // Verify step is available
      const availableSteps = this.getAvailableSteps(onboarding.completedSteps);
      const step = availableSteps.find(s => s.id === stepId);
      if (!step) {
        throw new Error('Step is not available for completion');
      }

      // Update onboarding
      const updatedSteps = [...onboarding.completedSteps, stepId];
      const currentStepIndex = updatedSteps.length;
      
      const updated = await this.prisma.companyOnboarding.update({
        where: { id: onboarding.id },
        data: {
          completedSteps: updatedSteps,
          currentStep: currentStepIndex,
          status: currentStepIndex >= ONBOARDING_FLOW.length ? 'completed' : 'in_progress',
          completedAt: currentStepIndex >= ONBOARDING_FLOW.length ? new Date() : null,
          metadata: {
            ...onboarding.metadata,
            [`step_${stepId}`]: {
              completedAt: new Date(),
              metadata
            }
          }
        }
      });

      logger.info('Onboarding step completed', {
        companyId,
        stepId,
        completedSteps: updatedSteps.length,
        totalSteps: ONBOARDING_FLOW.length
      });

      return updated;
    } catch (error) {
      logger.error('Failed to complete onboarding step', {
        companyId,
        stepId,
        error: error.message
      });
      throw error;
    }
  }

  // Get step details
  getStepDetails(stepId: string): OnboardingStep | null {
    return ONBOARDING_FLOW.find(step => step.id === stepId) || null;
  }

  // Get onboarding progress percentage
  getProgress(onboarding: CompanyOnboarding): number {
    return Math.round((onboarding.completedSteps.length / onboarding.totalSteps) * 100);
  }

  // Generate onboarding checklist
  async generateChecklist(companyId: string): Promise<any> {
    const onboarding = await this.getOnboardingStatus(companyId);
    if (!onboarding) return null;

    const availableSteps = this.getAvailableSteps(onboarding.completedSteps);
    const progress = this.getProgress(onboarding);

    return {
      onboarding,
      progress,
      totalSteps: ONBOARDING_FLOW.length,
      completedSteps: onboarding.completedSteps,
      availableSteps,
      estimatedTimeRemaining: this.calculateRemainingTime(onboarding.completedSteps, availableSteps),
      nextStep: availableSteps[0] || null
    };
  }

  // Calculate estimated remaining time
  private calculateRemainingTime(completedSteps: string[], availableSteps: OnboardingStep[]): number {
    const remainingSteps = ONBOARDING_FLOW.filter(step => !completedSteps.includes(step.id));
    return remainingSteps.reduce((total, step) => total + step.estimatedTime, 0);
  }

  // Pause onboarding
  async pauseOnboarding(companyId: string): Promise<void> {
    try {
      const onboarding = await this.getOnboardingStatus(companyId);
      if (onboarding && onboarding.status === 'in_progress') {
        await this.prisma.companyOnboarding.update({
          where: { id: onboarding.id },
          data: { status: 'paused' }
        });

        logger.info('Onboarding paused', { companyId });
      }
    } catch (error) {
      logger.error('Failed to pause onboarding', {
        companyId,
        error: error.message
      });
      throw error;
    }
  }

  // Resume onboarding
  async resumeOnboarding(companyId: string): Promise<void> {
    try {
      const onboarding = await this.getOnboardingStatus(companyId);
      if (onboarding && onboarding.status === 'paused') {
        await this.prisma.companyOnboarding.update({
          where: { id: onboarding.id },
          data: { status: 'in_progress' }
        });

        logger.info('Onboarding resumed', { companyId });
      }
    } catch (error) {
      logger.error('Failed to resume onboarding', {
        companyId,
        error: error.message
      });
      throw error;
    }
  }
}

// Express middleware for onboarding
export const onboardingMiddleware = (onboardingService: OnboardingService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const companyId = req.user?.companyId;
    if (!companyId) return next();

    try {
      const onboarding = await onboardingService.getOnboardingStatus(companyId);
      if (onboarding && onboarding.status === 'in_progress') {
        // Attach onboarding info to request
        (req as any).onboarding = onboarding;
      }
    } catch (error) {
      logger.error('Onboarding middleware error', {
        companyId,
        error: error.message
      });
    }

    next();
  };
};
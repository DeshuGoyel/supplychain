import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface APIBranding {
  customResponseFormat?: string;
  customDocumentationBranding?: {
    logoUrl?: string;
    companyName?: string;
    primaryColor?: string;
  };
  customRateLimitMessage?: string;
  customErrorMessages?: {
    [key: string]: string;
  };
}

export class APIWhiteLabelService {
  private static instance: APIWhiteLabelService;

  private constructor() {}

  static getInstance(): APIWhiteLabelService {
    if (!APIWhiteLabelService.instance) {
      APIWhiteLabelService.instance = new APIWhiteLabelService();
    }
    return APIWhiteLabelService.instance;
  }

  async getAPIBranding(companyId: string): Promise<APIBranding | null> {
    const whiteLabelConfig = await prisma.whiteLabelConfig.findUnique({
      where: { companyId }
    });

    if (!whiteLabelConfig) {
      return null;
    }

    // Return branding based on white-label config
    const branding: APIBranding = {
      customResponseFormat: 'standard',
      customDocumentationBranding: {
        logoUrl: whiteLabelConfig.logoUrl || undefined,
        companyName: undefined, // Would come from company name
        primaryColor: whiteLabelConfig.primaryColor
      },
      customRateLimitMessage: 'Rate limit exceeded',
      customErrorMessages: {}
    };

    return branding;
  }

  customizeErrorMessage(error: any, companyId?: string): string {
    if (!companyId) {
      return error.message || 'An error occurred';
    }

    // Get white-label config for company
    return error.message || 'An error occurred';
  }

  formatAPIResponse(data: any, companyId?: string, meta?: any) {
    const response: any = {
      success: true,
      data
    };

    if (meta) {
      response.meta = meta;
    }

    return response;
  }

  formatAPIError(error: any, companyId?: string, code?: string) {
    const response: any = {
      success: false,
      message: this.customizeErrorMessage(error, companyId)
    };

    if (code) {
      response.code = code;
    }

    if (process.env.NODE_ENV === 'development') {
      response.details = error.stack;
    }

    return response;
  }
}

export const apiWhiteLabelService = APIWhiteLabelService.getInstance();

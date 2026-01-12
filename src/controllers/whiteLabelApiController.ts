import { Request, Response } from 'express';
import { PrismaClient, WhiteLabel } from '@prisma/client';
import { whiteLabelService } from '../services/whiteLabelService';

const prisma = new PrismaClient();

const isHexColor = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
};

const normalizeDomain = (domain: string): string => domain.trim().toLowerCase().split(':')[0] || domain;

const resolveCompanyId = (req: Request): string | null => {
  const authCompanyId = (req as any).user?.companyId as string | undefined;
  if (authCompanyId) return authCompanyId;

  const domainCompanyId = (req as any).whiteLabelCompanyId as string | undefined;
  if (domainCompanyId) return domainCompanyId;

  const queryCompanyId = req.query.companyId;
  if (typeof queryCompanyId === 'string' && queryCompanyId) return queryCompanyId;

  return null;
};

const formatWhiteLabel = (settings: (WhiteLabel & { company?: { name: string } }) | null) => {
  if (!settings) return null;

  return {
    ...settings,
    // compatibility aliases
    companyName: settings.brandName || settings.company?.name || null,
    footerText: settings.footerText ?? settings.customFooterText ?? null,
  };
};

/**
 * Public (domain-based) or authenticated (company-based)
 * GET /api/white-label
 */
export const getWhiteLabelConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = resolveCompanyId(req);

    if (!companyId) {
      res.status(200).json({
        success: true,
        config: {
          enabled: false,
          primaryColor: '#3b82f6',
          secondaryColor: '#1e40af',
        },
      });
      return;
    }

    const settings = await whiteLabelService.getByCompanyId(companyId);

    res.status(200).json({
      success: true,
      config: formatWhiteLabel(settings),
    });
  } catch (error) {
    console.error('Get white-label config error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching white-label config' });
  }
};

/**
 * Create or replace config for a company
 * POST /api/white-label
 */
export const createWhiteLabelConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId as string | undefined;
    if (!companyId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      enabled,
      brandName,
      primaryColor,
      secondaryColor,
      logoUrl,
      faviconUrl,
      customDomain,
      supportEmail,
      privacyPolicyUrl,
      termsOfServiceUrl,
      footerText,
      hideSupplyChainBranding,
    } = req.body as Record<string, unknown>;

    if (primaryColor !== undefined && !isHexColor(primaryColor)) {
      res.status(400).json({ success: false, message: 'primaryColor must be a hex color (e.g. #3b82f6)' });
      return;
    }

    if (secondaryColor !== undefined && !isHexColor(secondaryColor)) {
      res.status(400).json({ success: false, message: 'secondaryColor must be a hex color (e.g. #1e40af)' });
      return;
    }

    const normalizedDomain = typeof customDomain === 'string' && customDomain ? normalizeDomain(customDomain) : null;

    if (normalizedDomain) {
      const existing = await prisma.whiteLabel.findFirst({
        where: {
          customDomain: normalizedDomain,
          NOT: { companyId },
        },
      });

      if (existing) {
        res.status(409).json({ success: false, message: 'Custom domain is already in use' });
        return;
      }
    }

    const settings = await prisma.whiteLabel.upsert({
      where: { companyId },
      update: {
        enabled: enabled === undefined ? undefined : Boolean(enabled),
        brandName: typeof brandName === 'string' ? brandName : undefined,
        primaryColor: typeof primaryColor === 'string' ? primaryColor : undefined,
        secondaryColor: typeof secondaryColor === 'string' ? secondaryColor : undefined,
        logoUrl: typeof logoUrl === 'string' ? logoUrl : undefined,
        faviconUrl: typeof faviconUrl === 'string' ? faviconUrl : undefined,
        customDomain: normalizedDomain ?? undefined,
        supportEmail: typeof supportEmail === 'string' ? supportEmail : undefined,
        privacyPolicyUrl: typeof privacyPolicyUrl === 'string' ? privacyPolicyUrl : undefined,
        termsOfServiceUrl: typeof termsOfServiceUrl === 'string' ? termsOfServiceUrl : undefined,
        footerText: typeof footerText === 'string' ? footerText : undefined,
        hideSupplyChainBranding: hideSupplyChainBranding === undefined ? undefined : Boolean(hideSupplyChainBranding),
      },
      create: {
        companyId,
        enabled: Boolean(enabled),
        brandName: typeof brandName === 'string' ? brandName : undefined,
        primaryColor: typeof primaryColor === 'string' ? primaryColor : undefined,
        secondaryColor: typeof secondaryColor === 'string' ? secondaryColor : undefined,
        logoUrl: typeof logoUrl === 'string' ? logoUrl : undefined,
        faviconUrl: typeof faviconUrl === 'string' ? faviconUrl : undefined,
        customDomain: normalizedDomain ?? undefined,
        supportEmail: typeof supportEmail === 'string' ? supportEmail : undefined,
        privacyPolicyUrl: typeof privacyPolicyUrl === 'string' ? privacyPolicyUrl : undefined,
        termsOfServiceUrl: typeof termsOfServiceUrl === 'string' ? termsOfServiceUrl : undefined,
        footerText: typeof footerText === 'string' ? footerText : undefined,
        hideSupplyChainBranding: Boolean(hideSupplyChainBranding),
      },
    });

    whiteLabelService.invalidateCompany(companyId);
    if (settings.customDomain) whiteLabelService.invalidateDomain(settings.customDomain);

    res.status(201).json({ success: true, config: settings });
  } catch (error) {
    console.error('Create white-label config error:', error);
    res.status(500).json({ success: false, message: 'Internal server error creating white-label config' });
  }
};

/**
 * Update config by id
 * PUT /api/white-label/:id
 */
export const updateWhiteLabelConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId as string | undefined;
    if (!companyId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const id = req.params.id;
    if (!id) {
      res.status(400).json({ success: false, message: 'id is required' });
      return;
    }

    const existing = await prisma.whiteLabel.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      res.status(404).json({ success: false, message: 'White-label config not found' });
      return;
    }

    const update = req.body as Record<string, unknown>;

    if (update.primaryColor !== undefined && !isHexColor(update.primaryColor)) {
      res.status(400).json({ success: false, message: 'primaryColor must be a hex color (e.g. #3b82f6)' });
      return;
    }

    if (update.secondaryColor !== undefined && !isHexColor(update.secondaryColor)) {
      res.status(400).json({ success: false, message: 'secondaryColor must be a hex color (e.g. #1e40af)' });
      return;
    }

    let normalizedDomain: string | undefined;
    if (typeof update.customDomain === 'string') {
      normalizedDomain = update.customDomain ? normalizeDomain(update.customDomain) : '';

      if (normalizedDomain) {
        const conflict = await prisma.whiteLabel.findFirst({
          where: {
            customDomain: normalizedDomain,
            NOT: { id },
          },
        });

        if (conflict) {
          res.status(409).json({ success: false, message: 'Custom domain is already in use' });
          return;
        }
      }
    }

    const settings = await prisma.whiteLabel.update({
      where: { id },
      data: {
        enabled: update.enabled === undefined ? undefined : Boolean(update.enabled),
        brandName: typeof update.brandName === 'string' ? update.brandName : undefined,
        primaryColor: typeof update.primaryColor === 'string' ? update.primaryColor : undefined,
        secondaryColor: typeof update.secondaryColor === 'string' ? update.secondaryColor : undefined,
        logoUrl: typeof update.logoUrl === 'string' ? update.logoUrl : undefined,
        faviconUrl: typeof update.faviconUrl === 'string' ? update.faviconUrl : undefined,
        customDomain: normalizedDomain === undefined ? undefined : normalizedDomain || null,
        supportEmail: typeof update.supportEmail === 'string' ? update.supportEmail : undefined,
        privacyPolicyUrl: typeof update.privacyPolicyUrl === 'string' ? update.privacyPolicyUrl : undefined,
        termsOfServiceUrl: typeof update.termsOfServiceUrl === 'string' ? update.termsOfServiceUrl : undefined,
        footerText: typeof update.footerText === 'string' ? update.footerText : undefined,
        hideSupplyChainBranding:
          update.hideSupplyChainBranding === undefined ? undefined : Boolean(update.hideSupplyChainBranding),
      },
    });

    whiteLabelService.invalidateCompany(companyId);
    if (settings.customDomain) whiteLabelService.invalidateDomain(settings.customDomain);

    res.status(200).json({ success: true, config: settings });
  } catch (error) {
    console.error('Update white-label config error:', error);
    res.status(500).json({ success: false, message: 'Internal server error updating white-label config' });
  }
};

/**
 * DELETE /api/white-label/:id
 */
export const deleteWhiteLabelConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = (req as any).user?.companyId as string | undefined;
    if (!companyId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const id = req.params.id;
    const existing = await prisma.whiteLabel.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      res.status(404).json({ success: false, message: 'White-label config not found' });
      return;
    }

    await prisma.whiteLabel.delete({ where: { id } });

    whiteLabelService.invalidateCompany(companyId);
    if (existing.customDomain) whiteLabelService.invalidateDomain(existing.customDomain);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete white-label config error:', error);
    res.status(500).json({ success: false, message: 'Internal server error deleting white-label config' });
  }
};

import { Request, Response } from 'express';
import { SAMLService } from '../services/saml.service';

const service = new SAMLService();

export const getMetadata = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user?.companyId as string;

    if (!companyId) {
      res.status(400).send('companyId required');
      return;
    }

    const xml = service.generateServiceProviderMetadata(companyId);
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate metadata';
    res.status(500).json({ success: false, message });
  }
};

export const createConfig = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;

    const { idpUrl, certificate, entityId, nameIdFormat } = req.body;
    if (!idpUrl || !certificate) {
      res.status(400).json({ success: false, message: 'idpUrl and certificate are required' });
      return;
    }

    const config = await service.createSAMLConfig(companyId, { idpUrl, certificate, entityId, nameIdFormat });
    res.status(200).json({ success: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create SAML config';
    res.status(500).json({ success: false, message });
  }
};

export const getConfig = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;

    const config = await service.getSAMLConfig(companyId);
    res.status(200).json({ success: true, config });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get SAML config';
    res.status(500).json({ success: false, message });
  }
};

export const testConnection = async (req: Request, res: Response) => {
  try {
    const { idpUrl, certificate, entityId, nameIdFormat } = req.body;
    if (!idpUrl || !certificate) {
      res.status(400).json({ success: false, message: 'idpUrl and certificate are required' });
      return;
    }

    const result = await service.testSAMLConnection({ idpUrl, certificate, entityId, nameIdFormat });
    res.status(200).json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to test SAML connection';
    res.status(500).json({ success: false, message });
  }
};

export const deleteConfig = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const companyId = user.companyId as string;

    await service.disableSAML(companyId);
    res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete SAML config';
    res.status(500).json({ success: false, message });
  }
};

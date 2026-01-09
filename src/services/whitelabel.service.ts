import { PrismaClient, WhiteLabelConfig, WhiteLabelStatus } from '@prisma/client';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import dns from 'dns/promises';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export type WhiteLabelConfigInput = Partial<Pick<WhiteLabelConfig,
  | 'customDomain'
  | 'primaryColor'
  | 'secondaryColor'
  | 'fontFamily'
  | 'headerText'
  | 'footerText'
  | 'removedBranding'
  | 'customHelpCenterUrl'
  | 'status'
>>;

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

const getS3Client = (): S3Client | null => {
  if (!process.env.AWS_S3_BUCKET || !process.env.AWS_REGION) return null;
  return new S3Client({ region: process.env.AWS_REGION });
};

const getPublicUrl = (key: string): string => {
  if (process.env.AWS_S3_PUBLIC_URL_BASE) {
    return `${process.env.AWS_S3_PUBLIC_URL_BASE.replace(/\/$/, '')}/${key}`;
  }

  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  if (bucket && region) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  const base = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
  return `${base.replace(/\/$/, '')}/uploads/${key}`;
};

const safeExt = (mimetype: string): string => {
  if (mimetype === 'image/png') return 'png';
  if (mimetype === 'image/svg+xml') return 'svg';
  if (mimetype === 'image/x-icon' || mimetype === 'image/vnd.microsoft.icon') return 'ico';
  if (mimetype === 'image/jpeg') return 'jpg';
  return 'bin';
};

export class WhiteLabelService {
  async createWhiteLabelConfig(companyId: string, config: WhiteLabelConfigInput) {
    const result = await prisma.whiteLabelConfig.upsert({
      where: { companyId },
      create: {
        companyId,
        ...config,
      },
      update: {
        ...config,
      },
    });

    if (typeof config.customDomain !== 'undefined') {
      await prisma.company.update({
        where: { id: companyId },
        data: {
          customDomain: config.customDomain || null,
          whitelabelStatus: config.customDomain ? WhiteLabelStatus.PENDING : WhiteLabelStatus.INACTIVE,
        },
      });
    }

    return result;
  }

  async updateWhiteLabelConfig(configId: string, updates: WhiteLabelConfigInput) {
    const updated = await prisma.whiteLabelConfig.update({
      where: { id: configId },
      data: updates,
    });

    if (typeof updates.customDomain !== 'undefined' || typeof updates.status !== 'undefined') {
      await prisma.company.update({
        where: { id: updated.companyId },
        data: {
          customDomain: updated.customDomain || null,
          whitelabelStatus: updated.status,
        },
      });
    }

    return updated;
  }

  async getWhiteLabelConfig(companyId: string) {
    return prisma.whiteLabelConfig.findUnique({ where: { companyId } });
  }

  async getWhiteLabelConfigByDomain(domain: string) {
    return prisma.whiteLabelConfig.findFirst({
      where: { customDomain: domain, status: WhiteLabelStatus.ACTIVE },
    });
  }

  async uploadLogo(configId: string, file: UploadedFile) {
    const ext = safeExt(file.mimetype);
    const key = `whitelabel/${configId}/logo-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    const s3 = getS3Client();

    if (s3) {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
    } else {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(path.join(uploadsDir, path.dirname(key)), { recursive: true });
      await fs.writeFile(path.join(uploadsDir, key), file.buffer);
    }

    const url = getPublicUrl(key);

    await prisma.whiteLabelConfig.update({
      where: { id: configId },
      data: { logoUrl: url },
    });

    return { url };
  }

  async uploadFavicon(configId: string, file: UploadedFile) {
    const ext = safeExt(file.mimetype);
    const key = `whitelabel/${configId}/favicon-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;

    const s3 = getS3Client();

    if (s3) {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET!,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
    } else {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.mkdir(path.join(uploadsDir, path.dirname(key)), { recursive: true });
      await fs.writeFile(path.join(uploadsDir, key), file.buffer);
    }

    const url = getPublicUrl(key);

    await prisma.whiteLabelConfig.update({
      where: { id: configId },
      data: { faviconUrl: url },
    });

    return { url };
  }

  generateCNAMERecord(customDomain: string) {
    const target = process.env.WHITELABEL_CNAME_TARGET || process.env.FRONTEND_URL || 'app.example.com';
    return {
      name: customDomain,
      type: 'CNAME',
      value: target.replace(/^https?:\/\//, ''),
    };
  }

  async verifyDomain(customDomain: string) {
    const target = (process.env.WHITELABEL_CNAME_TARGET || process.env.FRONTEND_URL || '').replace(/^https?:\/\//, '');
    if (!target) {
      throw new Error('WHITELABEL_CNAME_TARGET or FRONTEND_URL must be set');
    }

    try {
      const cnames = await dns.resolveCname(customDomain);
      const verified = cnames.some((c) => c.replace(/\.$/, '') === target.replace(/\.$/, ''));
      return { verified, cnames };
    } catch (error) {
      return { verified: false, cnames: [] as string[] };
    }
  }

  async provisionalSSLCert(customDomain: string) {
    return {
      status: 'PENDING',
      provider: "letsencrypt",
      domain: customDomain,
      message: 'SSL provisioning is handled by the edge provider (e.g., Vercel/Railway/Cloudflare).',
    };
  }

  async deleteWhiteLabelConfig(configId: string) {
    const existing = await prisma.whiteLabelConfig.findUnique({ where: { id: configId } });
    if (!existing) return true;

    await prisma.$transaction([
      prisma.whiteLabelConfig.delete({ where: { id: configId } }),
      prisma.company.update({
        where: { id: existing.companyId },
        data: { customDomain: null, whitelabelStatus: WhiteLabelStatus.INACTIVE },
      }),
    ]);

    return true;
  }
}

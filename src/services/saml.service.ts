import { PrismaClient, SAMLStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateSAMLConfigInput {
  idpUrl: string;
  certificate: string;
  entityId?: string;
  nameIdFormat?: string;
}

export class SAMLService {
  async createSAMLConfig(companyId: string, input: CreateSAMLConfigInput) {
    const config = await prisma.sAMLConfig.upsert({
      where: { companyId },
      create: {
        companyId,
        idpUrl: input.idpUrl,
        certificate: input.certificate,
        entityId: input.entityId ?? null,
        nameIdFormat: input.nameIdFormat ?? null,
        status: SAMLStatus.ACTIVE,
      },
      update: {
        idpUrl: input.idpUrl,
        certificate: input.certificate,
        entityId: input.entityId ?? null,
        nameIdFormat: input.nameIdFormat ?? null,
        status: SAMLStatus.ACTIVE,
      },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { samlEnabled: true },
    });

    return config;
  }

  async getSAMLConfig(companyId: string) {
    return prisma.sAMLConfig.findUnique({ where: { companyId } });
  }

  generateServiceProviderMetadata(companyId: string) {
    const entityId = process.env.SAML_SP_ENTITY_ID || `urn:scaca:sp:${companyId}`;
    const acsUrl =
      process.env.SAML_ASSERTION_CONSUMER_URL ||
      `${(process.env.API_PUBLIC_URL || 'http://localhost:3001').replace(/\/$/, '')}/api/auth/saml/assertion`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="1" isDefault="true" />
  </SPSSODescriptor>
</EntityDescriptor>`;
  }

  verifySAMLAssertion(assertion: string) {
    const xml = Buffer.from(assertion, 'base64').toString('utf8');

    const nameIdMatch = xml.match(/<[^:>]*:?NameID[^>]*>([^<]+)<\//);
    const email = nameIdMatch?.[1]?.trim();

    if (!email) {
      throw new Error('Invalid SAML assertion: missing NameID');
    }

    return { email, raw: xml };
  }

  async authenticateWithSAML(companyId: string, assertion: string) {
    const { email } = this.verifySAMLAssertion(assertion);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return existing;

    const user = await prisma.user.create({
      data: {
        email,
        password: 'SAML',
        name: email.split('@')[0] || email,
        role: 'COORDINATOR',
        companyId,
      },
    });

    return user;
  }

  async disableSAML(companyId: string) {
    await prisma.$transaction([
      prisma.sAMLConfig.deleteMany({ where: { companyId } }),
      prisma.company.update({ where: { id: companyId }, data: { samlEnabled: false } }),
    ]);
    return true;
  }

  async testSAMLConnection(config: CreateSAMLConfigInput) {
    try {
      const res = await fetch(config.idpUrl, { method: 'GET' });
      return { ok: res.ok, status: res.status };
    } catch (error) {
      return { ok: false, status: 0 };
    }
  }
}

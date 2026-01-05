import { PrismaClient } from '@prisma/client';
import * as samlify from 'samlify';

const prisma = new PrismaClient();

interface SAMLConfigInput {
  idpUrl: string;
  certificate: string;
  entityId: string;
}

export const getSAMLConfig = async (companyId: string) => {
  try {
    const config = await prisma.sAMLConfig.findUnique({
      where: { companyId },
    });

    return config;
  } catch (error) {
    console.error('Error fetching SAML config:', error);
    throw new Error('Failed to fetch SAML configuration');
  }
};

export const setSAMLConfig = async (companyId: string, config: SAMLConfigInput) => {
  try {
    // Check if company has enterprise tier
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { subscriptionTier: true },
    });

    if (company?.subscriptionTier !== 'enterprise') {
      throw new Error('SAML SSO requires enterprise tier');
    }

    // Validate certificate format
    if (!config.certificate.includes('BEGIN CERTIFICATE')) {
      throw new Error('Invalid certificate format. Must be PEM format.');
    }

    // Validate IDP URL
    if (!config.idpUrl.startsWith('https://')) {
      throw new Error('Identity Provider URL must use HTTPS');
    }

    // Upsert the configuration
    const updated = await prisma.sAMLConfig.upsert({
      where: { companyId },
      update: {
        idpUrl: config.idpUrl,
        certificate: config.certificate,
        entityId: config.entityId,
        status: 'active',
        updatedAt: new Date(),
      },
      create: {
        companyId,
        idpUrl: config.idpUrl,
        certificate: config.certificate,
        entityId: config.entityId,
        status: 'active',
      },
    });

    return updated;
  } catch (error) {
    console.error('Error setting SAML config:', error);
    throw error;
  }
};

export const deleteSAMLConfig = async (companyId: string) => {
  try {
    await prisma.sAMLConfig.delete({
      where: { companyId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting SAML config:', error);
    throw error;
  }
};

export const validateSAMLAssertion = async (assertion: string, companyId: string) => {
  try {
    const config = await getSAMLConfig(companyId);

    if (!config || config.status !== 'active') {
      throw new Error('SAML not configured for this company');
    }

    // Create identity provider
    const idp = samlify.IdentityProvider({
      metadata: `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.entityId}">
  <IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${config.idpUrl}"/>
  </IDPSSODescriptor>
</EntityDescriptor>`,
    });

    // Create service provider
    const sp = samlify.ServiceProvider({
      entityID: 'supply-chain-ai',
      authnRequestsSigned: false,
      wantAssertionsSigned: true,
      wantMessageSigned: true,
      wantLogoutResponseSigned: true,
      wantLogoutRequestSigned: true,
      assertionConsumerService: [{
        Binding: samlify.Constants.namespace.binding.post,
        Location: `${process.env.API_URL}/api/auth/saml/callback`,
      }],
    });

    // Parse and validate the assertion
    const result = await sp.parseLoginResponse(idp, 'post', { body: { SAMLResponse: assertion } });

    return {
      success: true,
      email: result.extract.nameID,
      attributes: result.extract.attributes,
    };
  } catch (error) {
    console.error('Error validating SAML assertion:', error);
    throw new Error('Invalid SAML assertion');
  }
};

export const generateSAMLMetadata = (companyId: string) => {
  const sp = samlify.ServiceProvider({
    entityID: `supply-chain-ai-${companyId}`,
    authnRequestsSigned: false,
    wantAssertionsSigned: true,
    assertionConsumerService: [{
      Binding: samlify.Constants.namespace.binding.post,
      Location: `${process.env.API_URL}/api/auth/saml/callback`,
    }],
  });

  return sp.getMetadata();
};

export const isSAMLEnabled = async (companyId: string): Promise<boolean> => {
  try {
    const config = await prisma.sAMLConfig.findUnique({
      where: { companyId },
    });

    return config?.status === 'active';
  } catch (error) {
    console.error('Error checking SAML status:', error);
    return false;
  }
};

import { authenticator } from 'otplib';
import QRCode from 'qrcode';

export interface TwoFactorSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export const generateTwoFactorSetup = async (
  email: string,
  issuer: string = process.env.TOTP_ISSUER || 'Supply Chain AI'
): Promise<TwoFactorSetup> => {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return { secret, otpauthUrl, qrCodeDataUrl };
};

export const verifyTotp = (token: string, secret: string): boolean => {
  return authenticator.verify({ token, secret });
};

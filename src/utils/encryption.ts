import crypto from 'crypto';

const parseKey = (): Buffer => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    const fallback = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    return crypto.createHash('sha256').update(fallback).digest();
  }

  const trimmed = raw.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  try {
    const buf = Buffer.from(trimmed, 'base64');
    if (buf.length === 32) return buf;
  } catch {
    // fallthrough
  }

  throw new Error('ENCRYPTION_KEY must be 32 bytes (base64) or 64 hex chars');
};

const KEY = parseKey();

export const encryptString = (plaintext: string): string => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
};

export const decryptString = (ciphertext: string): string => {
  const [ivB64, tagB64, dataB64] = ciphertext.split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
};

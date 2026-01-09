import crypto from 'crypto';

const ALGO = 'aes-256-gcm';

const getKey = (): Buffer | null => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) return null;

  // Accept base64 key or raw string
  try {
    const buf = Buffer.from(key, 'base64');
    if (buf.length === 32) return buf;
  } catch {
    // ignore
  }

  const buf = Buffer.from(key);
  if (buf.length === 32) return buf;

  console.warn('ENCRYPTION_KEY must be 32 bytes (or base64-encoded 32 bytes). Falling back to insecure encoding.');
  return null;
};

export const encryptString = (plaintext: string): string => {
  const key = getKey();
  if (!key) {
    return `insecure:${Buffer.from(plaintext, 'utf8').toString('base64')}`;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
};

export const decryptString = (payload: string): string => {
  if (payload.startsWith('insecure:')) {
    return Buffer.from(payload.replace('insecure:', ''), 'base64').toString('utf8');
  }

  const key = getKey();
  if (!key) {
    throw new Error('ENCRYPTION_KEY missing; cannot decrypt secure payload');
  }

  const [version, ivB64, tagB64, dataB64] = payload.split(':');
  if (version !== 'v1' || !ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
};

export const generateBackupCodes = (count: number = 10): string[] => {
  return Array.from({ length: count }).map(() => crypto.randomBytes(5).toString('hex'));
};

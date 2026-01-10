import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Generate a set of random backup codes
 * @param count - Number of codes to generate
 * @returns Array of plain text backup codes
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 8-character hex code
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
};

/**
 * Hash backup codes for secure storage
 * @param codes - Array of plain text codes
 * @returns Promise resolving to an array of hashed codes
 */
export const hashBackupCodes = async (codes: string[]): Promise<string[]> => {
  return Promise.all(codes.map(code => bcrypt.hash(code, 10)));
};

/**
 * Verify a backup code against hashed versions
 * @param code - The plain text code to verify
 * @param hashedCodes - Array of hashed codes from the database
 * @returns Promise resolving to the index of the matched code, or -1 if not found
 */
export const verifyBackupCode = async (code: string, hashedCodes: string[]): Promise<number> => {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await bcrypt.compare(code.toUpperCase(), hashedCodes[i]);
    if (isValid) {
      return i;
    }
  }
  return -1;
};

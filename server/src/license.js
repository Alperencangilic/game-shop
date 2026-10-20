import crypto from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateLicenseKey() {
  const chars = Array.from(crypto.randomBytes(15), (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `GS-${chars.slice(0, 5)}-${chars.slice(5, 10)}-${chars.slice(10, 15)}`;
}

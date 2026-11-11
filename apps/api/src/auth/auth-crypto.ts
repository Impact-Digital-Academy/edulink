import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

// A 6-digit code from the operating system's secure random generator.
export function generateLoginCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

// Keyed hash of the code, bound to the email so a code cannot be moved to another address.
export function hashLoginCode(secret: string, email: string, code: string): string {
  return createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');
}

// Compares two strings in constant time.
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

// 256 bits of randomness, URL-safe.
export function generateRefreshToken(): string {
  return randomBytes(32).toString('base64url');
}

// Refresh tokens are random, so a plain fast hash is enough. The database stores only this.
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

import { describe, expect, it } from 'vitest';
import {
  generateLoginCode,
  generateRefreshToken,
  hashLoginCode,
  hashToken,
  safeEqual,
} from './auth-crypto.js';

describe('auth crypto helpers', () => {
  it('generates 6-digit codes, including ones with leading zeros', () => {
    const codes = Array.from({ length: 2000 }, () => generateLoginCode());
    for (const code of codes) {
      expect(code).toMatch(/^\d{6}$/);
    }
    expect(new Set(codes).size).toBeGreaterThan(1500);
  });

  it('hashes a code the same way every time, and differently per email or secret', () => {
    const secret = 's'.repeat(40);
    const a = hashLoginCode(secret, 'ada@example.com', '123456');
    expect(hashLoginCode(secret, 'ada@example.com', '123456')).toBe(a);
    expect(hashLoginCode(secret, 'bola@example.com', '123456')).not.toBe(a);
    expect(hashLoginCode('t'.repeat(40), 'ada@example.com', '123456')).not.toBe(a);
    expect(a).not.toContain('123456');
  });

  it('compares strings safely', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });

  it('generates unique long refresh tokens and stores only their hash', () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(43);
    expect(hashToken(first)).toBe(hashToken(first));
    expect(hashToken(first)).not.toBe(first);
  });
});

import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation.js';

const SECRET_A = 'a'.repeat(40);
const SECRET_B = 'b'.repeat(40);

function validConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    NODE_ENV: 'development',
    PORT: '3000',
    DATABASE_URL: 'postgresql://user:dbpassword@localhost:5432/test',
    JWT_ACCESS_SECRET: SECRET_A,
    AUTH_CODE_SECRET: SECRET_B,
    EMAIL_PROVIDER: 'console',
    ...overrides,
  };
}

function messageOf(config: Record<string, unknown>): string {
  try {
    validateEnv(config);
  } catch (error) {
    return error instanceof Error ? error.message : '';
  }
  return '';
}

describe('validateEnv', () => {
  it('accepts a valid configuration', () => {
    expect(validateEnv(validConfig()).PORT).toBe(3000);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv(validConfig({ NODE_ENV: 'banana' }))).toThrow();
  });

  it('rejects an invalid PORT', () => {
    expect(() => validateEnv(validConfig({ PORT: '99999' }))).toThrow();
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv(validConfig({ DATABASE_URL: '' }))).toThrow(/DATABASE_URL/);
  });

  it('rejects a DATABASE_URL that is not PostgreSQL', () => {
    expect(() => validateEnv(validConfig({ DATABASE_URL: 'mysql://u:p@h/db' }))).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejects secrets that are missing or too short', () => {
    expect(() => validateEnv(validConfig({ JWT_ACCESS_SECRET: '' }))).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => validateEnv(validConfig({ AUTH_CODE_SECRET: 'short' }))).toThrow(/AUTH_CODE_SECRET/);
  });

  it('rejects two secrets that are the same value', () => {
    expect(() => validateEnv(validConfig({ AUTH_CODE_SECRET: SECRET_A }))).toThrow(/different/);
  });

  it('never leaks a secret or the database password in an error message', () => {
    const messages = [
      messageOf(validConfig({ DATABASE_URL: 'mysql://user:dbpassword@h/db' })),
      messageOf(validConfig({ JWT_ACCESS_SECRET: 'tooshort-secret-value' })),
      messageOf(validConfig({ AUTH_CODE_SECRET: SECRET_A })),
    ];
    for (const message of messages) {
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toContain('dbpassword');
      expect(message).not.toContain('tooshort-secret-value');
      expect(message).not.toContain(SECRET_A);
    }
  });

  it('does not allow the console email provider in production', () => {
    expect(() => validateEnv(validConfig({ NODE_ENV: 'production' }))).toThrow(/production/);
  });

  it('requires brevo settings when brevo is chosen', () => {
    const base = { EMAIL_PROVIDER: 'brevo' };
    expect(() => validateEnv(validConfig(base))).toThrow(/BREVO_API_KEY/);
    expect(() => validateEnv(validConfig({ ...base, BREVO_API_KEY: 'k' }))).toThrow(
      /EMAIL_FROM_ADDRESS/,
    );
    expect(
      validateEnv(
        validConfig({ ...base, BREVO_API_KEY: 'k', EMAIL_FROM_ADDRESS: 'no-reply@example.com' }),
      ).EMAIL_PROVIDER,
    ).toBe('brevo');
  });
});

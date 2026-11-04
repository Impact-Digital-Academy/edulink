import { describe, expect, it } from 'vitest';
import { validateEnv } from './env.validation.js';

const validDatabaseUrl = 'postgresql://user:secret@localhost:5432/test';

describe('validateEnv', () => {
  it('accepts a valid configuration', () => {
    const result = validateEnv({
      NODE_ENV: 'development',
      PORT: '3000',
      DATABASE_URL: validDatabaseUrl,
    });
    expect(result.PORT).toBe(3000);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ NODE_ENV: 'banana', DATABASE_URL: validDatabaseUrl })).toThrow();
  });

  it('rejects an invalid PORT', () => {
    expect(() => validateEnv({ PORT: '99999', DATABASE_URL: validDatabaseUrl })).toThrow();
  });

  it('rejects a missing DATABASE_URL', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).toThrow(/DATABASE_URL/);
  });

  it('rejects a DATABASE_URL that is not PostgreSQL', () => {
    expect(() => validateEnv({ DATABASE_URL: 'mysql://user:secret@localhost/db' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('never leaks the database password in an error message', () => {
    let message = '';
    try {
      validateEnv({ DATABASE_URL: 'mysql://user:secret@localhost/db' });
    } catch (error) {
      message = error instanceof Error ? error.message : '';
    }
    expect(message).toContain('DATABASE_URL');
    expect(message).not.toContain('secret');
  });
});

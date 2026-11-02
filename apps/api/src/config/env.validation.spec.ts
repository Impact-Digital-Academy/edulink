import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('accepts a valid configuration', () => {
    const result = validateEnv({ NODE_ENV: 'development', PORT: '3000' });
    expect(result.PORT).toBe(3000);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ NODE_ENV: 'banana' })).toThrow();
  });

  it('rejects an invalid PORT', () => {
    expect(() => validateEnv({ PORT: '99999' })).toThrow();
  });
});
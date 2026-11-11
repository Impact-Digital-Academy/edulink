function readText(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
}

// Error messages name the setting but never include its value, because values are secrets.
function requireSecret(config: Record<string, unknown>, name: string): string {
  const value = readText(config[name], '');
  if (value.length < 32) {
    throw new Error(`${name} must be set to a random value of at least 32 characters`);
  }
  return value;
}

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const nodeEnv = readText(config.NODE_ENV, 'development');
  if (!['development', 'test', 'staging', 'production'].includes(nodeEnv)) {
    throw new Error(
      `NODE_ENV must be development, test, staging or production (got "${nodeEnv}")`,
    );
  }

  const port = Number(readText(config.PORT, '3000'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a whole number between 1 and 65535');
  }

  const databaseUrl = readText(config.DATABASE_URL, '');
  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    throw new Error('DATABASE_URL must be set to a PostgreSQL connection string');
  }

  const jwtAccessSecret = requireSecret(config, 'JWT_ACCESS_SECRET');
  const authCodeSecret = requireSecret(config, 'AUTH_CODE_SECRET');
  if (jwtAccessSecret === authCodeSecret) {
    throw new Error('JWT_ACCESS_SECRET and AUTH_CODE_SECRET must be different values');
  }

  const emailProvider = readText(config.EMAIL_PROVIDER, nodeEnv === 'production' ? 'brevo' : 'console');
  if (!['console', 'brevo'].includes(emailProvider)) {
    throw new Error('EMAIL_PROVIDER must be console or brevo');
  }
  if (emailProvider === 'console' && nodeEnv === 'production') {
    throw new Error('EMAIL_PROVIDER=console is not allowed in production');
  }
  if (emailProvider === 'brevo') {
    if (readText(config.BREVO_API_KEY, '') === '') {
      throw new Error('BREVO_API_KEY must be set when EMAIL_PROVIDER is brevo');
    }
    if (!readText(config.EMAIL_FROM_ADDRESS, '').includes('@')) {
      throw new Error('EMAIL_FROM_ADDRESS must be set when EMAIL_PROVIDER is brevo');
    }
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_ACCESS_SECRET: jwtAccessSecret,
    AUTH_CODE_SECRET: authCodeSecret,
    EMAIL_PROVIDER: emailProvider,
    EMAIL_FROM_NAME: readText(config.EMAIL_FROM_NAME, 'EduLink'),
  };
}

function readText(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim() !== '') return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
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

  // Never include the value in the message: it contains the database password.
  const databaseUrl = readText(config.DATABASE_URL, '');
  if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    throw new Error('DATABASE_URL must be set to a PostgreSQL connection string');
  }

  return { ...config, NODE_ENV: nodeEnv, PORT: port, DATABASE_URL: databaseUrl };
}

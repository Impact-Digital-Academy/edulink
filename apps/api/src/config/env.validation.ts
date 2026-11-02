export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const nodeEnv = String(config.NODE_ENV ?? 'development');
  if (!['development', 'test', 'staging', 'production'].includes(nodeEnv)) {
    throw new Error(
      `NODE_ENV must be development, test, staging or production (got "${nodeEnv}")`,
    );
  }

  const port = Number(config.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a whole number between 1 and 65535');
  }

  return { ...config, NODE_ENV: nodeEnv, PORT: port };
}
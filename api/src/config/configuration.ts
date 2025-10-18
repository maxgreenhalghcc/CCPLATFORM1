export default () => {
  const corsOriginsRaw = process.env.CORS_ORIGINS ?? '';
  const corsOrigins = corsOriginsRaw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.API_PORT ?? '4000', 10),
    logLevel: process.env.LOG_LEVEL ?? 'info',
    databaseUrl: process.env.DATABASE_URL ?? '',
    cors: {
      origins: corsOrigins,
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
      max: parseInt(process.env.RATE_LIMIT_MAX ?? '120', 10),
    },
    seedOnBoot: (process.env.SEED_ON_BOOT ?? 'true').toLowerCase() !== 'false',
    jwt: {
      secret: process.env.JWT_SECRET ?? 'secret',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? '3600', 10),
      refreshExpiresIn: parseInt(process.env.REFRESH_EXPIRES_IN ?? '604800', 10),
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ?? '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    },
    nextAuth: {
      secret: process.env.NEXTAUTH_SECRET ?? '',
    },
    recipeService: {
      url: process.env.RECIPE_SERVICE_URL ?? 'http://localhost:5000',
      secret: process.env.RECIPE_SERVICE_JWT_SECRET ?? '',
      audience: process.env.RECIPE_SERVICE_JWT_AUDIENCE ?? 'recipe-engine',
      issuer: process.env.RECIPE_SERVICE_JWT_ISSUER ?? 'custom-cocktails-api',
    },
    sentry: {
      dsn:
        process.env.SENTRY_DSN ??
        process.env.SENTRY_DSN_API ??
        process.env.SENTRY_DSN_BACKEND ??
        '',
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    },
    features: {
      enablePayment: (process.env.FEATURE_ENABLE_PAYMENT ?? 'true').toLowerCase() !== 'false',
      showBetaBadge: (process.env.FEATURE_SHOW_BETA_BADGE ?? 'false').toLowerCase() === 'true',
    },
  };
};

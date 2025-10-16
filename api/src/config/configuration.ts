export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwt: {
    secret: process.env.JWT_SECRET ?? 'secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? '3600', 10),
    refreshExpiresIn: parseInt(process.env.REFRESH_EXPIRES_IN ?? '604800', 10)
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? ''
  },
  authGuard: {
    enabled: (process.env.AUTH_GUARD_ENABLED ?? 'false').toLowerCase() === 'true',
    header: process.env.AUTH_GUARD_HEADER ?? 'x-staff-token',
    token: process.env.AUTH_GUARD_TOKEN ?? ''
  },
  recipeService: {
    url: process.env.RECIPE_SERVICE_URL ?? 'http://localhost:5000',
    secret: process.env.RECIPE_SERVICE_JWT_SECRET ?? '',
    audience: process.env.RECIPE_SERVICE_JWT_AUDIENCE ?? 'recipe-engine',
    issuer: process.env.RECIPE_SERVICE_JWT_ISSUER ?? 'custom-cocktails-api'
  }
});

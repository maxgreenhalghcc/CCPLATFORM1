import * as Joi from 'joi';

const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  API_PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().uri().required(),
  LOG_LEVEL: Joi.string()
    .valid(...logLevels)
    .default('info'),
  CORS_ORIGINS: Joi.string().allow(''),
  RATE_LIMIT_MAX: Joi.number().integer().min(1).default(120),
  RATE_LIMIT_WINDOW_MS: Joi.number().integer().min(1000).default(60000),
  SEED_ON_BOOT: Joi.boolean().default(true),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.number().default(3600),
  REFRESH_EXPIRES_IN: Joi.number().default(604800),
  STRIPE_SECRET_KEY: Joi.string().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow(''),
  NEXTAUTH_SECRET: Joi.string().min(16).required(),
  RECIPE_SERVICE_URL: Joi.string().uri().default('http://localhost:5000'),
  RECIPE_SERVICE_JWT_SECRET: Joi.string().allow(''),
  RECIPE_SERVICE_JWT_AUDIENCE: Joi.string().default('recipe-engine'),
  RECIPE_SERVICE_JWT_ISSUER: Joi.string().default('custom-cocktails-api'),
});

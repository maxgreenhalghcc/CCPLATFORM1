import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  API_PORT: Joi.number().default(4000),
  DATABASE_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.number().default(3600),
  REFRESH_EXPIRES_IN: Joi.number().default(604800),
  STRIPE_SECRET_KEY: Joi.string().allow(''),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow(''),
  AUTH_GUARD_ENABLED: Joi.boolean().default(false),
  AUTH_GUARD_HEADER: Joi.string().default('x-staff-token'),
  AUTH_GUARD_TOKEN: Joi.string().allow(''),
  RECIPE_SERVICE_URL: Joi.string().uri().default('http://localhost:5000'),
  RECIPE_SERVICE_JWT_SECRET: Joi.string().allow(''),
  RECIPE_SERVICE_JWT_AUDIENCE: Joi.string().default('recipe-engine'),
  RECIPE_SERVICE_JWT_ISSUER: Joi.string().default('custom-cocktails-api')
});

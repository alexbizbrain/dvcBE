import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  // auth (future)
  JWT_SECRET: Joi.string().optional(),

  // database (kept optional since we're not touching Prisma now)
  DATABASE_URL: Joi.string().uri().optional(),
});

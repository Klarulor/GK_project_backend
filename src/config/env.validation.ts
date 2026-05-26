import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().port().default(3000),
  HOST: Joi.string().hostname().default("0.0.0.0"),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow("").required(),
  DB_NAME: Joi.string().required(),

  TELEGRAM_BOT_TOKEN: Joi.string().allow("").optional(),
  TELEGRAM_ADMIN_ID: Joi.string().allow("").optional(),
  DISCORD_WEBHOOK_URL: Joi.string().allow("").optional(),

  JWT_SECRET_KEY: Joi.string().required(),

  MOCK_DEVICES: Joi.boolean().default(false),
});

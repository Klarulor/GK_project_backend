import * as process from "node:process";

export const IS_PRODUCTION = () => process.env.NODE_ENV === "production";
export default () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT!, 10) || 5432,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? "",
    name: process.env.DB_NAME,
  },
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    adminId: process.env.TELEGRAM_ADMIN_ID,
  },
  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL,
  },
  security: {
    jwtKey: process.env.JWT_SECRET_KEY,
  },

  mockDevices: process.env.MOCK_DEVICES === "true"
});

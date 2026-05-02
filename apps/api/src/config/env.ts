import 'dotenv/config';
import { z } from 'zod';

// ─── Environment Schema ───────────────────────────────
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Database
  DATABASE_URL: z
    .string()
    .default('postgres://iot_admin:iot_secret@localhost:5432/iot_platform'),

  // Redis & MQTT
  REDIS_URL: z.string().default('redis://localhost:6379'),
  MQTT_URL: z.string().default('mqtt://localhost:1883'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32).default('super_secret_access_key_at_least_32_chars!!'),
  JWT_REFRESH_SECRET: z.string().min(32).default('super_secret_refresh_key_at_least_32_chars!'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Cookie
  COOKIE_SECRET: z.string().default('cookie_secret_key_change_in_production'),
});

// ─── Parse & export typed env ────────────────────────
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:');
  console.error(_env.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _env.data;
export type Env = typeof env;

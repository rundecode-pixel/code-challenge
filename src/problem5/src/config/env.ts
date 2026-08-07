// Boot-time configuration gate. Importing this module validates the
// environment up front and aborts with a readable error instead of letting
// a bad value surface later as an unrelated 500.
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters'),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('[env] configuration rejected:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

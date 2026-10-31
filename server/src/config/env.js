import 'dotenv/config';
import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  SERVICE_NAME: z.string().min(1).default('brightloop-subscription-server'),
  MONGO_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/brightloop_subscription'),
  MONGO_TEST_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/brightloop_subscription_test')
});

const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map(({ path, message }) => `${path.join('.')}: ${message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = result.data;

import { createHash, randomBytes } from 'node:crypto';

export function createResetToken() {
  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

export function hashResetToken(rawToken) {
  return createHash('sha256').update(rawToken).digest('hex');
}

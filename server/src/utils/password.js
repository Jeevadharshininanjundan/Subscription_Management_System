import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export const PASSWORD_POLICY_MESSAGE =
  'Password must be more than eight characters and include uppercase, lowercase, and special characters.';

export function isValidPassword(password) {
  return typeof password === 'string'
    && password.length > 8
    && /[A-Z]/.test(password)
    && /[a-z]/.test(password)
    && /[^A-Za-z0-9]/.test(password);
}

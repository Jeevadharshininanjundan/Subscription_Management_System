import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { comparePassword, hashPassword } from '../utils/password.js';
import { createResetToken, hashResetToken } from '../utils/crypto.js';
import { sendPasswordResetEmail } from './mail.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export function safeUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    customerId: user.customerId?.toString() || null,
    status: user.status,
    createdAt: user.createdAt
  };
}

export async function registerCustomer({ email, password, name }) {
  const customer = await Customer.create({ name, primaryEmail: email });
  try {
    const user = await User.create({
      email,
      passwordHash: await hashPassword(password),
      name,
      role: 'CUSTOMER',
      customerId: customer._id
    });
    await Customer.updateOne({ _id: customer._id }, { userId: user._id });
    return user;
  } catch (error) {
    await Customer.deleteOne({ _id: customer._id });
    throw error;
  }
}

export async function authenticate({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash +tokenVersion');
  if (!user || !(await comparePassword(password, user.passwordHash)) || user.status !== 'ACTIVE') {
    return null;
  }
  user.lastLoginAt = new Date();
  await user.save();
  return user;
}

export async function revokeUserTokens(user) {
  await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } });
}

export async function createStaff({ email, password, name }) {
  return User.create({
    email,
    passwordHash: await hashPassword(password),
    name,
    role: 'STAFF'
  });
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user) return;
  const { rawToken, tokenHash } = createResetToken();
  user.resetTokenHash = tokenHash;
  user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  await user.save();
  await sendPasswordResetEmail({ to: user.email, token: rawToken });
}

export async function resetPassword(rawToken, password) {
  const user = await User.findOne({
    resetTokenHash: hashResetToken(rawToken),
    resetTokenExpiresAt: { $gt: new Date() }
  }).select('+passwordHash +resetTokenHash +resetTokenExpiresAt +tokenVersion');
  if (!user) return false;
  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  user.tokenVersion += 1;
  await user.save();
  return true;
}

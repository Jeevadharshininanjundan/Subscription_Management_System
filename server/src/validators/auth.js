import { z } from 'zod';
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from '../utils/password.js';

const email = z.string().trim().toLowerCase().email();
const password = z.string().refine(isValidPassword, PASSWORD_POLICY_MESSAGE);

export const registerSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1).max(120)
});

export const loginSchema = z.object({ email, password: z.string().min(1) });
export const forgotPasswordSchema = z.object({ email });
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password
});

export const staffSchema = z.object({
  email,
  password,
  name: z.string().trim().min(1).max(120)
});

import { Router } from 'express';
import * as controller from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginLimiter, registrationLimiter, resetLimiter } from '../middleware/rateLimiters.js';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from '../validators/auth.js';

export const authRouter = Router();

authRouter.post('/register', registrationLimiter, validateBody(registerSchema), controller.register);
authRouter.post('/login', loginLimiter, validateBody(loginSchema), controller.login);
authRouter.post('/logout', requireAuth, controller.logout);
authRouter.post('/forgot-password', resetLimiter, validateBody(forgotPasswordSchema), controller.forgotPassword);
authRouter.post('/reset-password', resetLimiter, validateBody(resetPasswordSchema), controller.reset);
authRouter.get('/me', requireAuth, controller.me);

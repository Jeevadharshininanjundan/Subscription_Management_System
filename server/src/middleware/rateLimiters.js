import rateLimit from 'express-rate-limit';

const standard = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    data: null,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' }
  }
};

export const registrationLimiter = rateLimit({ ...standard, windowMs: 15 * 60 * 1000, limit: 10 });
export const loginLimiter = rateLimit({ ...standard, windowMs: 15 * 60 * 1000, limit: 10 });
export const resetLimiter = rateLimit({ ...standard, windowMs: 15 * 60 * 1000, limit: 10 });

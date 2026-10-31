import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE
  });
}

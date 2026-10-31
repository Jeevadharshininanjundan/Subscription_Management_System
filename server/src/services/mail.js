import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export function createMailTransport() {
  if (env.NODE_ENV === 'test') {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  if (!env.SMTP_HOST) {
    throw Object.assign(new Error('SMTP is not configured.'), { code: 'MAIL_NOT_CONFIGURED' });
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
      : undefined
  });
}

export async function sendPasswordResetEmail({ to, token }) {
  const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${encodeURIComponent(token)}`;
  return createMailTransport().sendMail({
    from: env.MAIL_FROM,
    to,
    subject: 'Reset your Brightloop password',
    text: `Use this link to reset your password. It expires in one hour: ${resetUrl}`
  });
}

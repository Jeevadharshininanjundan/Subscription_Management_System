import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export function createMailTransport() {
  if (env.NODE_ENV === 'test') {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
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

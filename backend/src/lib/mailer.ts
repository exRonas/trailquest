import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let smtpTransport: Transporter | null = null;

function getSmtpTransport(): Transporter | null {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  if (!smtpTransport) {
    smtpTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    });
  }
  return smtpTransport;
}

async function sendViaResend(input: SendMailInput): Promise<void> {
  if (!env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn('[mailer] RESEND_API_KEY not set — email not sent:', input.subject);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${body}`);
  }
}

async function sendViaSmtp(input: SendMailInput): Promise<void> {
  const transport = getSmtpTransport();
  if (!transport) {
    // eslint-disable-next-line no-console
    console.warn('[mailer] SMTP not configured — email not sent:', input.subject);
    return;
  }
  await transport.sendMail({
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

/** Sends through whichever provider `EMAIL_PROVIDER` selects. Never throws
 *  on missing config — logs and no-ops, so a dev box without email set up
 *  doesn't crash the password-reset flow, it just can't deliver. */
export async function sendMail(input: SendMailInput): Promise<void> {
  if (env.EMAIL_PROVIDER === 'resend') {
    await sendViaResend(input);
  } else {
    await sendViaSmtp(input);
  }
}

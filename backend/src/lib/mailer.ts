import dns from 'dns';
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { env } from '../config/env';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Two Gmail-over-SMTP-from-a-cloud-host failure modes, both seen live on
 * Render, both handled here:
 *
 *  1. nodemailer (9.x) resolves SMTP_HOST itself and picks *randomly*
 *     between every A and AAAA address (`shared/index.js`:
 *     `addresses[Math.floor(Math.random() * addresses.length)]`, re-rolled
 *     every call) — no `family` option is actually consulted. Render's
 *     containers advertise IPv6 but have no outbound IPv6 route, so a send
 *     unlucky enough to draw an AAAA address died with ENETUNREACH.
 *
 *  2. Even among the IPv4 addresses, an individual Gmail endpoint can be
 *     slow/unroutable from a given container and time out on connect
 *     (ETIMEDOUT), while sibling IPs work fine.
 *
 * So: resolve the full A-record list ourselves, and try each IP in turn
 * until one delivers. Handing nodemailer a literal IP as `host`
 * short-circuits its own resolver (`net.isIP` check), and `servername`
 * keeps STARTTLS/SNI validating against the real hostname.
 */
async function resolveSmtpIPv4List(host: string): Promise<string[]> {
  const addresses = await dns.promises.resolve4(host);
  if (addresses.length === 0) throw new Error(`No A record for ${host}`);
  // Shuffle so repeated sends don't all hammer (and all fail on) the same
  // first IP.
  for (let i = addresses.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [addresses[i], addresses[j]] = [addresses[j], addresses[i]];
  }
  return addresses;
}

function createTransport(host: string) {
  // `servername` isn't in @types/nodemailer, but the runtime reads it
  // (smtp-connection: `this.servername = this.options.servername`) — needed
  // so STARTTLS/SNI still validates against the real hostname once `host`
  // is a bare IP.
  const options: SMTPTransport.Options & { servername?: string } = {
    host,
    servername: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
    // Fail fast instead of hanging nodemailer's default multi-minute
    // timeouts, so a dead endpoint is abandoned quickly and the next IP
    // gets tried while the request handler isn't blocked.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  };
  return nodemailer.createTransport(options);
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
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) {
    // eslint-disable-next-line no-console
    console.warn('[mailer] SMTP not configured — email not sent:', input.subject);
    return;
  }

  const message = {
    from: env.MAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  };

  // Build the list of connect targets: each resolved IPv4, or the bare
  // hostname if we couldn't resolve (e.g. a dev box whose resolver blocks
  // raw A queries — nodemailer's own resolution still runs in that case).
  let hosts: string[];
  try {
    hosts = await resolveSmtpIPv4List(env.SMTP_HOST);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      `[mailer] couldn't resolve ${env.SMTP_HOST} to IPv4, falling back to hostname:`,
      err,
    );
    hosts = [env.SMTP_HOST];
  }

  let lastErr: unknown;
  for (const host of hosts) {
    const transport = createTransport(host);
    try {
      await transport.sendMail(message);
      return; // delivered
    } catch (err) {
      lastErr = err;
      // eslint-disable-next-line no-console
      console.warn(`[mailer] send via ${host} failed, trying next:`, err);
    } finally {
      transport.close();
    }
  }
  throw lastErr ?? new Error('[mailer] all SMTP endpoints failed');
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

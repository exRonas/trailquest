import dns from 'dns';
import nodemailer, { Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { env } from '../config/env';

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

let smtpTransportPromise: Promise<Transporter | null> | null = null;

/**
 * nodemailer (9.x) resolves SMTP_HOST itself via its own dual-stack DNS
 * logic, picking *randomly* between every A and AAAA address it finds
 * (`shared/index.js`: `addresses[Math.floor(Math.random() * addresses.length)]`,
 * re-rolled on every call, including cache hits) — there is no `family`
 * option it actually reads for this. Confirmed live on Render: half the
 * sends picked an IPv6 address the container has no outbound route for
 * and failed with ENETUNREACH, half picked IPv4 and worked — same host,
 * same code, different luck. Resolving the A record ourselves and handing
 * nodemailer a literal IP skips its resolver entirely (it only resolves
 * hostnames, `net.isIP(host)` short-circuits for a literal address), so
 * the flakiness goes away. `servername` keeps STARTTLS/SNI validating
 * against the real hostname despite connecting by IP.
 */
async function resolveSmtpIPv4(host: string): Promise<string> {
  const addresses = await dns.promises.resolve4(host);
  if (addresses.length === 0) throw new Error(`No A record for ${host}`);
  return addresses[Math.floor(Math.random() * addresses.length)];
}

async function getSmtpTransport(): Promise<Transporter | null> {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASSWORD) return null;
  if (!smtpTransportPromise) {
    smtpTransportPromise = resolveSmtpIPv4(env.SMTP_HOST)
      .then(
        (ip) => ip,
        (err) => {
          // eslint-disable-next-line no-console
          console.warn(
            `[mailer] couldn't pre-resolve ${env.SMTP_HOST} to IPv4, falling back to hostname (may hit the IPv6 flakiness):`,
            err,
          );
          return env.SMTP_HOST as string;
        },
      )
      .then((host) => {
        // `servername` isn't in @types/nodemailer, but the runtime reads it
        // (smtp-connection: `this.servername = this.options.servername`) —
        // needed so STARTTLS/SNI still validates against the real hostname
        // once we've replaced `host` with a bare IP.
        const options: SMTPTransport.Options & { servername?: string } = {
          host,
          servername: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
          // Without these, a slow/unresponsive step anywhere in the SMTP
          // handshake hangs nodemailer's default multi-minute timeouts —
          // which, awaited synchronously by the request handler, hangs
          // the whole HTTP request. 10s is generous for any real mail
          // server's response.
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 10_000,
        };
        return nodemailer.createTransport(options);
      });
  }
  return smtpTransportPromise;
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
  const transport = await getSmtpTransport();
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

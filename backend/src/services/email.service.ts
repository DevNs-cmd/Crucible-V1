import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

/** Maximum SMTP retry attempts on failure. */
const MAX_RETRIES = 2;

/** Delay between retries in milliseconds. */
const RETRY_DELAY_MS = 1500;

let transporter: Transporter | null = null;

/**
 * Get or create the singleton Nodemailer transporter.
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Send an email with automatic retry logic on SMTP failure.
 */
async function sendWithRetry(
  options: nodemailer.SendMailOptions,
  attempt = 1
): Promise<void> {
  try {
    await getTransporter().sendMail(options);
  } catch (err) {
    if (attempt <= MAX_RETRIES) {
      console.warn(`[EmailService] Attempt ${attempt} failed. Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return sendWithRetry(options, attempt + 1);
    }
    console.error('[EmailService] All retry attempts exhausted.', err);
    throw err;
  }
}

/**
 * Send a notification email when a new lead is created.
 */
export async function sendNewLeadEmail(
  to: string,
  leadName: string,
  company: string
): Promise<void> {
  await sendWithRetry({
    from: env.SMTP_FROM,
    to,
    subject: `New Lead Assigned: ${leadName} — ${company}`,
    html: `
      <h2>New Lead Assigned to You</h2>
      <p>A new lead has been created and assigned to your account.</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0"><strong>Name:</strong></td><td>${leadName}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Company:</strong></td><td>${company}</td></tr>
      </table>
      <p>Log in to AlgoForce AI to view full lead details.</p>
    `,
  });
}

/**
 * Send a follow-up reminder email with a list of overdue items.
 */
export async function sendFollowUpReminderEmail(
  to: string,
  followups: Array<{ leadName: string; company: string; dueAt: string; description: string }>
): Promise<void> {
  const rows = followups
    .map(
      (f) => `
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${f.leadName}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${f.company}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${new Date(f.dueAt).toLocaleDateString()}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #eee">${f.description}</td>
      </tr>`
    )
    .join('');

  await sendWithRetry({
    from: env.SMTP_FROM,
    to,
    subject: `AlgoForce AI — ${followups.length} Follow-Up${followups.length > 1 ? 's' : ''} Due Today`,
    html: `
      <h2>Follow-Up Reminders</h2>
      <p>You have ${followups.length} overdue follow-up(s) that require your attention:</p>
      <table style="border-collapse:collapse;width:100%">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px 12px;text-align:left">Lead</th>
            <th style="padding:8px 12px;text-align:left">Company</th>
            <th style="padding:8px 12px;text-align:left">Due</th>
            <th style="padding:8px 12px;text-align:left">Task</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-top:16px">Log in to AlgoForce AI to mark these as completed.</p>
    `,
  });
}

/**
 * Send a notification when a lead's status changes.
 */
export async function sendStatusChangeEmail(
  to: string,
  leadName: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await sendWithRetry({
    from: env.SMTP_FROM,
    to,
    subject: `Lead Status Updated: ${leadName}`,
    html: `
      <h2>Lead Status Changed</h2>
      <p>The following lead has been updated:</p>
      <table style="border-collapse:collapse">
        <tr><td style="padding:4px 12px 4px 0"><strong>Lead:</strong></td><td>${leadName}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>Previous Status:</strong></td><td>${oldStatus}</td></tr>
        <tr><td style="padding:4px 12px 4px 0"><strong>New Status:</strong></td><td>${newStatus}</td></tr>
      </table>
      <p>Log in to AlgoForce AI to review the lead.</p>
    `,
  });
}

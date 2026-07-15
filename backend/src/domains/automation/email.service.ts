import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../config/env';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    });
  }
  return transporter;
}

async function sendWithRetry(
  options: nodemailer.SendMailOptions,
  attempt = 1
): Promise<void> {
  try {
    await getTransporter().sendMail(options);
  } catch (err) {
    if (attempt <= MAX_RETRIES) {
      console.warn(`[EmailService] Attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return sendWithRetry(options, attempt + 1);
    }
    console.error('[EmailService] All retries exhausted.', err);
    throw err;
  }
}

/** Send new lead assignment email. */
export async function sendNewLeadEmail(to: string, leadName: string, company: string): Promise<void> {
  await sendWithRetry({
    from: env.SMTP_FROM,
    to,
    subject: `New Lead Assigned: ${leadName} — ${company}`,
    html: `<h2>New Lead Assigned</h2>
<p>A new lead has been assigned to you.</p>
<table>
  <tr><td><strong>Name:</strong></td><td>${leadName}</td></tr>
  <tr><td><strong>Company:</strong></td><td>${company}</td></tr>
</table>
<p>Log in to AlgoForce AI to view full details.</p>`,
  });
}

/** Send follow-up reminder email with a list of overdue tasks. */
export async function sendFollowUpReminderEmail(
  to: string,
  followups: Array<{ leadName: string; company: string; dueAt: string; description: string }>
): Promise<void> {
  const rows = followups.map((f) => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${f.leadName}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${f.company}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${new Date(f.dueAt).toLocaleDateString()}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #eee">${f.description}</td>
    </tr>`).join('');

  await sendWithRetry({
    from: env.SMTP_FROM,
    to,
    subject: `AlgoForce AI — ${followups.length} Follow-Up${followups.length > 1 ? 's' : ''} Due`,
    html: `<h2>Follow-Up Reminders</h2>
<p>You have ${followups.length} overdue follow-up(s):</p>
<table style="border-collapse:collapse;width:100%">
  <thead><tr style="background:#f5f5f5">
    <th style="padding:8px 12px;text-align:left">Lead</th>
    <th style="padding:8px 12px;text-align:left">Company</th>
    <th style="padding:8px 12px;text-align:left">Due</th>
    <th style="padding:8px 12px;text-align:left">Task</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>`,
  });
}

/** Send status change notification email. */
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
    html: `<h2>Lead Status Changed</h2>
<table>
  <tr><td><strong>Lead:</strong></td><td>${leadName}</td></tr>
  <tr><td><strong>Previous:</strong></td><td>${oldStatus}</td></tr>
  <tr><td><strong>New Status:</strong></td><td>${newStatus}</td></tr>
</table>`,
  });
}

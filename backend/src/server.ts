import './config/env'; // Validate env vars at startup — crashes early if invalid
import cron from 'node-cron';
import app from './app';
import { env } from './config/env';
import { getOverdueFollowUps } from './services/followups.service';
import { triggerFollowUpReminderWebhook } from './services/automation.service';

const PORT = env.PORT;

// ─── Cron Jobs ────────────────────────────────────────────────────────────────

/**
 * Daily follow-up reminder job.
 * Runs at 9:00 AM every day.
 * Only active when NODE_ENV=production or ENABLE_CRON=true.
 */
function registerCronJobs(): void {
  if (env.NODE_ENV !== 'production' && !env.ENABLE_CRON) {
    console.log('[Cron] Skipping cron registration (set ENABLE_CRON=true to enable in dev)');
    return;
  }

  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running daily follow-up reminder job...');
    try {
      const overdueFollowUps = await getOverdueFollowUps();

      if (overdueFollowUps.length === 0) {
        console.log('[Cron] No overdue follow-ups found.');
        return;
      }

      console.log(`[Cron] Found ${overdueFollowUps.length} overdue follow-up(s). Triggering n8n webhook...`);
      await triggerFollowUpReminderWebhook(overdueFollowUps);
      console.log('[Cron] Follow-up reminder webhook triggered successfully.');
    } catch (err) {
      console.error('[Cron] Follow-up reminder job failed:', err);
    }
  });

  console.log('[Cron] Daily follow-up reminder job registered (runs at 09:00 daily)');
}

// ─── Server Start ─────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       AlgoForce AI Backend               ║
║       Running on port ${PORT}              ║
║       Environment: ${env.NODE_ENV}          ║
╚══════════════════════════════════════════╝
  `);

  registerCronJobs();
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err);
  process.exit(1);
});

export default server;

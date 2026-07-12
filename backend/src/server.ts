import { initCRMEventListeners } from './services/crmEventHandlers';
import './config/env'; // validate env at startup — crash early if invalid
import cron from 'node-cron';
import app from './app';
import { env } from './config/env';
import { getOverdueFollowUps } from './services/followups.service';
import { triggerFollowUpReminderWebhook } from './services/automation.service';

const PORT = env.PORT;

// ─── Cron Jobs ────────────────────────────────────────────────────────────────

function registerCronJobs(): void {
  if (env.NODE_ENV !== 'production' && !env.ENABLE_CRON) {
    console.log('[Cron] Skipped — set ENABLE_CRON=true to enable in dev');
    return;
  }

  // Daily 9 AM follow-up reminder
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running follow-up reminder job...');
    try {
      const overdue = await getOverdueFollowUps();
      if (overdue.length === 0) {
        console.log('[Cron] No overdue follow-ups.');
        return;
      }
      console.log(`[Cron] ${overdue.length} overdue follow-up(s) — triggering n8n...`);
      await triggerFollowUpReminderWebhook(overdue);
      console.log('[Cron] Done.');
    } catch (err) {
      console.error('[Cron] Follow-up job failed:', err);
    }
  });

  console.log('[Cron] Daily follow-up reminder registered (09:00 daily)');
}

// ─── Server ───────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║     AlgoForce AI Backend             ║
║     Port: ${PORT}  Env: ${env.NODE_ENV.padEnd(11)}║
╚══════════════════════════════════════╝`);
  initCRMEventListeners();
  
  registerCronJobs();
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM — shutting down...');
  server.close(() => { console.log('[Server] Closed.'); process.exit(0); });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT — shutting down...');
  server.close(() => { console.log('[Server] Closed.'); process.exit(0); });
});

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
  process.exit(1);
});

export default server;

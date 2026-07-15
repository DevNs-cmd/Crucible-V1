process.env['NODE_ENV'] = 'test';
process.env['PORT'] = '4001';
process.env['SUPABASE_URL'] = 'https://test.supabase.co';
process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key-for-jest-only-xxxxx';
process.env['JWT_SECRET'] = 'test-jwt-secret-that-is-at-least-32-chars-long!!';
process.env['JWT_EXPIRES_IN'] = '1h';
process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
process.env['GROQ_API_KEY'] = 'gsk_test_key_for_jest_only_xxxxxxxxxxxxxxxxxxxxxxxx';
process.env['N8N_WEBHOOK_NEW_LEAD'] = 'https://n8n.test/webhook/new-lead';
process.env['N8N_WEBHOOK_STATUS_CHANGE'] = 'https://n8n.test/webhook/status-change';
process.env['N8N_WEBHOOK_FOLLOWUP_REMINDER'] = 'https://n8n.test/webhook/followup-reminder';
process.env['SMTP_HOST'] = 'smtp.test.com';
process.env['SMTP_PORT'] = '587';
process.env['SMTP_USER'] = 'test@test.com';
process.env['SMTP_PASS'] = 'test-smtp-pass';
process.env['SMTP_FROM'] = 'AlgoForce Test <test@test.com>';
process.env['ENABLE_CRON'] = 'false';

// Global mock for BullMQ to prevent connection requests in tests
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'bullmq-job-id' }),
  })),
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  })),
}));

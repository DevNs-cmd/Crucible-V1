import request from 'supertest';
import app from '../../src/app';

// Mock Supabase to avoid real DB calls in integration tests
jest.mock('../../src/config/database', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
    lte: jest.fn().mockReturnThis(),
  },
}));

describe('Health check', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('returns 422 for missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'password123' });
    expect(res.status).toBe(422);
  });

  it('returns 401 for unknown user (Supabase returns null)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'unknown@example.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('Protected routes without token', () => {
  const protectedRoutes = [
    { method: 'get', path: '/api/leads' },
    { method: 'post', path: '/api/leads' },
    { method: 'get', path: '/api/leads/some-id' },
    { method: 'get', path: '/api/auth/me' },
    { method: 'post', path: '/api/audit/generate' },
  ];

  protectedRoutes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} returns 401 without token`, async () => {
      const res = await (request(app) as unknown as Record<string, (p: string) => request.Test>)[method](path);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

describe('POST /api/audit/generate — validation', () => {
  // We need a valid token to reach validation; mock one with a known secret
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: 'test-user-id', email: 'test@example.com', role: 'member' },
    process.env['JWT_SECRET']!,
    { expiresIn: '1h' }
  );

  it('returns 422 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/audit/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for invalid budget value', async () => {
    const res = await request(app)
      .post('/api/audit/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: 'Test Co',
        industry: 'SaaS',
        companyType: 'B2B',
        companySize: '1-10',
        problems: ['Problem A'],
        currentTools: [],
        budget: 'unlimited', // invalid
      });
    expect(res.status).toBe(422);
  });
});

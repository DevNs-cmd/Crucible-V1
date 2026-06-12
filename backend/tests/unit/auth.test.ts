import { LoginSchema } from '../../src/utils/validators';

describe('Auth — LoginSchema validation', () => {
  it('accepts valid credentials', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: 'secret123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: 'secret123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors['email']).toBeDefined();
    }
  });

  it('rejects password shorter than 6 characters', () => {
    const result = LoginSchema.safeParse({ email: 'user@example.com', password: '123' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors['password']).toBeDefined();
    }
  });

  it('rejects missing fields', () => {
    const result = LoginSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('Auth — JWT middleware', () => {
  const jwt = require('jsonwebtoken');
  const secret = process.env['JWT_SECRET']!;

  it('generates a verifiable token', () => {
    const payload = { userId: 'abc-123', email: 'user@example.com', role: 'member' };
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret) as typeof payload;
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('throws on invalid token', () => {
    expect(() => jwt.verify('invalid.token.here', secret)).toThrow();
  });

  it('throws on expired token', () => {
    const token = jwt.sign({ userId: 'x' }, secret, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, secret)).toThrow(jwt.TokenExpiredError);
  });
});

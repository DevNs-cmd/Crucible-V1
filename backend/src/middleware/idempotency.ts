import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

let redis: any;

// Fallback safely to redis-mock if no local Redis server is running
if (process.env.NODE_ENV === 'development' && !process.env.REDIS_URL) {
  console.log('[Idempotency] No external Redis server detected. Initializing local in-memory mock cache...');
  const RedisMock = require('redis-mock');
  redis = RedisMock.createClient();
} else {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
}

const IDEMPOTENCY_TTL = 5 * 60; // 5 minutes cache window

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    console.warn(`[Idempotency] Missing Idempotency-Key header on ${req.method} ${req.url}`);
    return next();
  }

  const lockKey = `idempotency:lock:${idempotencyKey}`;
  const responseKey = `idempotency:response:${idempotencyKey}`;

  try {
    // In-memory mock clients use callbacks, so we wrap them cleanly in promises
    const getLock = (): Promise<string | null> => 
      new Promise((resolve) => redis.get(lockKey, (err: any, reply: any) => resolve(reply)));

    const getResponse = (): Promise<string | null> => 
      new Promise((resolve) => redis.get(responseKey, (err: any, reply: any) => resolve(reply)));

    const cachedResponse = await getResponse();
    if (cachedResponse) {
      const parsed = JSON.parse(cachedResponse);
      console.log(`[Idempotency] Serving cached response for key: ${idempotencyKey}`);
      res.status(parsed.status).json(parsed.body);
      return;
    }

    const currentLock = await getLock();
    if (currentLock === 'IN_PROGRESS') {
      res.status(409).json({
        error: 'Conflict',
        message: 'A duplicate request with this Idempotency-Key is already being processed.',
      });
      return;
    }

    // Set lock flag
    redis.set(lockKey, 'IN_PROGRESS');
    redis.expire(lockKey, 30);

    const originalJson = res.json;
    res.json = function (body: any): Response {
      res.json = originalJson;

      const cachePayload = {
        status: res.statusCode,
        body: body
      };
      
      redis.set(responseKey, JSON.stringify(cachePayload));
      redis.expire(responseKey, IDEMPOTENCY_TTL);
      redis.del(lockKey);

      return res.json(body);
    };

    next();
  } catch (error) {
    console.error('[Idempotency] Systems Error:', error);
    next(); 
  }
}
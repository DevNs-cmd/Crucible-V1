import { Request, Response, NextFunction } from 'express';
import { redisDel, redisExpire, redisGet, redisSet } from '../config/redis';

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
    const cachedResponse = await redisGet(responseKey);
    if (cachedResponse) {
      const parsed = JSON.parse(cachedResponse);
      console.log(`[Idempotency] Serving cached response for key: ${idempotencyKey}`);
      res.status(parsed.status).json(parsed.body);
      return;
    }

    const currentLock = await redisGet(lockKey);
    if (currentLock === 'IN_PROGRESS') {
      res.status(409).json({
        error: 'Conflict',
        message: 'A duplicate request with this Idempotency-Key is already being processed.',
      });
      return;
    }

    // Set lock flag
    await redisSet(lockKey, 'IN_PROGRESS');
    await redisExpire(lockKey, 30);

    const originalJson = res.json;
    res.json = function (body: any): Response {
      res.json = originalJson;

      const cachePayload = {
        status: res.statusCode,
        body: body
      };
      
      redisSet(responseKey, JSON.stringify(cachePayload))
        .then(() => redisExpire(responseKey, IDEMPOTENCY_TTL))
        .then(() => redisDel(lockKey))
        .catch((err) => console.error('[Idempotency] Cache write failed:', err));

      return res.json(body);
    };

    next();
  } catch (error) {
    console.error('[Idempotency] Systems Error:', error);
    next(); 
  }
}

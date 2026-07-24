import Redis from 'ioredis';
import { env } from './env';

type RedisCallback = (err: Error | null, reply: any) => void;

let client: any;

function createClient(): any {
  const redisUrl = process.env.REDIS_URL || env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST || env.REDIS_HOST;
  const redisPort = Number(process.env.REDIS_PORT || env.REDIS_PORT || 6379);

  if (!redisUrl && !redisHost && env.NODE_ENV !== 'production') {
    const RedisMock = require('redis-mock');
    return RedisMock.createClient();
  }

  if (redisUrl) {
    return new Redis(redisUrl);
  }

  return new Redis({
    host: redisHost || '127.0.0.1',
    port: redisPort,
  });
}

export function getRedisClient(): any {
  if (!client) {
    client = createClient();
  }

  return client;
}

function callRedis<T>(method: string, ...args: any[]): Promise<T> {
  const redis = getRedisClient();

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const done: RedisCallback = (err, reply) => {
      if (settled) return;
      settled = true;
      if (err) {
        reject(err);
        return;
      }
      resolve(reply as T);
    };

    try {
      const result = redis[method](...args, done);
      if (result && typeof result.then === 'function') {
        result.then((reply: T) => {
          if (!settled) {
            settled = true;
            resolve(reply);
          }
        }).catch((err: Error) => {
          if (!settled) {
            settled = true;
            reject(err);
          }
        });
      } else if (result !== undefined && redis.constructor?.name !== 'RedisClient') {
        done(null, result);
      }
    } catch (err) {
      reject(err);
    }
  });
}

export async function redisGet(key: string): Promise<string | null> {
  return callRedis<string | null>('get', key);
}

export async function redisSet(key: string, value: string): Promise<void> {
  await callRedis('set', key, value);
}

export async function redisDel(key: string): Promise<void> {
  await callRedis('del', key);
}

export async function redisExpire(key: string, seconds: number): Promise<void> {
  await callRedis('expire', key, seconds);
}

export async function redisIncr(key: string): Promise<number> {
  const count = await callRedis<number | string>('incr', key);
  return Number(count);
}

export async function redisTtl(key: string): Promise<number> {
  const ttl = await callRedis<number | string>('ttl', key);
  return Number(ttl);
}

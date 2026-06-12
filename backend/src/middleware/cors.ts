import cors, { CorsOptions } from 'cors';
import { env } from '../config/env';

const allowedOrigins =
  env.NODE_ENV === 'production'
    ? [
        'https://algoforce.ai',
        'https://app.algoforce.ai',
      ]
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman in dev)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} is not allowed`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours preflight cache
};

export const corsMiddleware = cors(corsOptions);

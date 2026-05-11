import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('connect', () => {
  logger.info('🟢 Connected to Redis');
});

redisClient.on('error', (err) => {
  logger.error({ err }, '🔴 Redis connection error');
});

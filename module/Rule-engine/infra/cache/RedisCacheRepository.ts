import { ICacheRepository } from '../../repositories/ICacheRepository.js';
import { redisClient } from './redis.config.js';

export class RedisCacheRepository implements ICacheRepository {
  async get<T>(key: string): Promise<T | null> {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set(key: string, value: unknown, ttlInSeconds = 3600): Promise<void> {
    const stringValue = JSON.stringify(value);
    await redisClient.set(key, stringValue, { EX: ttlInSeconds });
  }

  async delete(key: string): Promise<void> {
    await redisClient.del(key);
  }
}
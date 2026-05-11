import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getCached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached) as T;

    const data = await fn();
    await this.redis.setex(key, ttl, JSON.stringify(data));
    return data;
  }

  async invalidate(pattern: string): Promise<void> {
    const stream = this.redis.scanStream({ match: pattern, count: 100 });
    const pipeline = this.redis.pipeline();

    await new Promise<void>((resolve, reject) => {
      stream.on('data', (keys: string[]) => {
        keys.forEach((k) => pipeline.del(k));
      });
      stream.on('end', () => resolve());
      stream.on('error', reject);
    });

    await pipeline.exec();
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const val = await this.redis.get(key);
    return val ? (JSON.parse(val) as T) : null;
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}

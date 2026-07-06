import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisLockService implements OnModuleInit {
  private readonly logger = new Logger(RedisLockService.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
      this.logger.log('Redis Distributed Lock Engine: Active');
    }
  }

  /**
   * Acquires a lock for a resource.
   * @param key Unique key for the resource (e.g., inbox ID)
   * @param ttlSeconds Lock duration
   * @returns true if lock acquired, false otherwise
   */
  async acquireLock(key: string, ttlSeconds: number = 60): Promise<boolean> {
    if (!this.redis) return true; // Fail-open for local dev without Redis

    const lockKey = `lock:${key}`;
    const result = await this.redis.set(lockKey, 'locked', 'EX', ttlSeconds, 'NX');
    
    const acquired = result === 'OK';
    if (acquired) {
      this.logger.debug(`Lock acquired for: ${key}`);
    }
    return acquired;
  }

  async releaseLock(key: string): Promise<void> {
    if (!this.redis) return;
    const lockKey = `lock:${key}`;
    await this.redis.del(lockKey);
    this.logger.debug(`Lock released for: ${key}`);
  }

  /**
   * Extends an existing lock to prevent expiry during long-running tasks.
   */
  async extendLock(key: string, ttlSeconds: number = 30): Promise<boolean> {
    if (!this.redis) return true;
    const lockKey = `lock:${key}`;
    const result = await this.redis.expire(lockKey, ttlSeconds);
    return result === 1;
  }
}
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface SchedulingRules {
  dailyLimit: number;
  hourlyLimit: number;
  minDelay: number;
  maxDelay: number;
  workDaysOnly: boolean;
  timeWindow: { start: string; end: string };
}

@Injectable()
export class InboxSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(InboxSchedulerService.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => Math.min(times * 50, 2000),
      });
      this.logger.log('Distributed Token-Bucket Rate Limiter: Online');
    }
  }

  /**
   * DISTRIBUTED TOKEN BUCKET & DAILY QUOTA ENFORCEMENT (Redis Lua)
   * 
   * Architecture:
   * 1. Uses UTC-based keys to prevent cross-timezone or cross-day leakage.
   * 2. Implements a smooth refill Token Bucket (tokens refill per millisecond).
   * 3. Uses atomic HMSET/GET to prevent race conditions across 100+ VPS instances.
   * 4. Fail-closed: If Redis is unreachable, sending is denied for safety.
   */
  async checkInboxAvailability(inboxId: string, limits: { dailyLimit: number; hourlyLimit: number }): Promise<boolean> {
    if (!this.redis) return false;

    const now = new Date();
    const utcDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Keys
    const dailyKey = `ratelimit:inbox:${inboxId}:daily:${utcDate}`;
    const bucketKey = `ratelimit:inbox:${inboxId}:bucket`;
    
    const timestampMs = now.getTime();
    
    // Refill Rate: tokens per ms (hourlyLimit / 3,600,000)
    const refillRate = limits.hourlyLimit / 3600000;

    const script = `
      -- 1. Check Daily Fixed Window Limit
      local daily_count = tonumber(redis.call('GET', KEYS[1]) or '0')
      if daily_count >= tonumber(ARGV[1]) then
        return -1 -- Daily limit reached
      end

      -- 2. Token Bucket Refill Logic (Hourly)
      local bucket_data = redis.call('HMGET', KEYS[2], 'tokens', 'last_refill')
      local current_tokens = tonumber(bucket_data[1] or ARGV[2])
      local last_refill = tonumber(bucket_data[2] or ARGV[3])
      
      local elapsed = math.max(0, tonumber(ARGV[3]) - last_refill)
      local tokens_to_add = elapsed * tonumber(ARGV[4])
      local new_tokens = math.min(tonumber(ARGV[2]), current_tokens + tokens_to_add)

      -- 3. Atomic Consumption
      if new_tokens >= 1 then
        -- Update Bucket
        redis.call('HMSET', KEYS[2], 'tokens', new_tokens - 1, 'last_refill', ARGV[3])
        redis.call('PEXPIRE', KEYS[2], 3600000) -- Bucket lives for 1 hour

        -- Increment Daily Counter
        local exists = redis.call('EXISTS', KEYS[1])
        redis.call('INCR', KEYS[1])
        if exists == 0 then
          redis.call('EXPIRE', KEYS[1], 90000) -- 25 hours
        end
        
        return 1 -- Success
      else
        return 0 -- Bucket empty
      end
    `;

    try {
      const result = await this.redis.eval(
        script, 
        2, 
        dailyKey, 
        bucketKey, 
        limits.dailyLimit, 
        limits.hourlyLimit, 
        timestampMs, 
        refillRate
      );

      if (result === 1) return true;
      
      this.logger.debug(`[RateLimit] Inbox ${inboxId} denied. Reason: ${result === -1 ? 'Daily Quota' : 'Bucket Empty'}`);
      return false;
    } catch (err) {
      this.logger.error(`Distributed Rate Limiter Critical Failure: ${err.message}`);
      return false; // Fail-closed
    }
  }

  /**
   * Calculates the delay in milliseconds until the next allowed email sending window.
   */
  async calculateNextSendDelay(inboxId: string, rules: SchedulingRules): Promise<number> {
    const now = new Date();
    
    // 1. Jitter for human-like behavior (Critical for Gmail/Outlook algorithms)
    const jitterSeconds = Math.floor(Math.random() * (rules.maxDelay - rules.minDelay + 1) + rules.minDelay);
    let totalDelayMs = jitterSeconds * 1000;

    // 2. Business Days Only (UTC comparison)
    if (rules.workDaysOnly) {
      const day = now.getUTCDay();
      if (day === 0 || day === 6) { // Sun=0, Sat=6
        totalDelayMs += this.msUntilNextBusinessDay(now);
      }
    }

    // 3. Operating Time Window (e.g., 09:00 - 17:00 UTC)
    const windowDelay = this.calculateWindowDelay(now, rules.timeWindow);
    totalDelayMs += windowDelay;

    return totalDelayMs;
  }

  private msUntilNextBusinessDay(now: Date): number {
    const nextMonday = new Date(now);
    // Move to next Monday at 09:00 UTC
    nextMonday.setUTCDate(now.getUTCDate() + (1 + 7 - now.getUTCDay()) % 7);
    nextMonday.setUTCHours(9, 0, 0, 0);
    return Math.max(0, nextMonday.getTime() - now.getTime());
  }

  private calculateWindowDelay(now: Date, window: { start: string; end: string }): number {
    const [sH, sM] = window.start.split(':').map(Number);
    const [eH, eM] = window.end.split(':').map(Number);

    const startTime = new Date(now);
    startTime.setUTCHours(sH, sM, 0, 0);
    const endTime = new Date(now);
    endTime.setUTCHours(eH, eM, 0, 0);

    if (now < startTime) {
      return startTime.getTime() - now.getTime();
    }
    
    if (now > endTime) {
      const tomorrow = new Date(startTime);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      return tomorrow.getTime() - now.getTime();
    }
    
    return 0;
  }
}
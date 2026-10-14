import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = this.configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD', '');

    try {
      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis reconnection attempts exceeded 3. Continuing with degraded cache.');
            return null; // Stop reconnecting after 3 tries if redis isn't up
          }
          return Math.min(times * 100, 3000);
        },
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        this.logger.log(`Connected to Redis at ${redisHost}:${redisPort}`);
      }).catch((err) => {
        this.logger.warn(`Redis connection deferred: ${err.message}`);
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis client error: ${err.message}`);
      });
    } catch (e: any) {
      this.logger.warn(`Failed to initialize Redis client: ${e.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): Redis | null {
    return this.client;
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }

  async get(key: string): Promise<string | null> {
    if (!this.client || !this.isConnected) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      if (ttlSeconds) {
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
    } catch (e: any) {
      this.logger.warn(`Redis set error for ${key}: ${e.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    try {
      await this.client.del(key);
    } catch (e: any) {
      this.logger.warn(`Redis del error for ${key}: ${e.message}`);
    }
  }
}

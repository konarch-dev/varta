import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check API and infrastructure health' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async checkHealth() {
    let dbStatus = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    const redisStatus = this.redis.getIsConnected() ? 'up' : 'degraded';

    const isHealthy = dbStatus === 'up';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      service: 'varta-api',
      timestamp: new Date().toISOString(),
      components: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }
}

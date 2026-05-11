import { Controller, Get, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import type Redis from 'ioredis';
import { Public } from '../common/decorators';
import { REDIS_CLIENT } from '../common/redis.module';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private mongoConnection: Connection,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  @Public()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('mongo')
  async checkMongo() {
    const state = this.mongoConnection.readyState;
    return { status: state === 1 ? 'ok' : 'error', readyState: state };
  }

  @Public()
  @Get('redis')
  async checkRedis() {
    try {
      await this.redis.ping();
      return { status: 'ok' };
    } catch {
      return { status: 'error' };
    }
  }
}

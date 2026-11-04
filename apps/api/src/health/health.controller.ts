import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  // Liveness: is the process up? Never touches the database.
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'edulink-api',
      time: new Date().toISOString(),
    };
  }

  // Readiness: can the API reach its database right now?
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable', database: 'down' });
    }
    return {
      status: 'ok',
      database: 'up',
      service: 'edulink-api',
      time: new Date().toISOString(),
    };
  }
}

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'api',
      version:
        process.env.npm_package_version ??
        process.env.APP_VERSION ??
        'unknown',
      commit: process.env.GIT_SHA ?? 'unknown',
    };
  }
}

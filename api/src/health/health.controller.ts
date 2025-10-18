import { Controller, Get } from '@nestjs/common';

const START_TIME = Date.now();

function resolveVersion() {
  return (
    process.env.npm_package_version ??
    process.env.APP_VERSION ??
    'unknown'
  );
}

function resolveCommit() {
  return process.env.GIT_SHA ?? 'unknown';
}

function resolveUptimeSeconds() {
  return Math.round(process.uptime());
}

function sentryEnabled() {
  const candidates = [
    process.env.SENTRY_DSN,
    process.env.SENTRY_DSN_API,
    process.env.SENTRY_DSN_BACKEND,
  ];
  return candidates.some((value) => typeof value === 'string' && value.length > 0);
}

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'api',
      version: resolveVersion(),
      commit: resolveCommit(),
    };
  }

  @Get('status')
  status() {
    return {
      ok: true,
      service: 'api',
      version: resolveVersion(),
      commit: resolveCommit(),
      uptime: Math.round((Date.now() - START_TIME) / 1000) || resolveUptimeSeconds(),
      sentry: {
        enabled: sentryEnabled(),
      },
    };
  }
}

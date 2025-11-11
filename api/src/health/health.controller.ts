import { Controller, Get } from '@nestjs/common';

const START_TIME = Date.now();

/**
 * Resolve the application's version from environment variables.
 *
 * @returns The first available value among `npm_package_version`, `APP_VERSION`, or the string `'unknown'` if neither is set.
 */
function resolveVersion() {
  return (
    process.env.npm_package_version ??
    process.env.APP_VERSION ??
    'unknown'
  );
}

/**
 * Get the Git commit SHA from the environment.
 *
 * @returns The value of `GIT_SHA` if set, otherwise `'unknown'`.
 */
function resolveCommit() {
  return process.env.GIT_SHA ?? 'unknown';
}

/**
 * Get the process uptime in seconds rounded to the nearest integer.
 *
 * @returns The process uptime in seconds, rounded to the nearest integer.
 */
function resolveUptimeSeconds() {
  return Math.round(process.uptime());
}

/**
 * Detects whether Sentry is configured via environment variables.
 *
 * @returns `true` if any of `SENTRY_DSN`, `SENTRY_DSN_API`, or `SENTRY_DSN_BACKEND` is a non-empty string, `false` otherwise.
 */
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
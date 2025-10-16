import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const enabled = this.configService.get<boolean>('authGuard.enabled');

    if (!enabled) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const headerName = this.configService.get<string>('authGuard.header') ?? 'x-dev-auth';
    const expectedToken = this.configService.get<string>('authGuard.token') ?? '';

    if (!expectedToken) {
      throw new UnauthorizedException('Guard token is not configured');
    }

    const providedHeader = request.headers[String(headerName).toLowerCase()];
    const providedToken = Array.isArray(providedHeader) ? providedHeader[0] : providedHeader;

    if (typeof providedToken !== 'string' || providedToken !== expectedToken) {
      throw new UnauthorizedException('Missing or invalid auth token');
    }

    return true;
  }
}

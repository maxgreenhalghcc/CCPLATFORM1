import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  login(dto: LoginDto) {
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: this.configService.get<number>('jwt.expiresIn') ?? 3600,
      email: dto.email
    };
  }

  sendMagicLink(dto: MagicLinkDto) {
    return {
      status: 'sent',
      email: dto.email
    };
  }

  refreshToken(_: RefreshTokenDto) {
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: this.configService.get<number>('jwt.expiresIn') ?? 3600
    };
  }
}

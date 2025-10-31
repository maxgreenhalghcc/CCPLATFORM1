import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthService {
    private readonly configService;
    constructor(configService: ConfigService);
    login(dto: LoginDto): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        email: string;
    };
    sendMagicLink(dto: MagicLinkDto): {
        status: string;
        email: string;
    };
    refreshToken(_: RefreshTokenDto): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}

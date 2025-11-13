import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MagicLinkDto } from './dto/magic-link.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    refresh(dto: RefreshTokenDto): {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
    };
}

export interface JwtSignOptions {
    audience?: string;
    issuer?: string;
    expiresInSeconds?: number;
    subject?: string;
}
export declare const signJwtHS256: (payload: Record<string, unknown>, secret: string, options?: JwtSignOptions) => string;

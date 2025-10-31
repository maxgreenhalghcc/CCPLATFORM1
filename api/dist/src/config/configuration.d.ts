declare const _default: () => {
    nodeEnv: string;
    port: number;
    logLevel: string;
    databaseUrl: string;
    cors: {
        origins: string[];
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    seedOnBoot: boolean;
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: number;
        refreshExpiresIn: number;
    };
    stripe: {
        secretKey: string;
        webhookSecret: string;
    };
    nextAuth: {
        secret: string;
    };
    recipeService: {
        url: string;
        secret: string;
        audience: string;
        issuer: string;
    };
    sentry: {
        dsn: string;
        environment: string;
        tracesSampleRate: number;
    };
    features: {
        enablePayment: boolean;
        showBetaBadge: boolean;
    };
};
export default _default;

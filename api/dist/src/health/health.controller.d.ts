export declare class HealthController {
    health(): {
        status: string;
        service: string;
        version: string;
        commit: string;
    };
    status(): {
        ok: boolean;
        service: string;
        version: string;
        commit: string;
        uptime: number;
        sentry: {
            enabled: boolean;
        };
    };
}

export declare class UpdateBarSettingsDto {
    introText?: string;
    outroText?: string;
    theme?: Record<string, string>;
    pricingPounds?: number;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: Record<string, string>;
    openingHours?: Record<string, string>;
    stock?: string[];
    stockListUrl?: string;
    bankDetails?: Record<string, string>;
    stripeConnectId?: string;
    stripeConnectLink?: string;
    brandPalette?: Record<string, string>;
    logoUrl?: string;
}

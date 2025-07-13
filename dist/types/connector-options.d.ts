import { ShogunCore, IGunInstance } from "shogun-core";
export interface ShogunConnectorOptions {
    appName: string;
    appDescription?: string;
    appUrl?: string;
    appIcon?: string;
    showMetamask?: boolean;
    showWebauthn?: boolean;
    showNostr?: boolean;
    showOauth?: boolean;
    darkMode?: boolean;
    websocketSecure?: boolean;
    providerUrl?: string | null;
    peers?: string[];
    authToken?: string;
    gunInstance?: IGunInstance<any>;
    logging?: {
        enabled: boolean;
        level: "error" | "warning" | "info" | "debug";
    };
    timeouts?: {
        login?: number;
        signup?: number;
        operation?: number;
    };
    oauth?: {
        providers: Record<string, {
            clientId: string;
            clientSecret?: string;
            redirectUri?: string;
        }>;
    };
}
export interface ShogunConnectorResult {
    sdk: ShogunCore;
    options: ShogunConnectorOptions;
    registerPlugin: (plugin: any) => boolean;
    hasPlugin: (name: string) => boolean;
}

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
    localStorage?: boolean;
    radisk?: boolean;
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
    core: ShogunCore;
    options: ShogunConnectorOptions;
    registerPlugin: (plugin: any) => boolean;
    hasPlugin: (name: string) => boolean;
}

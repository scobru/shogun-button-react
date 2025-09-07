import { ShogunCore, IGunInstance } from "shogun-core";
import { GunAdvancedPlugin } from "../plugins/GunAdvancedPlugin";
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
    enableGunDebug?: boolean;
    enableConnectionMonitoring?: boolean;
    defaultPageSize?: number;
    connectionTimeout?: number;
    debounceInterval?: number;
}
export interface ShogunConnectorResult {
    core: ShogunCore;
    options: ShogunConnectorOptions;
    setProvider: (provider: any) => boolean;
    getCurrentProviderUrl: () => string | null;
    registerPlugin: (plugin: any) => boolean;
    hasPlugin: (name: string) => boolean;
    gunPlugin: GunAdvancedPlugin;
}

import { ShogunCore, GunInstance } from "shogun-core";
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
    gunInstance?: GunInstance;
    gunOptions?: any;
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
    webauthn?: {
        enabled?: boolean;
    };
    nostr?: {
        enabled?: boolean;
    };
    web3?: {
        enabled?: boolean;
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

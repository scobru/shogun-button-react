import { ShogunCore, IGunInstance } from "shogun-core";
export interface TransportConfig {
    type: "gun" | "sqlite" | "postgresql" | "mongodb" | "custom";
    options?: any;
    customTransport?: any;
}
export interface ShogunConnectorOptions {
    appName: string;
    appDescription?: string;
    appUrl?: string;
    appIcon?: string;
    showMetamask?: boolean;
    showWebauthn?: boolean;
    showNostr?: boolean;
    showZkProof?: boolean;
    darkMode?: boolean;
    gunInstance?: IGunInstance;
    gunOptions?: any;
    transport?: TransportConfig;
    timeouts?: {
        login?: number;
        signup?: number;
        operation?: number;
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
    zkproof?: {
        enabled?: boolean;
        defaultGroupId?: string;
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
    gunPlugin: null;
}

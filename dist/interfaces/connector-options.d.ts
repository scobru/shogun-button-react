import { ShogunCore, IZenInstance } from "shogun-core";
export interface ShogunConnectorOptions {
    appName: string;
    appDescription?: string;
    appUrl?: string;
    appIcon?: string;
    showMetamask?: boolean;
    showWebauthn?: boolean;
    showNostr?: boolean;
    showChallenge?: boolean;
    showSeedLogin?: boolean;
    darkMode?: boolean;
    zenInstance?: IZenInstance;
    crypto?: {
        autoGenerateOnAuth?: boolean;
    };
    postAuth?: {
        enabled?: boolean;
    };
    timeouts?: {
        login?: number;
        signup?: number;
        operation?: number;
    };
    webauthn?: {
        enabled?: boolean;
        rpName?: string;
        rpId?: string;
    };
    nostr?: {
        enabled?: boolean;
    };
    web3?: {
        enabled?: boolean;
    };
    challenge?: {
        enabled?: boolean;
    };
    /** @deprecated use zen configuration instead */
    enableGunDebug?: boolean;
    /** @deprecated use zen configuration instead */
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
    zenPlugin: null;
}

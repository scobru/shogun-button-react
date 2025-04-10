import { ShogunCore } from "shogun-core";
export interface ShogunConnectorOptions {
    appName: string;
    appDescription?: string;
    appUrl?: string;
    appIcon?: string;
    showMetamask?: boolean;
    showWebauthn?: boolean;
    darkMode?: boolean;
    websocketSecure?: boolean;
    didRegistryAddress?: string | null;
    providerUrl?: string | null;
    peers?: string[];
    authToken?: string;
    logging?: {
        enabled: boolean;
        level: "error" | "warning" | "info" | "debug";
    };
    timeouts?: {
        login?: number;
        signup?: number;
        operation?: number;
    };
}
export interface ShogunConnectorResult {
    sdk: ShogunCore;
    options: ShogunConnectorOptions;
    setProvider: (provider: any) => boolean;
    getCurrentProviderUrl: () => string | null;
    registerPlugin: (plugin: any) => boolean;
    hasPlugin: (name: string) => boolean;
}

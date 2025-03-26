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
}
export interface ShogunConnectorResult {
    sdk: ShogunCore;
    options: ShogunConnectorOptions;
    setProvider: (provider: any) => boolean;
    getCurrentProviderUrl: () => string | null;
}

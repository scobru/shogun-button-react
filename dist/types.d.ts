export * from './types/connector-options';
export type ShogunConnectorOptions = {
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
};

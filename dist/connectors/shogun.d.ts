import { ShogunCore } from "shogun-core";
import { ShogunConnectorOptions } from "../types/connector-options";
/**
 * Crea un connettore Shogun per l'autenticazione
 */
declare function shogunConnector({ appName, appDescription, appUrl, appIcon, showMetamask, showWebauthn, darkMode, websocketSecure, didRegistryAddress, providerUrl, peers }: ShogunConnectorOptions): {
    sdk: ShogunCore;
    options: {
        appName: string;
        appDescription: string;
        appUrl: string;
        appIcon: string;
        showMetamask: boolean;
        showWebauthn: boolean;
        darkMode: boolean;
        websocketSecure: boolean;
        didRegistryAddress: string;
        providerUrl: string;
        peers: string[];
    };
};
export { shogunConnector };

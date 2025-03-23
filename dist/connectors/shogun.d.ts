import { ShogunCore } from "shogun-core";
import { ShogunConnectorOptions } from "../types/connector-options";
/**
 * Crea un connettore Shogun per l'autenticazione
 */
declare function shogunConnector({ appName, appDescription, appUrl, appIcon, showMetamask, showWebauthn, darkMode, websocketSecure, didRegistryAddress, providerUrl }: ShogunConnectorOptions): {
    sdk: ShogunCore;
    options: {
        appName: string;
        appDescription: string;
        appUrl: string;
        appIcon: string;
        showMetamask: boolean;
        showWebauthn: boolean;
        darkMode: boolean;
    };
};
export { shogunConnector };

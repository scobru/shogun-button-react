import { ShogunConnectorOptions, ShogunConnectorResult } from "../types/connector-options";
/**
 * Crea un connettore Shogun per l'autenticazione
 */
declare function shogunConnector({ appName, appDescription, appUrl, appIcon, showMetamask, showWebauthn, darkMode, websocketSecure, didRegistryAddress, providerUrl, peers }: ShogunConnectorOptions): ShogunConnectorResult;
export { shogunConnector };

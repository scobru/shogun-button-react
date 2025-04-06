import { ShogunConnectorOptions, ShogunConnectorResult } from "../types/connector-options";
/**
 * Creates a Shogun connector for authentication
 */
declare function shogunConnector({ appName, appDescription, appUrl, appIcon, showMetamask, showWebauthn, darkMode, websocketSecure, didRegistryAddress, providerUrl, peers, logging, timeouts, authToken }: ShogunConnectorOptions): ShogunConnectorResult;
export { shogunConnector };

import { ShogunConnectorOptions, ShogunConnectorResult } from "../types/connector-options";
/**
 * Creates a Shogun connector for authentication
 */
declare function shogunConnector({ appName, appDescription, appUrl, appIcon, showMetamask, showWebauthn, showNostr, showOauth, darkMode, websocketSecure, providerUrl, peers, logging, timeouts, authToken, oauth, gunInstance }: ShogunConnectorOptions): ShogunConnectorResult;
export { shogunConnector };

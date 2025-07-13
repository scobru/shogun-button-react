import { ShogunCore } from "shogun-core";
import { ShogunConnectorOptions, ShogunConnectorResult } from "./types/connector-options";

export function shogunConnector(
  options: ShogunConnectorOptions
): ShogunConnectorResult {
  const {
    peers = ["https://gun-manhattan.herokuapp.com/gun"],
    appName,
    logging,
    timeouts,
    oauth,
    ...restOptions
  } = options;

  const sdk = new ShogunCore({
    peers,
    scope: appName,
    logging,
    timeouts,
    oauth,
  });


  const registerPlugin = (plugin: any): boolean => {
    if (sdk && typeof sdk.register === "function") {
      try {
        sdk.register(plugin);
        return true;
      } catch (error) {
        console.error(`Error registering plugin: ${plugin.name}`, error);
        return false;
      }
    }
    return false;
  };

  const hasPlugin = (name: string): boolean => {
    return sdk ? sdk.hasPlugin(name) : false;
  };

  return {
    sdk,
    options,
    registerPlugin,
    hasPlugin,
  };
} 
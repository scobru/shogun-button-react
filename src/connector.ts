import { ShogunCore } from "shogun-core";
import {
  ShogunConnectorOptions,
  ShogunConnectorResult,
} from "./types/connector-options";

export function shogunConnector(
  options: ShogunConnectorOptions
): ShogunConnectorResult {
  const {
    peers = ["https://gun-manhattan.herokuapp.com/gun"],
    appName,
    timeouts,
    oauth,
    showMetamask,
    showWebauthn,
    showNostr,
    showOauth,
    ...restOptions
  } = options;

  // Build ShogunCore configuration with authentication plugins
  const shogunConfig: any = {
    peers,
    scope: appName,
    timeouts,
  };

  // Configure Web3/MetaMask plugin
  if (showMetamask) {
    shogunConfig.web3 = { enabled: true };
    console.log("✅ Web3 plugin configured");
  }

  // Configure WebAuthn plugin
  if (showWebauthn) {
    shogunConfig.webauthn = {
      enabled: true,
      rpName: appName || "Shogun App",
      rpId:
        typeof window !== "undefined" ? window.location.hostname : "localhost",
    };
    console.log("✅ WebAuthn plugin configured");
  }

  // Configure Nostr plugin
  if (showNostr) {
    shogunConfig.nostr = { enabled: true };
    console.log("✅ Nostr plugin configured");
  }

  // Configure OAuth plugin
  if (showOauth && oauth) {
    shogunConfig.oauth = {
      enabled: true,
      usePKCE: true, // Mandatory for security
      allowUnsafeClientSecret: true, // Required for Google OAuth
      ...oauth,
    };
    console.log("✅ OAuth plugin configured");
  }

  console.log("🔧 Creating ShogunCore with config:", {
    showMetamask,
    showWebauthn,
    showNostr,
    showOauth,
  });

  const sdk = new ShogunCore(shogunConfig);

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

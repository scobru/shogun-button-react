import { ShogunCore, ShogunCoreConfig } from "shogun-core";
import {
  ShogunConnectorOptions,
  ShogunConnectorResult,
} from "./types/connector-options";

export function shogunConnector(
  options: ShogunConnectorOptions
): ShogunConnectorResult {
  const {
    peers = ["https://relay.shogun-eco.xyz/gun"],
    appName,
    timeouts,
    oauth,
    showMetamask,
    showWebauthn,
    showNostr,
    showOauth,
    localStorage,
    radisk,
    ...restOptions
  } = options;

  // Build ShogunCore configuration with authentication plugins
  const shogunConfig: ShogunCoreConfig = {
    peers,
    scope: appName,
    timeouts,
    localStorage,
    radisk,
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

  const core = new ShogunCore(shogunConfig);

  const registerPlugin = (plugin: any): boolean => {
    if (core && typeof core.register === "function") {
      try {
        core.register(plugin);
        return true;
      } catch (error) {
        console.error(`Error registering plugin: ${plugin.name}`, error);
        return false;
      }
    }
    return false;
  };

  const hasPlugin = (name: string): boolean => {
    return core ? core.hasPlugin(name) : false;
  };

  return {
    core,
    options,
    registerPlugin,
    hasPlugin,
  };
}

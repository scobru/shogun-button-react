import { ShogunCore } from "shogun-core";
import { ShogunConnectorOptions, ShogunConnectorResult } from "./types/connector-options";
import { GunAdvancedPlugin } from "./plugins/GunAdvancedPlugin";

export function shogunConnector(
  options: ShogunConnectorOptions
): ShogunConnectorResult {
  const {
    peers = ["https://gun-manhattan.herokuapp.com/gun"],
    appName,
    timeouts,
    oauth,
    webauthn,
    nostr,
    web3,
    localStorage,
    radisk,
    showOauth,
    showWebauthn,
    showNostr,
    showMetamask,
    darkMode,
    authToken,
    enableGunDebug = true,
    enableConnectionMonitoring = true,
    defaultPageSize = 20,
    connectionTimeout = 10000,
    debounceInterval = 100,
    ...restOptions
  } = options;

  const core = new ShogunCore({
    peers,
    scope: appName,
    oauth,
    webauthn,
    nostr,
    web3,
    localStorage,
    radisk,
    authToken,
    timeouts,
  });

  const setProvider = (provider: any): boolean => {
    if (!core) {
      return false;
    }

    try {
      let newProviderUrl: string | null = null;
      if (provider && provider.connection && provider.connection.url) {
        newProviderUrl = provider.connection.url;
      } else if (typeof provider === "string") {
        newProviderUrl = provider;
      }

      if (newProviderUrl) {
        const gun: any = (core as any)?.db?.gun || (core as any)?.gun;
        if (gun && typeof gun.opt === "function") {
          try {
            gun.opt({ peers: [newProviderUrl] });
            return true;
          } catch (e) {
            console.error("Error adding peer via gun.opt:", e);
            return false;
          }
        }
      }
      return false;
    } catch (error) {
      console.error("Error setting provider:", error);
      return false;
    }
  };

  const getCurrentProviderUrl = (): string | null => {
    const gun: any = (core as any)?.db?.gun || (core as any)?.gun;
    try {
      const peersObj = gun && gun.back ? gun.back('opt.peers') : undefined;
      const urls = peersObj && typeof peersObj === 'object' ? Object.keys(peersObj) : [];
      return urls.length > 0 ? urls[0] : null;
    } catch {
      return null;
    }
  };

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

  // Registra automaticamente il plugin Gun avanzato
  let gunPlugin: GunAdvancedPlugin | null = null;
  if (core) {
    gunPlugin = new GunAdvancedPlugin(core, {
      enableDebug: enableGunDebug,
      enableConnectionMonitoring,
      defaultPageSize,
      connectionTimeout,
      debounceInterval,
    });
    
    registerPlugin(gunPlugin);
  }

  // Ensure gunPlugin is always available
  if (!gunPlugin) {
    throw new Error("Failed to initialize GunAdvancedPlugin");
  }

  return {
    core,
    options,
    setProvider,
    getCurrentProviderUrl,
    registerPlugin,
    hasPlugin,
    gunPlugin,
  };
} 
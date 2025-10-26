import { ShogunCore } from "shogun-core";
import {
  ShogunConnectorOptions,
  ShogunConnectorResult,
} from "./interfaces/connector-options";

export function shogunConnector(
  options: ShogunConnectorOptions
): ShogunConnectorResult {
  const {
    gunInstance,
    gunOptions,
    appName,
    timeouts,
    webauthn,
    nostr,
    web3,
    zkproof,
    showWebauthn,
    showNostr,
    showMetamask,
    showZkProof,
    darkMode,
    enableGunDebug = true,
    enableConnectionMonitoring = true,
    defaultPageSize = 20,
    connectionTimeout = 10000,
    debounceInterval = 100,
    ...restOptions
  } = options;

  let core: ShogunCore | null = null;

  if (gunInstance !== undefined) {
    core = new ShogunCore({
      gunInstance: gunInstance,
      webauthn,
      nostr,
      web3,
      zkproof,
      timeouts,
    }) as ShogunCore;
  } else {
    core = new ShogunCore({
      gunOptions: gunOptions,
      webauthn,
      nostr,
      web3,
      zkproof,
      timeouts,
    }) as ShogunCore;
  }

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
      const peersObj = gun && gun.back ? gun.back("opt.peers") : undefined;
      const urls =
        peersObj && typeof peersObj === "object" ? Object.keys(peersObj) : [];
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

  // Plugin registration removed - GunAdvancedPlugin no longer available

  return {
    core,
    options,
    setProvider,
    getCurrentProviderUrl,
    registerPlugin,
    hasPlugin,
    gunPlugin: null,
  };
}

import { ShogunCore, IZenInstance } from "shogun-core";

export interface ShogunConnectorOptions {
  // App information
  appName: string;
  appDescription?: string;
  appUrl?: string;
  appIcon?: string;

  // Feature toggles for UI
  showMetamask?: boolean;
  showWebauthn?: boolean;
  showNostr?: boolean;
  showChallenge?: boolean;
  showSeedLogin?: boolean;
  darkMode?: boolean;

  // Zen instance configuration
  zenInstance?: IZenInstance;

  crypto?: {
    autoGenerateOnAuth?: boolean;
  };

  postAuth?: {
    enabled?: boolean;
  };

  // Timeouts
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };

  // Plugin configurations (matching ShogunCoreConfig)
  webauthn?: {
    enabled?: boolean;
    rpName?: string;
    rpId?: string;
  };
  nostr?: {
    enabled?: boolean;
  };
  web3?: {
    enabled?: boolean;
  };
  challenge?: {
    enabled?: boolean;
  };

  // Legacy options (kept for backward compatibility with Gun)
  /** @deprecated use zen configuration instead */
  enableGunDebug?: boolean;
  /** @deprecated use zen configuration instead */
  enableConnectionMonitoring?: boolean;
  defaultPageSize?: number;
  connectionTimeout?: number;
  debounceInterval?: number;
}

// Definisco un nuovo tipo per l'oggetto ritornato dal connettore
export interface ShogunConnectorResult {
  core: ShogunCore;
  options: ShogunConnectorOptions;

  // Helper methods
  setProvider: (provider: any) => boolean;
  getCurrentProviderUrl: () => string | null;

  // Metodi per la gestione dei plugin
  registerPlugin: (plugin: any) => boolean;
  hasPlugin: (name: string) => boolean;
  zenPlugin: null;
}

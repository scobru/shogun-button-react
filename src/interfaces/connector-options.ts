import { ShogunCore, IGunInstance } from "shogun-core";

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
  showZkProof?: boolean;
  showChallenge?: boolean;
  showSeedLogin?: boolean;
  darkMode?: boolean;

  // Gun instance configuration
  gunInstance?: IGunInstance;

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
  zkproof?: {
    enabled?: boolean;
    defaultGroupId?: string;
    deterministic?: boolean;
    minEntropy?: number;
  };
  challenge?: {
    enabled?: boolean;
  };

  // Legacy options (kept for backward compatibility)
  enableGunDebug?: boolean;
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

  // Nuovi metodi per la gestione dei plugin
  registerPlugin: (plugin: any) => boolean;
  hasPlugin: (name: string) => boolean;
  gunPlugin: null;
}

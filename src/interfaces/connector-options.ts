import { ShogunCore, GunInstance } from "shogun-core";
import { GunAdvancedPlugin } from "../plugins/GunAdvancedPlugin";


export interface ShogunConnectorOptions {
  // App information
  appName: string;
  appDescription?: string;
  appUrl?: string;
  appIcon?: string;

  // Feature toggles
  showMetamask?: boolean;
  showWebauthn?: boolean;
  showNostr?: boolean;
  showOauth?: boolean;
  darkMode?: boolean;

  gunInstance?: GunInstance;

  gunOptions?: {
    peers?: string[];
    authToken?: string;
    scope?: string;
    [key: string]: any;
  };

  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
  oauth?: {
    providers: Record<
      string,
      {
        clientId: string;
        clientSecret?: string;
        redirectUri?: string;
      }
    >;
  };
  webauthn?: {
    enabled?: boolean;
  };
  nostr?: {
    enabled?: boolean;
  };
  web3?: {
    enabled?: boolean;
  };
  enableGunDebug?: boolean;
  enableConnectionMonitoring?: boolean;
  defaultPageSize?: number;
  connectionTimeout?: number;
  debounceInterval?: number;
}

// Definisco un nuovo tipo per l'oggetto ritornato dal connettore
export interface ShogunConnectorResult {
  core: ShogunCore ;
  options: ShogunConnectorOptions;

  // Helper methods
  setProvider: (provider: any) => boolean;
  getCurrentProviderUrl: () => string | null;

  // Nuovi metodi per la gestione dei plugin
  registerPlugin: (plugin: any) => boolean;
  hasPlugin: (name: string) => boolean;
  gunPlugin: GunAdvancedPlugin; 
}

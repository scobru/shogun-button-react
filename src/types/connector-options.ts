import { ShogunCore, IGunInstance } from "shogun-core";
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

  // Network configuration
  websocketSecure?: boolean;
  providerUrl?: string | null;
  peers?: string[];
  authToken?: string;
  gunInstance?: IGunInstance<any>;

  // Advanced options (directly mapped to ShogunSDKConfig)
  logging?: {
    enabled: boolean;
    level: "error" | "warning" | "info" | "debug";
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
  // Configurazione plugin Gun avanzato
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
  gunPlugin: GunAdvancedPlugin; // GunAdvancedPlugin

}

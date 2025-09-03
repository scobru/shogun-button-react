import { ShogunCore, IGunInstance } from "shogun-core";

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
    providers: Record<string, {
      clientId: string;
      clientSecret?: string;
      redirectUri?: string;
    }>
  };
  
  // Configurazione plugin Gun avanzato
  enableGunDebug?: boolean;
  enableConnectionMonitoring?: boolean;
  defaultPageSize?: number;
  connectionTimeout?: number;
  debounceInterval?: number;
}

export interface ShogunConnectorResult {
  sdk: ShogunCore;
  options: ShogunConnectorOptions;
  // Nuovi metodi per la gestione dei plugin
  registerPlugin: (plugin: any) => boolean;
  hasPlugin: (name: string) => boolean;
  // Plugin Gun avanzato
  gunPlugin: any; // GunAdvancedPlugin
}
import React, {
  useContext,
  useState,
  createContext,
  useEffect,
  useRef,
} from "react";
import { ShogunCore, WebauthnPlugin } from "shogun-core";
import { Observable } from "rxjs";

import "../styles/index.css";

// Interface for plugin hooks
interface PluginHooks {
  useGunState?: any;
  useGunCollection?: any;
  useGunConnection?: any;
  useGunDebug?: any;
  useGunRealtime?: any;
}

// Definiamo i tipi localmente se non sono disponibili da shogun-core
interface AuthResult {
  success: boolean;
  userPub?: string;
  username?: string;
  alias?: string;
  method?: string;
  authMethod?: string;
  error?: string;
  redirectUrl?: string;
  sessionToken?: string;
  sea?: {
    pub: string;
    priv: string;
    epub: string;
    epriv: string;
  };
}

// Helper type to check if core is ShogunCore
function isShogunCore(core: any): core is ShogunCore {
  return core && typeof core.isLoggedIn === 'function' && typeof core.gun !== 'undefined';
}

// Context type for ShogunProvider
type ShogunContextType = {
  core: ShogunCore | null;
  options: any; // Allow any options for flexibility
  isLoggedIn: boolean;
  userPub: string | null;
  username: string | null;
  // Unified Authentication methods
  login: (method: string, ...args: any[]) => Promise<any>;
  signUp: (method: string, ...args: any[]) => Promise<any>;
  logout: () => void;
  // RxJS methods for reactive data
  observe: <T>(path: string) => Observable<T>;
  // Provider method
  setProvider: (provider: any) => boolean;
  // Plugin methods
  hasPlugin: (name: string) => boolean;
  getPlugin: <T>(name: string) => T | undefined;
  // Pair export/import methods
  exportGunPair: (password?: string) => Promise<string>;
  importGunPair: (pairData: string, password?: string) => Promise<boolean>;

  gunPlugin: null;

  // Metodi di utilità
  put: (path: string, data: any) => Promise<void>;
  get: (path: string) => any;
  remove: (path: string) => Promise<void>;
  completePendingSignup: () => void;
  hasPendingSignup: boolean;
  setHasPendingSignup: (value: boolean) => void;
};

// Default context
const defaultShogunContext: ShogunContextType = {
  core: null,
  options: {},
  isLoggedIn: false,
  userPub: null,
  username: null,
  login: async () => ({}),
  signUp: async () => ({}),
  logout: () => {},
  observe: () => new Observable<any>(),
  setProvider: () => false,
  hasPlugin: () => false,
  getPlugin: () => undefined,
  exportGunPair: async () => "",
  importGunPair: async () => false,
  gunPlugin: null,
  put: async () => {},
  get: () => null,
  remove: async () => {},
  completePendingSignup: () => {},
  hasPendingSignup: false,
  setHasPendingSignup: (_value: boolean) => {},
};

// Create context using React's createContext directly
const ShogunContext = createContext<ShogunContextType>(defaultShogunContext);

// Custom hook to access the context
export const useShogun = () => useContext(ShogunContext);

// Props for the provider component
type ShogunButtonProviderProps = {
  children: React.ReactNode;
  core: ShogunCore;
  options: any;
  onLoginSuccess?: (data: {
    userPub: string;
    username: string;
    password?: string;
    authMethod?: "password" | "web3" | "webauthn" | "nostr" | "zkproof" | "challenge" | "seed" | "pair";
  }) => void;
  onSignupSuccess?: (data: {
    userPub: string;
    username: string;
    password?: string;
    seedPhrase?: string;
    authMethod?: "password" | "web3" | "webauthn" | "nostr" | "zkproof" | "challenge" | "seed" | "pair";
  }) => void;
  onError?: (error: string) => void;
};

// Provider component
export function ShogunButtonProvider({
  children,
  core,
  options,
  onLoginSuccess,
  onSignupSuccess,
  onError,
}: ShogunButtonProviderProps) {
  // Use React's useState directly
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userPub, setUserPub] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [hasPendingSignup, setHasPendingSignup] = useState<boolean>(false);

  // Effetto per gestire l'inizializzazione e pulizia
  useEffect(() => {
    if (!core) return;

    // Verifichiamo se l'utente è già loggato all'inizializzazione
    let isLoggedIn = false;
    let pub: string | null = null;

    if (isShogunCore(core)) {
      isLoggedIn = core.isLoggedIn();
      if (isLoggedIn) {
        pub = core.gun.user()?.is?.pub;
      }
    }

    if (isLoggedIn && pub) {
      setIsLoggedIn(true);
      setUserPub(pub);
      setUsername(pub.slice(0, 8) + "...");
    }

    // Poiché il metodo 'on' non esiste su ShogunCore,
    // gestiamo gli stati direttamente nei metodi di login/logout
  }, [core, onLoginSuccess]);

  // RxJS observe method
  const observe = <T,>(path: string): Observable<T> => {
    if (!core) {
      return new Observable<T>();
    }
    const rx: any = (core as any)?.rx || (core as any)?.db?.rx;
    if (rx && typeof rx.observe === "function") {
      const observable = rx.observe(path) as Observable<T>;
      return observable;
    }
    return new Observable<T>();
  };

  // Unified login
  const login = async (method: string, ...args: any[]) => {
    try {
      if (!core) {
        throw new Error("SDK not initialized");
      }

      let result: AuthResult;
      let authMethod = method;
      let username: string | undefined;

      switch (method) {
        case "password":
          username = args[0];
          console.log(`[DEBUG] ShogunButton: Calling core.login for username: ${username}`);
          
          if (isShogunCore(core)) {
            result = await core.login(args[0], args[1]);
          } else {
            throw new Error("Unsupported core type");
          }
          
          console.log(`[DEBUG] ShogunButton: core.login result:`, result);
          break;
        case "pair":
          // New pair authentication method
          const pair = args[0];
          if (!pair || typeof pair !== "object") {
            throw new Error("Invalid pair data provided");
          }

          if (isShogunCore(core)) {
            result = await new Promise((resolve, reject) => {
              core.gun.user().auth(pair, (ack: any) => {
                if (ack.err) {
                  reject(new Error(`Pair authentication failed: ${ack.err}`));
                  return;
                }

                const pub = ack.pub || pair.pub;
                const alias = ack.alias || `user_${pub?.substring(0, 8)}`;

                resolve({
                  success: true,
                  userPub: pub,
                  alias: alias,
                  method: "pair",
                } as AuthResult);
              });
            });
          } else {
            throw new Error("Pair authentication requires ShogunCore");
          }

          username = (result as any).alias;
          authMethod = "pair";
          break;
        case "webauthn":
          username = args[0];
          if (isShogunCore(core)) {
            const webauthn: any = core.getPlugin("webauthn");
            if (!webauthn) throw new Error("WebAuthn plugin not available");
            result = await webauthn.login(username);
          } else {
            throw new Error("WebAuthn requires ShogunCore");
          }
          break;
        case "web3":
          if (isShogunCore(core)) {
            const web3: any = core.getPlugin("web3");
            if (!web3) throw new Error("Web3 plugin not available");
            const connectionResult = await web3.connectMetaMask();
            if (!connectionResult.success || !connectionResult.address) {
              throw new Error(
                connectionResult.error || "Failed to connect wallet."
              );
            }
            username = connectionResult.address;
            result = await web3.login(connectionResult.address);
          } else {
            throw new Error("Web3 requires ShogunCore");
          }
          break;
        case "nostr":
          if (isShogunCore(core)) {
            const nostr: any = core.getPlugin("nostr");
            if (!nostr) throw new Error("Nostr plugin not available");
            const nostrResult = await nostr.connectBitcoinWallet();
            if (!nostrResult || !nostrResult.success) {
              throw new Error(
                nostrResult?.error || "Connessione al wallet Bitcoin fallita"
              );
            }
            const pubkey = nostrResult.address;
            if (!pubkey) throw new Error("Nessuna chiave pubblica ottenuta");
            username = pubkey;
            result = await nostr.login(pubkey);
          } else {
            throw new Error("Nostr requires ShogunCore");
          }
          break;
        case "zkproof":
          const trapdoor = args[0];
          if (!trapdoor || typeof trapdoor !== "string") {
            throw new Error("Invalid trapdoor provided");
          }
          if (isShogunCore(core)) {
            const zkproof: any = core.getPlugin("zkproof");
            if (!zkproof) throw new Error("ZK-Proof plugin not available");
            const zkLoginResult: any = await zkproof.login(trapdoor);
            result = zkLoginResult;
            username = zkLoginResult.username || zkLoginResult.alias || `zk_${(zkLoginResult.userPub || "").slice(0, 16)}`;
            authMethod = "zkproof";
          } else {
            throw new Error("ZK-Proof requires ShogunCore");
          }
          break;
        case "challenge":
          username = args[0];
          if (!username) throw new Error("Username required for challenge login");
          
          if (isShogunCore(core)) {
            const challengePlugin: any = core.getPlugin("challenge");
            if (!challengePlugin) throw new Error("Challenge plugin not available");
            
            result = await challengePlugin.login(username);
            authMethod = "challenge";
          } else {
             throw new Error("Challenge auth requires ShogunCore");
          }
          break;
        case "seed":
          username = args[0];
          const mnemonic = args[1];
          if (!username || !mnemonic) {
            throw new Error("Username and seed phrase are required");
          }

          if (isShogunCore(core)) {
            result = await core.loginWithSeed(username, mnemonic);
            authMethod = "seed";
          } else {
            throw new Error("Seed authentication requires ShogunCore");
          }
          break;
        default:
          throw new Error("Unsupported login method");
      }

      if (result.success) {
        let userPub = result.userPub || "";
        if (!userPub && isShogunCore(core)) {
          userPub = core.gun.user()?.is?.pub || "";
        }
        const displayName =
          result.alias || username || userPub.slice(0, 8) + "...";

        setIsLoggedIn(true);
        setUserPub(userPub);
        setUsername(displayName);

        onLoginSuccess?.({
          userPub: userPub,
          username: displayName,
          authMethod: authMethod as any,
        });
      } else {
        onError?.(result.error || "Login failed");
      }
      return result;
    } catch (error: any) {
      onError?.(error.message || "Error during login");
      return { success: false, error: error.message };
    }
  };

  // Unified signup
  const signUp = async (method: string, ...args: any[]) => {
    try {
      if (!core) {
        throw new Error("SDK not initialized");
      }

      let result: AuthResult;
      let authMethod = method;
      let username: string | undefined;

      switch (method) {
        case "password":
          username = args[0];
          if (args[1] !== args[2]) {
            throw new Error("Passwords do not match");
          }
          console.log(`[DEBUG] ShogunButton: Calling core.signUp for username: ${username}`);
          console.log(`[DEBUG] ShogunButton: core object:`, core);
          try {
            console.log(`[DEBUG] ShogunButton: About to call core.signUp...`);
            
            if (isShogunCore(core)) {
              result = await core.signUp(args[0], args[1]);
            } else {
              throw new Error("Unsupported core type");
            }
            
            console.log(`[DEBUG] ShogunButton: core.signUp completed successfully`);
            console.log(`[DEBUG] ShogunButton: core.signUp result:`, result);
          } catch (error) {
            console.error(`[DEBUG] ShogunButton: core.signUp error:`, error);
            throw error;
          }
          break;
        case "webauthn": {
          username = typeof args[0] === "string" ? args[0].trim() : "";
          const webauthnOptions =
            args.length > 1 && typeof args[1] === "object" && args[1] !== null
              ? (args[1] as { seedPhrase?: string; generateSeedPhrase?: boolean })
              : {};

          if (!username) {
            throw new Error("Username is required for WebAuthn registration");
          }

          if (isShogunCore(core)) {
            const webauthn: WebauthnPlugin = core.getPlugin("webauthn");
            if (!webauthn) throw new Error("WebAuthn plugin not available");

            const pluginOptions: {
              seedPhrase?: string;
              generateSeedPhrase?: boolean;
            } = {};

            if (webauthnOptions.seedPhrase) {
              pluginOptions.seedPhrase = webauthnOptions.seedPhrase.trim();
              pluginOptions.generateSeedPhrase =
                webauthnOptions.generateSeedPhrase ?? false;
            } else if (typeof webauthnOptions.generateSeedPhrase === "boolean") {
              pluginOptions.generateSeedPhrase =
                webauthnOptions.generateSeedPhrase;
            }

            if (
              pluginOptions.generateSeedPhrase === undefined &&
              !pluginOptions.seedPhrase
            ) {
              pluginOptions.generateSeedPhrase = true;
            }

            result = await webauthn.signUp(username, pluginOptions);
          } else {
            throw new Error("WebAuthn requires ShogunCore");
          }
          break;
        }
        case "web3":
          if (isShogunCore(core)) {
            const web3: any = core.getPlugin("web3");
            if (!web3) throw new Error("Web3 plugin not available");
            const connectionResult = await web3.connectMetaMask();
            if (!connectionResult.success || !connectionResult.address) {
              throw new Error(
                connectionResult.error || "Failed to connect wallet."
              );
            }
            username = connectionResult.address;
            result = await web3.signUp(connectionResult.address);
          } else {
            throw new Error("Web3 requires ShogunCore");
          }
          break;
        case "nostr":
          if (isShogunCore(core)) {
            const nostr: any = core.getPlugin("nostr");
            if (!nostr) throw new Error("Nostr plugin not available");
            const nostrResult = await nostr.connectBitcoinWallet();
            if (!nostrResult || !nostrResult.success) {
              throw new Error(
                nostrResult?.error || "Connessione al wallet Bitcoin fallita"
              );
            }
            const pubkey = nostrResult.address;
            if (!pubkey) throw new Error("Nessuna chiave pubblica ottenuta");
            username = pubkey;
            result = await nostr.signUp(pubkey);
          } else {
            throw new Error("Nostr requires ShogunCore");
          }
          break;
        case "zkproof":
          if (isShogunCore(core)) {
            const zkproofPlugin: any = core.getPlugin("zkproof");
            if (!zkproofPlugin) throw new Error("ZK-Proof plugin not available");
            const seed = args[0]; // Optional seed
            const zkSignupResult: any = await zkproofPlugin.signUp(seed);
            result = zkSignupResult;
            username = zkSignupResult.username || zkSignupResult.alias || `zk_${(zkSignupResult.userPub || "").slice(0, 16)}`;
            authMethod = "zkproof";
          } else {
            throw new Error("ZK-Proof requires ShogunCore");
          }
          break;
        default:
          throw new Error("Unsupported signup method");
      }

      if (result.success) {
        let userPub = result.userPub || "";
        if (!userPub && isShogunCore(core)) {
          userPub = core.gun.user()?.is?.pub || "";
        }
        const displayName =
          result.alias || username || userPub.slice(0, 8) + "...";

        setIsLoggedIn(true);
        setUserPub(userPub);
        setUsername(displayName);
        const signupPayload = {
          userPub: userPub,
          username: displayName,
          seedPhrase: (result as any).seedPhrase,
          authMethod: authMethod as any,
        };

        const pendingBackup = Boolean(
          (result as any).seedPhrase || (result as any).trapdoor
        );
        setHasPendingSignup(pendingBackup);

        onSignupSuccess?.(signupPayload);
      } else {
        onError?.(result.error);
      }
      return result;
    } catch (error: any) {
      onError?.(error.message || "Error during registration");
      return { success: false, error: error.message };
    }
  };

  // Logout
  const logout = () => {
    if (isShogunCore(core)) {
      core.logout();
    }
    
    setIsLoggedIn(false);
    setUserPub(null);
    setUsername(null);
  };

  // Implementazione del metodo setProvider
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

  const hasPlugin = (name: string): boolean => {
    if (isShogunCore(core)) {
      return core.hasPlugin(name);
    }
    return false;
  };

  const getPlugin = <T,>(name: string): T | undefined => {
    if (isShogunCore(core)) {
      return core.getPlugin<T>(name);
    }
    return undefined;
  };

  // Export Gun pair functionality
  const exportGunPair = async (password?: string): Promise<string> => {
    if (!core) {
      throw new Error("SDK not initialized");
    }

    if (!isLoggedIn) {
      throw new Error("User not authenticated");
    }

    try {
      const pair =
        sessionStorage.getItem("gun/pair") || sessionStorage.getItem("pair");

      if (!pair) {
        throw new Error("No Gun pair available for current user");
      }

      let pairData = JSON.stringify(pair);

      // If password provided, encrypt the pair
      if (password && password.trim()) {
        // Use Gun's SEA for encryption if available
        if ((window as any).SEA && (window as any).SEA.encrypt) {
          pairData = await (window as any).SEA.encrypt(pairData, password);
        } else {
          console.warn("SEA encryption not available, exporting unencrypted");
        }
      }

      return pairData;
    } catch (error: any) {
      throw new Error(`Failed to export Gun pair: ${error.message}`);
    }
  };

  // Import Gun pair functionality
  const importGunPair = async (
    pairData: string,
    password?: string
  ): Promise<boolean> => {
    if (!core) {
      throw new Error("SDK not initialized");
    }

    try {
      let dataString = pairData;

      // If password provided, decrypt the pair
      if (password && password.trim()) {
        if ((window as any).SEA && (window as any).SEA.decrypt) {
          dataString = await (window as any).SEA.decrypt(pairData, password);
          if (!dataString) {
            throw new Error("Failed to decrypt pair data - wrong password?");
          }
        } else {
          console.warn(
            "SEA decryption not available, assuming unencrypted data"
          );
        }
      }

      const pair = JSON.parse(dataString);

      // Validate pair structure
      if (!pair.pub || !pair.priv || !pair.epub || !pair.epriv) {
        throw new Error("Invalid pair structure - missing required keys");
      }

      // Authenticate with the imported pair
      const result = await login("pair", pair);

      return result.success;
    } catch (error: any) {
      throw new Error(`Failed to import Gun pair: ${error.message}`);
    }
  };

  // Plugin initialization removed - GunAdvancedPlugin no longer available
  const gunPlugin = null;


  // Plugin hooks removed - GunAdvancedPlugin no longer available
  const pluginHooks: PluginHooks = {};

  const completePendingSignup = React.useCallback(() => {
    setHasPendingSignup(false);
  }, [setHasPendingSignup]);

  // Create a properly typed context value
  const contextValue: ShogunContextType = React.useMemo(
    () => ({
      core,
      options,
      isLoggedIn,
      userPub,
      username,
      login,
      signUp,
      logout,
      observe,
      hasPlugin,
      getPlugin,
      exportGunPair,
      importGunPair,
      setProvider,
      gunPlugin,
      completePendingSignup,
      hasPendingSignup,
      setHasPendingSignup,
      put: async (path: string, data: any) => {
        if (isShogunCore(core)) {
          if (!core.gun) throw new Error('Gun instance not available');
          return new Promise((resolve, reject) => {
            core.gun.get(path).put(data, (ack: any) => {
              if (ack.err) reject(new Error(ack.err));
              else resolve();
            });
          });
        } else {
          throw new Error('Core not available');
        }
      },
      get: (path: string) => {
        if (isShogunCore(core)) {
          if (!core.gun) return null;
          return core.gun.get(path);
        }
        return null;
      },
      remove: async (path: string) => {
        if (isShogunCore(core)) {
          if (!core.gun) throw new Error('Gun instance not available');
          return new Promise((resolve, reject) => {
            core.gun.get(path).put(null, (ack: any) => {
              if (ack.err) reject(new Error(ack.err));
              else resolve();
            });
          });
        } else {
          throw new Error('Core not available');
        }
      },
    }),
    [
      core,
      options,
      isLoggedIn,
      userPub,
      username,
      login,
      signUp,
      logout,
      observe,
      hasPlugin,
      getPlugin,
      exportGunPair,
      importGunPair,
      gunPlugin,
      pluginHooks,
      completePendingSignup,
      hasPendingSignup,
      setHasPendingSignup,
    ]
  );

  // Provide the context value to children
  return (
    <ShogunContext.Provider value={contextValue}>
      {children}
    </ShogunContext.Provider>
  );
}

// Define the type for the ShogunButton component
type ShogunButtonComponent = React.FC & {
  Provider: typeof ShogunButtonProvider;
  useShogun: typeof useShogun;
};

// SVG Icons Components
const WalletIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
  </svg>
);

const KeyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="7.5" cy="15.5" r="5.5"></circle>
    <path d="m21 2-9.6 9.6"></path>
    <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
  </svg>
);

const NostrIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19.5 4.5 15 9l-3-3-4.5 4.5L9 12l-1.5 1.5L12 18l4.5-4.5L15 12l1.5-1.5L21 6l-1.5-1.5Z"></path>
    <path d="M12 12 6 6l-1.5 1.5L9 12l-4.5 4.5L6 18l6-6Z"></path>
  </svg>
);

const WebAuthnIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M7 11v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-4"></path>
    <path d="M14 4V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LockIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ImportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="12" y1="17" x2="12" y2="9"></line>
  </svg>
);

const ZkProofIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
    <path d="M2 17l10 5 10-5"></path>
    <path d="M2 12l10 5 10-5"></path>
  </svg>
);

const ChallengeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

const ExportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="12" y1="11" x2="12" y2="21"></line>
    <polyline points="16,15 12,11 8,15"></polyline>
  </svg>
);

// Component for Shogun login button
export const ShogunButton: ShogunButtonComponent = (() => {
  const Button: React.FC = () => {
    const {
      isLoggedIn,
      username,
      logout,
      login,
      signUp,
      core,
      options,
      exportGunPair,
      importGunPair,
      hasPlugin,
      hasPendingSignup,
      setHasPendingSignup,
    } = useShogun();

    // Form states
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formUsername, setFormUsername] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formPasswordConfirm, setFormPasswordConfirm] = useState("");
    const [formHint, setFormHint] = useState("");
    const [formSecurityQuestion] = useState("What is your favorite color?"); // Hardcoded for now
    const [formSecurityAnswer, setFormSecurityAnswer] = useState("");
    const [formMode, setFormMode] = useState<"login" | "signup">("login");
    const [authView, setAuthView] = useState<
      | "options"
      | "password"
      | "recover"
      | "showHint"
      | "export"
      | "import"
      | "webauthn-username"
      | "webauthn-signup-result"
      | "webauthn-recovery"
      | "zkproof-login"
      | "zkproof-signup-result"
      | "challenge-username"
      | "seed-login"
    >("options");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [recoveredHint, setRecoveredHint] = useState("");
    const [exportPassword, setExportPassword] = useState("");
    const [importPassword, setImportPassword] = useState("");
    const [importPairData, setImportPairData] = useState("");
    const [exportedPair, setExportedPair] = useState("");
    const [showCopySuccess, setShowCopySuccess] = useState(false);
    const [showImportSuccess, setShowImportSuccess] = useState(false);
    const [zkTrapdoor, setZkTrapdoor] = useState("");
    const [zkSignupTrapdoor, setZkSignupTrapdoor] = useState("");
    const [showZkTrapdoorCopySuccess, setShowZkTrapdoorCopySuccess] =
      useState(false);
    const [webauthnSeedPhrase, setWebauthnSeedPhrase] = useState("");
    const [webauthnRecoverySeed, setWebauthnRecoverySeed] = useState("");
    const [formMnemonic, setFormMnemonic] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setDropdownOpen(false);
        }
      };

      if (dropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
          document.removeEventListener("mousedown", handleClickOutside);
        };
      }
    }, [dropdownOpen]);

    useEffect(() => {
      if (hasPendingSignup) {
        setModalIsOpen(true);

        if (
          authView !== "webauthn-signup-result" &&
          authView !== "zkproof-signup-result"
        ) {
          if (webauthnSeedPhrase) {
            setAuthView("webauthn-signup-result");
          } else if (zkSignupTrapdoor) {
            setAuthView("zkproof-signup-result");
          }
        }
      }
    }, [hasPendingSignup, authView, webauthnSeedPhrase, zkSignupTrapdoor]);

    // If already logged in, show only logout button
    if (isLoggedIn && username && !modalIsOpen) {
      return (
        <div className="shogun-logged-in-container">
          <div className="shogun-dropdown" ref={dropdownRef}>
            <button
              className="shogun-button shogun-logged-in"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="shogun-avatar">
                {username.substring(0, 2).toUpperCase()}
              </div>
              <span className="shogun-username">
                {username.length > 12
                  ? `${username.substring(0, 6)}...${username.substring(username.length - 4)}`
                  : username}
              </span>
            </button>

            {dropdownOpen && (
              <div className="shogun-dropdown-menu">
                <div className="shogun-dropdown-header">
                  <div className="shogun-avatar-large">
                    {username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="shogun-user-info">
                    <span className="shogun-username-full">
                      {username.length > 20
                        ? `${username.substring(0, 10)}...${username.substring(username.length - 6)}`
                        : username}
                    </span>
                  </div>
                </div>
                <div
                  className="shogun-dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    setAuthView("export");
                    setModalIsOpen(true);
                  }}
                >
                  <ExportIcon />
                  <span>Export Pair</span>
                </div>
                <div className="shogun-dropdown-item" onClick={logout}>
                  <LogoutIcon />
                  <span>Disconnect</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Event handlers
    const handleAuth = async (method: string, ...args: any[]) => {
      console.log(`[DEBUG] handleAuth called with method: ${method}, formMode: ${formMode}, args:`, args);
      setError("");
      setLoading(true);

      try {
        // Use formMode to determine whether to call login or signUp
        const action = formMode === "login" ? login : signUp;
        console.log(`[DEBUG] handleAuth calling action: ${action.name}, method: ${method}`);
        const result = await action(method, ...args);
        console.log(`[DEBUG] handleAuth result:`, result);

        if (result && !result.success && result.error) {
          setError(result.error);
        } else if (result && result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          const shouldShowWebauthnSeed =
            formMode === "signup" &&
            method === "webauthn" &&
            result &&
            result.success &&
            (result as any).seedPhrase;

          if (shouldShowWebauthnSeed) {
            setWebauthnSeedPhrase((result as any).seedPhrase);
            setShowCopySuccess(false);
            setAuthView("webauthn-signup-result");
          } else {
            setModalIsOpen(false);
          }
        }
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      console.log(`[DEBUG] handleSubmit called, formMode: ${formMode}, username: ${formUsername}`);
      setError("");
      setLoading(true);

      try {
        if (formMode === "signup") {
          const result = await signUp(
            "password",
            formUsername,
            formPassword,
            formPasswordConfirm
          );
          if (result && result.success) {
            // Password hint functionality has been removed from shogun-core
            // Users should store hints manually in their own data structures if needed
            if (isShogunCore(core) && core.db && formHint) {
              try {
                // Store hint manually in user data
                const user = core.gun.user();
                if (user && user.is) {
                  core.db.gun.get('users').get(formUsername).get('hint').put(formHint);
                  if (formSecurityAnswer) {
                    core.db.gun.get('users').get(formUsername).get('security').put({
                      question: formSecurityQuestion,
                      answer: formSecurityAnswer
                    });
                  }
                }
              } catch (error) {
                console.warn('Failed to store password hint:', error);
              }
            }
            setModalIsOpen(false);
          } else if (result && result.error) {
            setError(result.error);
          }
        } else {
          await handleAuth("password", formUsername, formPassword);
        }
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    const handleWebAuthnAuth = () => {
      if (!hasPlugin("webauthn")) {
        setError("WebAuthn is not supported in your browser");
        return;
      }
      setAuthView("webauthn-username");
    };

    const handleWebauthnImport = async () => {
      setError("");
      setLoading(true);
      try {
        const username = formUsername.trim();
        const recoveryCode = webauthnRecoverySeed.trim();

        if (!username) {
          throw new Error("Please enter your username");
        }

        if (!recoveryCode) {
          throw new Error("Please enter your recovery code");
        }

        if (!isShogunCore(core)) {
          throw new Error("WebAuthn recovery requires ShogunCore");
        }

        const result = await signUp("webauthn", username, {
          seedPhrase: recoveryCode,
          generateSeedPhrase: false,
        });

        if (!result || !result.success) {
          throw new Error(result?.error || "Failed to restore account");
        }

        const seedToDisplay =
          (result as any).seedPhrase || recoveryCode;
        setWebauthnSeedPhrase(seedToDisplay);
        setWebauthnRecoverySeed("");
        setShowCopySuccess(false);
        setAuthView("webauthn-signup-result");
      } catch (e: any) {
        setError(e.message || "Failed to restore WebAuthn account");
      } finally {
        setLoading(false);
      }
    };

    const handleZkProofAuth = () => {
      if (!hasPlugin("zkproof")) {
        setError("ZK-Proof plugin not available");
        return;
      }
      
      if (formMode === "login") {
        setAuthView("zkproof-login");
      } else {
        // For signup, directly call signUp and show trapdoor
        handleZkProofSignup();
      }
    };

    const handleZkProofLogin = async () => {
      setError("");
      setLoading(true);
      try {
        if (!zkTrapdoor.trim()) {
          throw new Error("Please enter your trapdoor");
        }
        
        await handleAuth("zkproof", zkTrapdoor);
        setModalIsOpen(false);
      } catch (e: any) {
        setError(e.message || "ZK-Proof login failed");
      } finally {
        setLoading(false);
      }
    };

    const handleZkProofSignup = async () => {
      setError("");
      setLoading(true);
      try {
        const result = await signUp("zkproof");
        if (!result || !result.success) {
          throw new Error(result?.error || "ZK-Proof signup failed");
        }
        const trapdoorValue =
          (result as any).seedPhrase || (result as any).trapdoor || "";
        if (trapdoorValue) {
          setZkSignupTrapdoor(trapdoorValue);
          setShowZkTrapdoorCopySuccess(false);
          setAuthView("zkproof-signup-result");
          setHasPendingSignup(true);
        } else {
          setAuthView("options");
          setModalIsOpen(false);
        }
      } catch (e: any) {
        setError(e.message || "ZK-Proof signup failed");
      } finally {
        setLoading(false);
      }
    };

    const handleChallengeAuth = () => {
      if (!hasPlugin("challenge")) {
        setError("Challenge plugin not available");
        return;
      }
      setAuthView("challenge-username");
    };

    const handleChallengeLogin = async () => {
      setError("");
      setLoading(true);
      try {
        if (!formUsername.trim()) {
          throw new Error("Please enter your username");
        }
        await handleAuth("challenge", formUsername);
        setModalIsOpen(false);
      } catch (e: any) {
        setError(e.message || "Challenge login failed");
      } finally {
        setLoading(false);
      }
    };

    const handleSeedLogin = async () => {
      setError("");
      setLoading(true);
      try {
        if (!formUsername.trim()) {
          throw new Error("Please enter your username");
        }
        if (!formMnemonic.trim()) {
          throw new Error("Please enter your seed phrase");
        }
        await handleAuth("seed", formUsername.trim(), formMnemonic.trim());
        setModalIsOpen(false);
      } catch (e: any) {
        setError(e.message || "Seed login failed");
      } finally {
        setLoading(false);
      }
    };

    const handleRecover = async () => {
      setError("");
      setLoading(true);
      try {
        if (isShogunCore(core) && core.db) {
          // Password recovery functionality has been removed from shogun-core
          // Users should implement their own recovery logic using Gun's get operations
          try {
            const hintNode = await new Promise<string | null>((resolve) => {
              core.db.gun.get('users').get(formUsername).get('hint').once((hint: any) => {
                resolve(hint || null);
              });
            });

            const securityNode = await new Promise<any>((resolve) => {
              core.db.gun.get('users').get(formUsername).get('security').once((security: any) => {
                resolve(security || null);
              });
            });

            if (securityNode && securityNode.answer === formSecurityAnswer) {
              if (hintNode) {
                setRecoveredHint(hintNode);
                setAuthView("showHint");
              } else {
                setError("No hint found for this user.");
              }
            } else {
              setError("Security answer is incorrect.");
            }
          } catch (error: any) {
            setError(error.message || "Could not recover hint.");
          }
        } else {
          setError("Password recovery requires ShogunCore");
        }
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    const handleExportPair = async () => {
      setError("");
      setLoading(true);
      try {
        const pairData = await exportGunPair(exportPassword || undefined);
        setExportedPair(pairData);

        // Copy to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(pairData);
          setShowCopySuccess(true);
          setTimeout(() => setShowCopySuccess(false), 3000);
        }
      } catch (e: any) {
        setError(e.message || "Failed to export pair");
      } finally {
        setLoading(false);
      }
    };

    const handleImportPair = async () => {
      setError("");
      setLoading(true);
      try {
        if (!importPairData.trim()) {
          throw new Error("Please enter pair data");
        }

        const success = await importGunPair(
          importPairData,
          importPassword || undefined
        );
        if (success) {
          setShowImportSuccess(true);
          // Chiudiamo il modal con un piccolo delay per permettere all'utente di vedere il successo
          setTimeout(() => {
            setModalIsOpen(false);
            setShowImportSuccess(false);
          }, 1500);
        } else {
          throw new Error("Failed to import pair");
        }
      } catch (e: any) {
        setError(e.message || "Failed to import pair");
      } finally {
        setLoading(false);
      }
    };

    const resetForm = () => {
      setFormUsername("");
      setFormPassword("");
      setFormPasswordConfirm("");
      setFormHint("");
      setFormSecurityAnswer("");
      setError("");
      setLoading(false);
      setAuthView("options");
      setExportPassword("");
      setImportPassword("");
      setImportPairData("");
      setExportedPair("");
      setShowCopySuccess(false);
      setShowImportSuccess(false);
      setRecoveredHint("");
      setZkTrapdoor("");
      setZkSignupTrapdoor("");
      setShowZkTrapdoorCopySuccess(false);
      setWebauthnSeedPhrase("");
      setWebauthnRecoverySeed("");
      setFormMnemonic("");
    };

    const openModal = () => {
      resetForm();
      setAuthView("options");
      setModalIsOpen(true);
    };

    const closeModal = () => {
      setError("");
      setModalIsOpen(false);
      setHasPendingSignup(false);
    };

    const finalizeZkProofSignup = () => {
      setError("");
      resetForm();
      setModalIsOpen(false);
      setHasPendingSignup(false);
    };

    const toggleMode = () => {
      resetForm();
      setAuthView("options"); // Porta alla selezione dei metodi invece che direttamente al form password
      setFormMode((prev) => (prev === "login" ? "signup" : "login"));
    };

    // Add buttons for both login and signup for alternative auth methods
    const renderAuthOptions = () => (
      <div className="shogun-auth-options">
        {options.showMetamask !== false && hasPlugin("web3") && (
          <div className="shogun-auth-option-group">
            <button
              type="button"
              className="shogun-auth-option-button"
              onClick={() => handleAuth("web3")}
              disabled={loading}
            >
              <WalletIcon />
              {formMode === "login"
                ? "Login with MetaMask"
                : "Signup with MetaMask"}
            </button>
          </div>
        )}

        {options.showWebauthn !== false && hasPlugin("webauthn") && (
          <div className="shogun-auth-option-group">
            <button
              type="button"
              className="shogun-auth-option-button"
              onClick={handleWebAuthnAuth}
              disabled={loading}
            >
              <WebAuthnIcon />
              {formMode === "login"
                ? "Login with WebAuthn"
                : "Signup with WebAuthn"}
            </button>
          </div>
        )}

        {options.showNostr !== false && hasPlugin("nostr") && (
          <div className="shogun-auth-option-group">
            <button
              type="button"
              className="shogun-auth-option-button"
              onClick={() => handleAuth("nostr")}
              disabled={loading}
            >
              <NostrIcon />
              {formMode === "login" ? "Login with Nostr" : "Signup with Nostr"}
            </button>
          </div>
        )}

        {options.showChallenge !== false && hasPlugin("challenge") && (
          <div className="shogun-auth-option-group">
            <button
               type="button"
               className="shogun-auth-option-button"
               onClick={handleChallengeAuth}
               disabled={loading}
            >
               <ChallengeIcon />
               {formMode === "login"
                 ? "Login with Challenge"
                 : "Signup with Challenge (N/A)"}
            </button>
          </div>
        )}

        {options.showZkProof !== false && hasPlugin("zkproof") && (
          <div className="shogun-auth-option-group">
            <button
              type="button"
              className="shogun-auth-option-button"
              onClick={handleZkProofAuth}
              disabled={loading}
            >
              <ZkProofIcon />
              {formMode === "login"
                ? "Login with ZK-Proof"
                : "Signup with ZK-Proof"}
            </button>
          </div>
        )}

        <div className="shogun-divider">
          <span>or</span>
        </div>

        <button
          type="button"
          className="shogun-auth-option-button"
          onClick={() => setAuthView("password")}
          disabled={loading}
        >
          <LockIcon />
          {formMode === "login"
            ? "Login with Password"
            : "Signup with Password"}
        </button>

        {options.showSeedLogin !== false && formMode === "login" && (
          <button
            type="button"
            className="shogun-auth-option-button"
            onClick={() => setAuthView("seed-login")}
            disabled={loading}
          >
            <KeyIcon />
            Login with Seed phrase
          </button>
        )}

        {formMode === "login" && (
          <button
            type="button"
            className="shogun-auth-option-button"
            onClick={() => setAuthView("import")}
            disabled={loading}
          >
            <ImportIcon />
            Import Gun Pair
          </button>
        )}
      </div>
    );

    const renderPasswordForm = () => (
      <form onSubmit={handleSubmit} className="shogun-auth-form">
        <div className="shogun-form-group">
          <label htmlFor="username">
            <UserIcon />
            <span>Username</span>
          </label>
          <input
            type="text"
            id="username"
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your username"
          />
        </div>
        <div className="shogun-form-group">
          <label htmlFor="password">
            <LockIcon />
            <span>Password</span>
          </label>
          <input
            type="password"
            id="password"
            value={formPassword}
            onChange={(e) => setFormPassword(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your password"
          />
        </div>
        {formMode === "signup" && (
          <>
            <div className="shogun-form-group">
              <label htmlFor="passwordConfirm">
                <KeyIcon />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                id="passwordConfirm"
                value={formPasswordConfirm}
                onChange={(e) => setFormPasswordConfirm(e.target.value)}
                disabled={loading}
                required
                placeholder="Confirm your password"
              />
            </div>
            <div className="shogun-form-group">
              <label htmlFor="hint">
                <UserIcon />
                <span>Password Hint</span>
              </label>
              <input
                type="text"
                id="hint"
                value={formHint}
                onChange={(e) => setFormHint(e.target.value)}
                disabled={loading}
                required
                placeholder="Enter your password hint"
              />
            </div>
            <div className="shogun-form-group">
              <label htmlFor="securityQuestion">
                <UserIcon />
                <span>Security Question</span>
              </label>
              <input
                type="text"
                id="securityQuestion"
                value={formSecurityQuestion}
                disabled={true}
              />
            </div>
            <div className="shogun-form-group">
              <label htmlFor="securityAnswer">
                <UserIcon />
                <span>Security Answer</span>
              </label>
              <input
                type="text"
                id="securityAnswer"
                value={formSecurityAnswer}
                onChange={(e) => setFormSecurityAnswer(e.target.value)}
                disabled={loading}
                required
                placeholder="Enter your security answer"
              />
              </div>
            </>
        )}
        
        <button
          type="submit"
          className="shogun-submit-button"
          disabled={loading}
        >
          {loading
            ? "Processing..."
            : formMode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
        <div className="shogun-form-footer">
          <button
            type="button"
            className="shogun-toggle-mode shogun-prominent-toggle"
            onClick={toggleMode}
            disabled={loading}
          >
            {formMode === "login"
              ? "Don't have an account? Sign up"
              : "Already have an account? Log in"}
          </button>
          {formMode === "login" && (
            <button
              type="button"
              className="shogun-toggle-mode"
              onClick={() => setAuthView("recover")}
              disabled={loading}
            >
              Forgot password?
            </button>
          )}
        </div>
      </form>
    );

    const renderWebAuthnUsernameForm = () => (
      <div className="shogun-auth-form">
        <h3>
          {formMode === "login"
            ? "Login with WebAuthn"
            : "Sign Up with WebAuthn"}
        </h3>
        <div
          style={{
            backgroundColor: "#f0f9ff",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #0ea5e9",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#0c4a6e",
              margin: "0",
              fontWeight: "500",
            }}
          >
            🔑 WebAuthn Authentication
          </p>
          <p
            style={{ fontSize: "13px", color: "#075985", margin: "4px 0 0 0" }}
          >
            Please enter your username to continue with WebAuthn{" "}
            {formMode === "login" ? "login" : "registration"}.
          </p>
        </div>
        <div className="shogun-form-group">
          <label htmlFor="username">
            <UserIcon />
            <span>Username</span>
          </label>
          <input
            type="text"
            id="username"
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your username"
            autoFocus
          />
        </div>
        <button
          type="button"
          className="shogun-submit-button"
          onClick={() => handleAuth("webauthn", formUsername)}
          disabled={loading || !formUsername.trim()}
        >
          {loading ? "Processing..." : `Continue with WebAuthn`}
        </button>
        <div className="shogun-form-footer">
          <button
            type="button"
            className="shogun-back-button"
            onClick={() => setAuthView("options")}
            disabled={loading}
          >
            &larr; Back to Options
          </button>
          {formMode === "login" && (
            <button
              type="button"
              className="shogun-toggle-mode"
              onClick={() => setAuthView("webauthn-recovery")}
              disabled={loading}
            >
              Restore with Recovery Code
            </button>
          )}
        </div>
      </div>
    );

    const renderWebauthnRecoveryForm = () => (
      <div className="shogun-auth-form">
        <h3>Restore WebAuthn Account</h3>
        <div
          style={{
            backgroundColor: "#fef3c7",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #f59e0b",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#92400e",
              margin: "0",
              fontWeight: "500",
            }}
          >
            ⚠️ Recovery Required
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#a16207",
              margin: "4px 0 0 0",
            }}
          >
            Enter the username and recovery code saved during signup to restore
            access on this device.
          </p>
        </div>
        <div className="shogun-form-group">
          <label htmlFor="recoveryUsername">
            <UserIcon />
            <span>Username</span>
          </label>
          <input
            type="text"
            id="recoveryUsername"
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
            disabled={loading}
            placeholder="Enter your username"
            autoFocus
          />
        </div>
        <div className="shogun-form-group">
          <label htmlFor="recoverySeed">
            <KeyIcon />
            <span>Recovery Code</span>
          </label>
          <textarea
            id="recoverySeed"
            value={webauthnRecoverySeed}
            onChange={(e) => setWebauthnRecoverySeed(e.target.value)}
            disabled={loading}
            placeholder="Enter your WebAuthn seed phrase..."
            rows={4}
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              width: "100%",
              padding: "8px",
              border: "1px solid #f59e0b",
              borderRadius: "4px",
              backgroundColor: "#fffbeb",
            }}
          />
        </div>
        <button
          type="button"
          className="shogun-submit-button"
          onClick={handleWebauthnImport}
          disabled={loading}
        >
          {loading ? "Restoring..." : "Restore Account"}
        </button>
        <div className="shogun-form-footer">
          <button
            type="button"
            className="shogun-back-button"
            onClick={() => {
              setError("");
              setAuthView("webauthn-username");
            }}
            disabled={loading}
          >
            &larr; Back to WebAuthn
          </button>
        </div>
      </div>
    );

    const renderRecoveryForm = () => (
      <div className="shogun-auth-form">
        <div className="shogun-form-group">
          <label htmlFor="username">
            <UserIcon />
            <span>Username</span>
          </label>
          <input
            type="text"
            id="username"
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your username"
          />
        </div>
        <div className="shogun-form-group">
          <label>Security Question</label>
          <p>{formSecurityQuestion}</p>
        </div>
        <div className="shogun-form-group">
          <label htmlFor="securityAnswer">
            <KeyIcon />
            <span>Answer</span>
          </label>
          <input
            type="text"
            id="securityAnswer"
            value={formSecurityAnswer}
            onChange={(e) => setFormSecurityAnswer(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your answer"
          />
        </div>
        <button
          type="button"
          className="shogun-submit-button"
          onClick={handleRecover}
          disabled={loading}
        >
          {loading ? "Recovering..." : "Get Hint"}
        </button>
        <div className="shogun-form-footer">
          <button
            className="shogun-toggle-mode"
            onClick={() => setAuthView("password")}
            disabled={loading}
          >
            Back to Login
          </button>
        </div>
      </div>
    );

    const renderHint = () => (
      <div className="shogun-auth-form">
        <h3>Your Password Hint</h3>
        <p className="shogun-hint">{recoveredHint}</p>
        <button
          className="shogun-submit-button"
          onClick={() => {
            setAuthView("password");
            resetForm();
            setFormMode("login");
          }}
        >
          Back to Login
        </button>
      </div>
    );

    const renderExportForm = () => (
      <div className="shogun-auth-form">
        <h3>Export Gun Pair</h3>
        <div
          style={{
            backgroundColor: "#f0f9ff",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #0ea5e9",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#0c4a6e",
              margin: "0",
              fontWeight: "500",
            }}
          >
            🔒 Backup Your Account
          </p>
          <p
            style={{ fontSize: "13px", color: "#075985", margin: "4px 0 0 0" }}
          >
            Export your Gun pair to backup your account. You can use this to
            login from another device or restore access if needed.
          </p>
        </div>
        <div className="shogun-form-group">
          <label htmlFor="exportPassword">
            <LockIcon />
            <span>Encryption Password (optional but recommended)</span>
          </label>
          <input
            type="password"
            id="exportPassword"
            value={exportPassword}
            onChange={(e) => setExportPassword(e.target.value)}
            disabled={loading}
            placeholder="Leave empty to export unencrypted"
          />
        </div>
        {exportedPair && (
          <div className="shogun-form-group">
            <label>Your Gun Pair (copy this safely):</label>
            {showCopySuccess && (
              <div
                style={{
                  backgroundColor: "#dcfce7",
                  color: "#166534",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  marginBottom: "8px",
                  fontSize: "14px",
                  border: "1px solid #22c55e",
                }}
              >
                ✅ Copied to clipboard successfully!
              </div>
            )}
            <textarea
              value={exportedPair}
              readOnly
              rows={6}
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            />
            {!navigator.clipboard && (
              <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                ⚠️ Auto-copy not available. Please manually copy the text above.
              </p>
            )}
          </div>
        )}
        <button
          type="button"
          className="shogun-submit-button"
          onClick={handleExportPair}
          disabled={loading}
        >
          {loading ? "Exporting..." : "Export Pair"}
        </button>
        <div className="shogun-form-footer">
          <button
            className="shogun-toggle-mode"
            onClick={() => {
              if (isLoggedIn) {
                // If user is logged in, close the modal instead of going to options
                setModalIsOpen(false);
                setExportPassword("");
                setExportedPair("");
              } else {
                setAuthView("options");
                setExportPassword("");
                setExportedPair("");
              }
            }}
            disabled={loading}
          >
            Back
          </button>
        </div>
      </div>
    );

    const renderZkProofLoginForm = () => (
      <div className="shogun-auth-form">
        <h3>Login with ZK-Proof</h3>
        <div
          style={{
            backgroundColor: "#f0f9ff",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #0ea5e9",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#0c4a6e",
              margin: "0",
              fontWeight: "500",
            }}
          >
            🔒 Anonymous Authentication
          </p>
          <p
            style={{ fontSize: "13px", color: "#075985", margin: "4px 0 0 0" }}
          >
            Enter your trapdoor (recovery phrase) to login anonymously using Zero-Knowledge Proofs. Your identity remains private.
          </p>
        </div>
        <div className="shogun-form-group">
          <label htmlFor="zkTrapdoor">
            <KeyIcon />
            <span>Trapdoor / Recovery Phrase</span>
          </label>
          <textarea
            id="zkTrapdoor"
            value={zkTrapdoor}
            onChange={(e) => setZkTrapdoor(e.target.value)}
            disabled={loading}
            placeholder="Enter your trapdoor..."
            rows={4}
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <button
          type="button"
          className="shogun-submit-button"
          onClick={handleZkProofLogin}
          disabled={loading || !zkTrapdoor.trim()}
        >
          {loading ? "Processing..." : "Login Anonymously"}
        </button>
        <div className="shogun-form-footer">
          <button
            className="shogun-toggle-mode"
            onClick={() => setAuthView("options")}
            disabled={loading}
          >
            Back to Login Options
          </button>
        </div>
      </div>
    );

    const renderZkProofSignupResult = () => (
      <div className="shogun-auth-form">
        <h3>ZK-Proof Account Created!</h3>
        <div
          style={{
            backgroundColor: "#fef3c7",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #f59e0b",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#92400e",
              margin: "0",
              fontWeight: "500",
            }}
          >
            ⚠️ Important: Save Your Trapdoor
          </p>
          <p
            style={{ fontSize: "13px", color: "#a16207", margin: "4px 0 0 0" }}
          >
            This trapdoor lets you restore your anonymous identity on new devices.
            Store it securely and never share it.
          </p>
        </div>
        <div className="shogun-form-group">
          <label>Your Trapdoor (Recovery Phrase):</label>
          <textarea
            value={zkSignupTrapdoor}
            readOnly
            rows={4}
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              width: "100%",
              padding: "8px",
              border: "2px solid #f59e0b",
              borderRadius: "4px",
              backgroundColor: "#fffbeb",
            }}
          />
          <button
            type="button"
            className="shogun-submit-button"
            style={{ marginTop: "8px" }}
            onClick={async () => {
              if (!zkSignupTrapdoor) {
                return;
              }
              try {
                if (navigator.clipboard) {
                  await navigator.clipboard.writeText(zkSignupTrapdoor);
                  setShowZkTrapdoorCopySuccess(true);
                  setTimeout(() => setShowZkTrapdoorCopySuccess(false), 3000);
                }
              } catch (copyError) {
                console.warn("Failed to copy trapdoor:", copyError);
              }
            }}
            disabled={!zkSignupTrapdoor}
          >
            Copy Trapdoor
          </button>
          {showZkTrapdoorCopySuccess && (
            <p
              style={{
                color: "#047857",
                fontSize: "12px",
                marginTop: "6px",
              }}
            >
              Trapdoor copied to clipboard!
            </p>
          )}
        </div>
        <div className="shogun-form-footer">
          <button
            type="button"
            className="shogun-submit-button"
            onClick={finalizeZkProofSignup}
          >
            I Saved My Trapdoor
          </button>
        </div>
      </div>
    );

    const renderWebauthnSignupResult = () => (
      <div className="shogun-auth-form">
        <h3>WebAuthn Account Created!</h3>
        <div
          style={{
            backgroundColor: "#fef3c7",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #f59e0b",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#92400e",
              margin: "0",
              fontWeight: "500",
            }}
          >
            ⚠️ Important: Save Your Recovery Code
          </p>
          <p
            style={{ fontSize: "13px", color: "#a16207", margin: "4px 0 0 0" }}
          >
            This seed phrase lets you add new devices or recover your WebAuthn account. Keep it private and store it securely.
          </p>
        </div>
        <div className="shogun-form-group">
          <label>Your WebAuthn Recovery Code (Seed Phrase):</label>
          <textarea
            value={webauthnSeedPhrase}
            readOnly
            rows={4}
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              width: "100%",
              padding: "8px",
              border: "2px solid #f59e0b",
              borderRadius: "4px",
              backgroundColor: "#fffbeb",
            }}
          />
          <button
            type="button"
            className="shogun-submit-button"
            style={{ marginTop: "8px" }}
            onClick={async () => {
              if (navigator.clipboard && webauthnSeedPhrase) {
                await navigator.clipboard.writeText(webauthnSeedPhrase);
                setShowCopySuccess(true);
                setTimeout(() => setShowCopySuccess(false), 3000);
              }
            }}
            disabled={!webauthnSeedPhrase}
          >
            {showCopySuccess ? "✅ Copied!" : "📋 Copy Recovery Code"}
          </button>
          {!navigator.clipboard && (
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              ⚠️ Please manually copy the code above for safekeeping.
            </p>
          )}
        </div>
        <div
          style={{
            backgroundColor: "#dcfce7",
            color: "#166534",
            padding: "12px",
            borderRadius: "8px",
            marginTop: "16px",
            fontSize: "14px",
            border: "1px solid #22c55e",
            textAlign: "center",
          }}
        >
          ✅ You're now logged in with WebAuthn!
        </div>
        <button
          type="button"
          className="shogun-submit-button"
          style={{ marginTop: "16px" }}
          onClick={finalizeZkProofSignup}
        >
          Close and Start Using App
        </button>
      </div>
    );

    const renderChallengeForm = () => (
      <div className="shogun-auth-form">
        <div className="shogun-form-group">
          <label htmlFor="challenge-username">
            <UserIcon />
            <span>Username</span>
          </label>
          <input
            type="text"
            id="challenge-username"
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your username"
            autoFocus
          />
        </div>
        <button
          type="button"
          className="shogun-submit-button"
          onClick={handleChallengeLogin}
          disabled={loading}
        >
          {loading ? "Processing..." : "Continue"}
        </button>
        <button
          type="button"
          className="shogun-back-button"
          onClick={() => setAuthView("options")}
          disabled={loading}
        >
          Back
        </button>
      </div>
    );

    const renderSeedLoginForm = () => (
      <div className="shogun-auth-form">
        <h3>Login with Seed Phrase</h3>
        <div className="shogun-form-group">
          <label htmlFor="seed-username">
            <UserIcon />
            <span>Username</span>
          </label>
          <input
            type="text"
            id="seed-username"
            value={formUsername}
            onChange={(e) => setFormUsername(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your username"
            autoFocus
          />
        </div>
        <div className="shogun-form-group">
          <label htmlFor="seed-mnemonic">
            <KeyIcon />
            <span>Seed Phrase (12/24 words)</span>
          </label>
          <textarea
            id="seed-mnemonic"
            value={formMnemonic}
            onChange={(e) => setFormMnemonic(e.target.value)}
            disabled={loading}
            required
            placeholder="Enter your seed phrase..."
            rows={3}
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <button
          type="button"
          className="shogun-submit-button"
          onClick={handleSeedLogin}
          disabled={loading || !formUsername.trim() || !formMnemonic.trim()}
        >
          {loading ? "Processing..." : "Login with Seed"}
        </button>
        <button
          type="button"
          className="shogun-back-button"
          onClick={() => setAuthView("options")}
          disabled={loading}
        >
          Back
        </button>
      </div>
    );

    const renderImportForm = () => (
      <div className="shogun-auth-form">
        <h3>Import Gun Pair</h3>
        <div
          style={{
            backgroundColor: "#fef3c7",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            border: "1px solid #f59e0b",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#92400e",
              margin: "0",
              fontWeight: "500",
            }}
          >
            🔑 Restore Your Account
          </p>
          <p
            style={{ fontSize: "13px", color: "#a16207", margin: "4px 0 0 0" }}
          >
            Import a Gun pair to login with your existing account from another
            device. Make sure you have your backup data ready.
          </p>
        </div>
        <div className="shogun-form-group">
          <label htmlFor="importPairData">
            <ImportIcon />
            <span>Gun Pair Data</span>
          </label>
          <textarea
            id="importPairData"
            value={importPairData}
            onChange={(e) => setImportPairData(e.target.value)}
            disabled={loading}
            placeholder="Paste your Gun pair JSON here..."
            rows={6}
            style={{
              fontFamily: "monospace",
              fontSize: "12px",
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </div>
        <div className="shogun-form-group">
          <label htmlFor="importPassword">
            <LockIcon />
            <span>Decryption Password (if encrypted)</span>
          </label>
          <input
            type="password"
            id="importPassword"
            value={importPassword}
            onChange={(e) => setImportPassword(e.target.value)}
            disabled={loading}
            placeholder="Enter password if pair was encrypted"
          />
        </div>
        {showImportSuccess && (
          <div
            style={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              border: "1px solid #22c55e",
              textAlign: "center",
            }}
          >
            ✅ Pair imported successfully! Logging you in...
          </div>
        )}
        <button
          type="button"
          className="shogun-submit-button"
          onClick={handleImportPair}
          disabled={loading || showImportSuccess}
        >
          {loading
            ? "Importing..."
            : showImportSuccess
              ? "Success!"
              : "Import and Login"}
        </button>
        <div className="shogun-form-footer">
          <button
            className="shogun-toggle-mode"
            onClick={() => {
              setAuthView("options");
              setImportPassword("");
              setImportPairData("");
            }}
            disabled={loading}
          >
            Back to Login Options
          </button>
        </div>
      </div>
    );

    // Render logic
    return (
      <>
        <button className="shogun-connect-button" onClick={openModal}>
          <WalletIcon />
          <span>Login / Sign Up</span>
        </button>

        {modalIsOpen && (
          <div
            className="shogun-modal-overlay"
            onClick={closeModal}
          >
            <div className="shogun-modal" onClick={(e) => e.stopPropagation()}>
              <div className="shogun-modal-header">
                <h2>
                  {authView === "recover"
                    ? "Recover Password"
                    : authView === "showHint"
                      ? "Password Hint"
                      : authView === "export"
                        ? "Export Gun Pair"
                        : authView === "import"
                          ? "Import Gun Pair"
                          : authView === "webauthn-username"
                            ? "WebAuthn"
                            : authView === "zkproof-login"
                              ? "ZK-Proof Login"
                              : authView === "seed-login"
                                ? "Login with Seed"
                                : formMode === "login"
                                  ? "Login"
                                  : "Sign Up"}
                </h2>
                <button
                  className="shogun-close-button"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="shogun-modal-content">
                {error && <div className="shogun-error-message">{error}</div>}

                {authView === "options" && (
                  <>
                    {renderAuthOptions()}
                    <div className="shogun-form-footer">
                      <button
                        type="button"
                        className="shogun-toggle-mode shogun-prominent-toggle"
                        onClick={toggleMode}
                        disabled={loading}
                      >
                        {formMode === "login"
                          ? "Don't have an account? Sign up"
                          : "Already have an account? Log in"}
                      </button>
                    </div>
                  </>
                )}

                {authView === "seed-login" && renderSeedLoginForm()}

                {authView === "password" && (
                  <>
                    <button
                      className="shogun-back-button"
                      onClick={() => setAuthView("options")}
                    >
                      &larr; Back
                    </button>
                    {renderPasswordForm()}
                  </>
                )}

                {authView === "recover" && renderRecoveryForm()}
                {authView === "showHint" && renderHint()}
                {authView === "export" && renderExportForm()}
                {authView === "import" && renderImportForm()}
                {authView === "webauthn-username" &&
                  renderWebAuthnUsernameForm()}
                {authView === "webauthn-recovery" &&
                  renderWebauthnRecoveryForm()}
                {authView === "webauthn-signup-result" &&
                  renderWebauthnSignupResult()}
                {authView === "zkproof-login" && renderZkProofLoginForm()}
                {authView === "zkproof-signup-result" &&
                  renderZkProofSignupResult()}
                {authView === "challenge-username" &&
                  renderChallengeForm()}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  Button.displayName = "ShogunButton";

  return Object.assign(Button, {
    Provider: ShogunButtonProvider,
    useShogun: useShogun,
  });
})();

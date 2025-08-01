import React, {
  useContext,
  useState,
  createContext,
  useEffect,
  useRef,
} from "react";
import { OAuthPlugin, ShogunCore } from "shogun-core";
import { Observable } from "rxjs";
import "../styles/index.css";

// Definiamo i tipi localmente se non sono disponibili da shogun-core
interface AuthResult {
  success: boolean;
  userPub?: string;
  alias?: string;
  method?: string;
  error?: string;
  redirectUrl?: string;
}

// Context type for ShogunProvider
type ShogunContextType = {
  sdk: ShogunCore | null;
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
  // Plugin methods
  hasPlugin: (name: string) => boolean;
  getPlugin: <T>(name: string) => T | undefined;
  // Pair export/import methods
  exportGunPair: (password?: string) => Promise<string>;
  importGunPair: (pairData: string, password?: string) => Promise<boolean>;
};

// Default context
const defaultShogunContext: ShogunContextType = {
  sdk: null,
  options: {},
  isLoggedIn: false,
  userPub: null,
  username: null,
  login: async () => ({}),
  signUp: async () => ({}),
  logout: () => {},
  observe: () => new Observable<any>(),
  hasPlugin: () => false,
  getPlugin: () => undefined,
  exportGunPair: async () => "",
  importGunPair: async () => false,
};

// Create context using React's createContext directly
const ShogunContext = createContext<ShogunContextType>(defaultShogunContext);

// Custom hook to access the context
export const useShogun = () => useContext(ShogunContext);

// Props for the provider component
type ShogunButtonProviderProps = {
  children: React.ReactNode;
  sdk: ShogunCore;
  options: any;
  onLoginSuccess?: (data: {
    userPub: string;
    username: string;
    password?: string;
    authMethod?: "password" | "web3" | "webauthn" | "nostr" | "oauth";
  }) => void;
  onSignupSuccess?: (data: {
    userPub: string;
    username: string;
    password?: string;
    authMethod?: "password" | "web3" | "webauthn" | "nostr" | "oauth";
  }) => void;
  onError?: (error: string) => void;
  onLogout?: () => void; // AGGIUNTA
};

// Provider component
export function ShogunButtonProvider({
  children,
  sdk,
  options,
  onLoginSuccess,
  onSignupSuccess,
  onError,
  onLogout, // AGGIUNTA
}: ShogunButtonProviderProps) {
  // Use React's useState directly
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userPub, setUserPub] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Effetto per gestire l'inizializzazione e pulizia
  useEffect(() => {
    if (!sdk) return;

    // Verifichiamo se l'utente è già loggato all'inizializzazione
    // Aggiungiamo un controllo di sicurezza per verificare se il metodo esiste
    if (sdk && typeof sdk.isLoggedIn === "function" && sdk.isLoggedIn()) {
      const pub = sdk.gun.user()?.is?.pub;
      if (pub) {
        setIsLoggedIn(true);
        setUserPub(pub);
        setUsername(pub.slice(0, 8) + "...");
      }
    }

    // Poiché il metodo 'on' non esiste su ShogunCore,
    // gestiamo gli stati direttamente nei metodi di login/logout
  }, [sdk, onLoginSuccess]);

  // RxJS observe method
  const observe = <T,>(path: string): Observable<T> => {
    if (!sdk) {
      return new Observable<T>();
    }
    return sdk.rx.observe<T>(path);
  };

  // Unified login
  const login = async (method: string, ...args: any[]) => {
    try {
      if (!sdk) {
        throw new Error("SDK not initialized");
      }

      let result: AuthResult;
      let authMethod = method;
      let username: string | undefined;

      switch (method) {
        case "password":
          username = args[0];
          result = await sdk.login(args[0], args[1]);
          break;
        case "pair":
          // New pair authentication method
          const pair = args[0];
          if (!pair || typeof pair !== "object") {
            throw new Error("Invalid pair data provided");
          }

          result = await new Promise((resolve, reject) => {
            sdk.gun.user().auth(pair, (ack: any) => {
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

          username = (result as any).alias;
          authMethod = "pair";
          break;
        case "webauthn":
          username = args[0];
          const webauthn: any = sdk.getPlugin("webauthn");
          if (!webauthn) throw new Error("WebAuthn plugin not available");
          result = await webauthn.login(username);
          authMethod = "webauthn";
          break;
        case "web3":
          const web3: any = sdk.getPlugin("web3");
          if (!web3) throw new Error("Web3 plugin not available");
          const connectionResult = await web3.connectMetaMask();
          if (!connectionResult.success || !connectionResult.address) {
            throw new Error(
              connectionResult.error || "Failed to connect wallet."
            );
          }
          username = connectionResult.address;
          result = await web3.login(connectionResult.address);
          authMethod = "web3";
          break;
        case "nostr":
          const nostr: any = sdk.getPlugin("nostr");
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
          authMethod = "nostr";
          break;
        case "oauth":
          const oauth: OAuthPlugin = sdk.getPlugin("oauth") as OAuthPlugin;
          if (!oauth) throw new Error("OAuth plugin not available");
          const provider = args[0] || "google";

          // Se abbiamo code e state, significa che siamo in un callback
          if (args[1] && args[2]) {
            const code = args[1];
            const state = args[2];
            result = await oauth.handleOAuthCallback(provider, code, state);
          } else {
            // Altrimenti iniziamo il flusso OAuth normale
            result = await oauth.login(provider);
          }

          authMethod = "oauth";
          if (result.redirectUrl) {
            return result;
          }
          break;
        default:
          throw new Error("Unsupported login method");
      }

      if (result.success) {
        const userPub = result.userPub || sdk.gun.user()?.is?.pub || "";
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
      if (!sdk) {
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
          result = await sdk.signUp(args[0], args[1]);
          break;
        case "webauthn":
          username = args[0];
          const webauthn: any = sdk.getPlugin("webauthn");
          if (!webauthn) throw new Error("WebAuthn plugin not available");
          result = await webauthn.signUp(username);
          break;
        case "web3":
          const web3: any = sdk.getPlugin("web3");
          if (!web3) throw new Error("Web3 plugin not available");
          const connectionResult = await web3.connectMetaMask();
          if (!connectionResult.success || !connectionResult.address) {
            throw new Error(
              connectionResult.error || "Failed to connect wallet."
            );
          }
          username = connectionResult.address;
          result = await web3.signUp(connectionResult.address);
          break;
        case "nostr":
          const nostr: any = sdk.getPlugin("nostr");
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
          break;
        case "oauth":
          const oauth: any = sdk.getPlugin("oauth");
          if (!oauth) throw new Error("OAuth plugin not available");
          const provider = args[0] || "google";

          // Se abbiamo code e state, significa che siamo in un callback
          if (args[1] && args[2]) {
            const code = args[1];
            const state = args[2];
            result = await oauth.handleOAuthCallback(provider, code, state);
          } else {
            // Altrimenti iniziamo il flusso OAuth normale
            result = await oauth.signUp(provider);
          }

          authMethod = "oauth";

          if (result.redirectUrl) {
            return result;
          }
          break;
        default:
          throw new Error("Unsupported signup method");
      }

      if (result.success) {
        const userPub = result.userPub || sdk.gun.user()?.is?.pub || "";
        const displayName =
          result.alias || username || userPub.slice(0, 8) + "...";

        setIsLoggedIn(true);
        setUserPub(userPub);
        setUsername(displayName);

        onSignupSuccess?.({
          userPub: userPub,
          username: displayName,
          authMethod: authMethod as any,
        });
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
    sdk.logout();
    setIsLoggedIn(false);
    setUserPub(null);
    setUsername(null);
    sessionStorage.removeItem("gun/pair");
    sessionStorage.removeItem("gun/session");
    sessionStorage.removeItem("pair");
    if (onLogout) onLogout(); // AGGIUNTA
  };

  const hasPlugin = (name: string): boolean => {
    return sdk && typeof sdk.hasPlugin === "function"
      ? sdk.hasPlugin(name)
      : false;
  };

  const getPlugin = <T,>(name: string): T | undefined => {
    return sdk && typeof sdk.getPlugin === "function"
      ? sdk.getPlugin<T>(name)
      : undefined;
  };

  // Export Gun pair functionality
  const exportGunPair = async (password?: string): Promise<string> => {
    if (!sdk) {
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
    if (!sdk) {
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

  // Provide the context value to children
  return (
    <ShogunContext.Provider
      value={{
        sdk,
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
      }}
    >
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

const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
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
      sdk,
      options,
      exportGunPair,
      importGunPair,
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
    const dropdownRef = useRef<HTMLDivElement>(null);
    // Rimuovi tutto ciò che riguarda oauthPin

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
      setError("");
      setLoading(true);

      try {
        // Use formMode to determine whether to call login or signUp
        const action = formMode === "login" ? login : signUp;
        const result = await action(method, ...args);

        if (result && !result.success && result.error) {
          setError(result.error);
        } else if (result && result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          setModalIsOpen(false);
        }
      } catch (e: any) {
        setError(e.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
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
            if (sdk?.db) {
              await sdk.db.setPasswordHint(
                formUsername,
                formPassword,
                formHint,
                [formSecurityQuestion],
                [formSecurityAnswer]
              );
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
      if (!sdk?.hasPlugin("webauthn")) {
        setError("WebAuthn is not supported in your browser");
        return;
      }
      setAuthView("webauthn-username");
    };

    const handleRecover = async () => {
      setError("");
      setLoading(true);
      try {
        if (!sdk?.db) {
          throw new Error("SDK not ready");
        }
        const result = await sdk.db.forgotPassword(formUsername, [
          formSecurityAnswer,
        ]);
        if (result.success && result.hint) {
          setRecoveredHint(result.hint);
          setAuthView("showHint");
        } else {
          setError(result.error || "Could not recover hint.");
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
      // Rimuovi tutto ciò che riguarda oauthPin
    };

    const openModal = () => {
      resetForm();
      setAuthView("options");
      setModalIsOpen(true);
    };

    const closeModal = () => {
      setModalIsOpen(false);
    };

    const toggleMode = () => {
      resetForm();
      setAuthView("options"); // Porta alla selezione dei metodi invece che direttamente al form password
      setFormMode((prev) => (prev === "login" ? "signup" : "login"));
    };

    // Add buttons for both login and signup for alternative auth methods
    const renderAuthOptions = () => (
      <div className="shogun-auth-options">
        {options.showMetamask !== false && sdk?.hasPlugin("web3") && (
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

        {options.showWebauthn !== false && sdk?.hasPlugin("webauthn") && (
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

        {options.showNostr !== false && sdk?.hasPlugin("nostr") && (
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

        {options.showOauth !== false && sdk?.hasPlugin("oauth") && (
          <div className="shogun-auth-option-group">
            <button
              type="button"
              className="shogun-auth-option-button shogun-google-button"
              onClick={() => handleAuth("oauth", "google")}
              disabled={loading}
            >
              <GoogleIcon />
              {formMode === "login"
                ? "Login with Google"
                : "Signup with Google"}
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
          <div className="shogun-modal-overlay" onClick={closeModal}>
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

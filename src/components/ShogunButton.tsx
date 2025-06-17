import React, { useContext, useState, createContext, useEffect } from "react";
import { ShogunCore, AuthResult } from "shogun-core";
import { Observable } from "rxjs";
import "../types.js"; // Import type file to extend definitions

import "../styles/index.css";

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
  setProvider: (provider: any) => boolean;
  // Plugin methods
  hasPlugin: (name: string) => boolean;
  getPlugin: <T>(name: string) => T | undefined;
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
  setProvider: () => false,
  hasPlugin: () => false,
  getPlugin: () => undefined,
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
};

// Provider component
export function ShogunButtonProvider({
  children,
  sdk,
  options,
  onLoginSuccess,
  onSignupSuccess,
  onError,
}: ShogunButtonProviderProps) {
  // Use React's useState directly
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(
    sdk?.isLoggedIn() || false
  );
  const [userPub, setUserPub] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Effetto per gestire l'inizializzazione e pulizia
  useEffect(() => {
    // Controlla se l'utente è già autenticato all'avvio
    if (sdk?.isLoggedIn()) {
      setIsLoggedIn(true);
    }

    return () => {
      // Pulizia quando il componente si smonta
    };
  }, [sdk]);

  // RxJS observe method
  const observe = <T,>(path: string): Observable<T> => {
    if (!sdk) {
      return new Observable<T>();
    }
    return sdk.observe<T>(path);
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
        case "webauthn":
          username = args[0];
          const webauthn: any = sdk.getPlugin("webauthn");
          if (!webauthn) throw new Error("WebAuthn plugin not available");
          result = await webauthn.login(username);
          break;
        case "web3":
          const web3: any = sdk.getPlugin("web3");
          if (!web3) throw new Error("Web3 plugin not available");
          const connectionResult = await web3.connectMetaMask();
          if (!connectionResult.success || !connectionResult.address) {
            throw new Error(connectionResult.error || "Failed to connect wallet.");
          }
          username = connectionResult.address;
          result = await web3.login(connectionResult.address);
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
          break;
        case "oauth":
          const oauth: any = sdk.getPlugin("oauth");
          if (!oauth) throw new Error("OAuth plugin not available");
          const provider = args[0] || "google";
          result = await oauth.login(provider);
          authMethod = "oauth";

          if (result.redirectUrl) {
            return result;
          }
          break;
        default:
          throw new Error("Unsupported login method");
      }

      if (result.success) {
        setIsLoggedIn(true);
        setUserPub(result.userPub || "");
        setUsername(username || "");

        onLoginSuccess?.({
          userPub: result.userPub || "",
          username: username || "",
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
            throw new Error(connectionResult.error || "Failed to connect wallet.");
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
          result = await oauth.signUp(provider);
          authMethod = "oauth";

          if (result.redirectUrl) {
            return result;
          }
          break;
        default:
          throw new Error("Unsupported signup method");
      }

      if (result.success) {
        setIsLoggedIn(true);
        const userPub = result.userPub || "";
        setUserPub(userPub);
        setUsername(username || "");

        onSignupSuccess?.({
          userPub: userPub,
          username: username || "",
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
  };

  // Implementazione del metodo setProvider
  const setProvider = (provider: any): boolean => {
    if (!sdk) {
      return false;
    }

    try {
      let newProviderUrl: string | null = null;
      
      if (provider && provider.connection && provider.connection.url) {
        newProviderUrl = provider.connection.url;
      } 
      else if (typeof provider === 'string') {
        newProviderUrl = provider;
      }
      
      if (newProviderUrl) {
        if (typeof sdk.setRpcUrl === 'function') {
          return sdk.setRpcUrl(newProviderUrl);
        }
      }
      return false;
    } catch (error) {
      console.error("Error setting provider:", error);
      return false;
    }
  };

  const hasPlugin = (name: string): boolean => {
    return sdk ? sdk.hasPlugin(name) : false;
  };

  const getPlugin = <T,>(name: string): T | undefined => {
    return sdk ? sdk.getPlugin<T>(name) : undefined;
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
        setProvider,
        hasPlugin,
        getPlugin,
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
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
  </svg>
);

const KeyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7.5" cy="15.5" r="5.5"></circle>
    <path d="m21 2-9.6 9.6"></path>
    <path d="m15.5 7.5 3 3L22 7l-3-3"></path>
  </svg>
);

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const NostrIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19.5 4.5 15 9l-3-3-4.5 4.5L9 12l-1.5 1.5L12 18l4.5-4.5L15 12l1.5-1.5L21 6l-1.5-1.5Z"></path>
    <path d="M12 12 6 6l-1.5 1.5L9 12l-4.5 4.5L6 18l6-6Z"></path>
  </svg>
);

const WebAuthnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 11v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-4"></path>
    <path d="M14 4V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Component for Shogun login button
export const ShogunButton: ShogunButtonComponent = (() => {
  const Button: React.FC = () => {
    const { isLoggedIn, username, logout, login, signUp, sdk, options } =
      useShogun();

    // Form states
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [formUsername, setFormUsername] = useState("");
    const [formPassword, setFormPassword] = useState("");
    const [formPasswordConfirm, setFormPasswordConfirm] = useState("");
    const [formMode, setFormMode] = useState<"login" | "signup">("login");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // If already logged in, show only logout button
    if (isLoggedIn && username) {
      return (
        <div className="shogun-logged-in-container">
          <div className="shogun-dropdown">
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
                  : username
                }
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
                        : username
                      }
                    </span>
                  </div>
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

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleAuth("password", formUsername, formPassword, formPasswordConfirm);
    };

    const handleWeb3Auth = () => handleAuth("web3");

    const handleWebAuthnAuth = () => {
      if (!sdk?.hasPlugin("webauthn")) {
        setError("WebAuthn is not supported in your browser");
        return;
      }
      if (!formUsername) {
        setError("Username required for WebAuthn");
        return;
      }
      handleAuth("webauthn", formUsername);
    };

    const handleNostrAuth = () => handleAuth("nostr");

    const handleOAuth = (provider: string) => handleAuth("oauth", provider);

    const resetForm = () => {
      setFormUsername("");
      setFormPassword("");
      setFormPasswordConfirm("");
      setError("");
      setLoading(false);
    };

    const openModal = () => {
      resetForm();
      setModalIsOpen(true);
    };

    const closeModal = () => {
      setModalIsOpen(false);
    };

    const toggleMode = () => {
      resetForm();
      setFormMode((prev) => (prev === "login" ? "signup" : "login"));
    };

    // Render logic
    return (
      <>
        <button className="shogun-connect-button" onClick={openModal}>
          <WalletIcon />
          <span>Connect</span>
        </button>

        {modalIsOpen && (
          <div className="shogun-modal-overlay" onClick={closeModal}>
            <div className="shogun-modal" onClick={(e) => e.stopPropagation()}>
              <div className="shogun-modal-header">
                <h2>{formMode === "login" ? "Sign In" : "Create Account"}</h2>
                <button className="shogun-close-button" onClick={closeModal}>
                  <CloseIcon />
                </button>
              </div>
              <div className="shogun-modal-content">
                {error && <div className="shogun-error-message">{error}</div>}

                <div className="shogun-auth-options">
                  {options?.showMetamask && sdk?.hasPlugin("web3") && (
                    <button
                      className="shogun-auth-option-button"
                      onClick={handleWeb3Auth}
                      disabled={loading}
                    >
                      <WalletIcon />
                      <span>Continue with Wallet</span>
                    </button>
                  )}

                  {options?.showWebauthn && sdk?.hasPlugin("webauthn") && (
                    <button
                      className="shogun-auth-option-button"
                      onClick={handleWebAuthnAuth}
                      disabled={loading}
                    >
                      <WebAuthnIcon />
                      <span>Continue with Passkey</span>
                    </button>
                  )}

                  {options?.showNostr && sdk?.hasPlugin("nostr") && (
                    <button
                      className="shogun-auth-option-button"
                      onClick={handleNostrAuth}
                      disabled={loading}
                    >
                      <NostrIcon />
                      <span>Continue with Nostr</span>
                    </button>
                  )}

                  {options?.showOauth && sdk?.hasPlugin("oauth") && (
                    <button
                      className="shogun-auth-option-button shogun-google-button"
                      onClick={() => handleOAuth("google")}
                      disabled={loading}
                    >
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </button>
                  )}
                </div>

                <div className="shogun-divider">
                  <span>or continue with password</span>
                </div>

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
                </form>

                <div className="shogun-form-footer">
                  {formMode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}
                  <button
                    className="shogun-toggle-mode"
                    onClick={toggleMode}
                    disabled={loading}
                  >
                    {formMode === "login" ? "Sign Up" : "Sign In"}
                  </button>
                </div>
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

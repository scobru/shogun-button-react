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

    // If already logged in, show only logout button
    if (isLoggedIn && username) {
      return (
        <div className="shogun-logged-in-container">
          <button className="shogun-button shogun-logged-in">
            {username.substring(0, 6)}...
            {username.substring(username.length - 4)}
          </button>

          <button onClick={logout} className="shogun-logout-button">
            Logout
          </button>
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
        <button className="shogun-button" onClick={openModal}>
          Login / Sign Up
        </button>

        {modalIsOpen && (
          <div className="shogun-modal-overlay" onClick={closeModal}>
            <div className="shogun-modal" onClick={(e) => e.stopPropagation()}>
              <div className="shogun-modal-header">
                <h2>{formMode === "login" ? "Login" : "Sign Up"}</h2>
                <button className="shogun-close-button" onClick={closeModal}>
                  &times;
                </button>
              </div>
              <div className="shogun-modal-content">
                {error && <div className="shogun-error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                  <div className="shogun-form-group">
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="shogun-form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  {formMode === "signup" && (
                    <div className="shogun-form-group">
                      <label htmlFor="passwordConfirm">Confirm Password</label>
                      <input
                        type="password"
                        id="passwordConfirm"
                        value={formPasswordConfirm}
                        onChange={(e) => setFormPasswordConfirm(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    className="shogun-submit-button"
                    disabled={loading}
                  >
                    {loading
                      ? "Loading..."
                      : formMode === "login"
                        ? "Login"
                        : "Sign Up"}
                  </button>
                </form>

                <div className="shogun-divider">OR</div>

                {options?.showMetamask && sdk?.hasPlugin("web3") && (
                  <button
                    className="shogun-metamask-button"
                    onClick={handleWeb3Auth}
                    disabled={loading}
                  >
                    Continue with Wallet
                  </button>
                )}

                {options?.showWebauthn && sdk?.hasPlugin("webauthn") && (
                  <button
                    className="shogun-webauthn-button"
                    onClick={handleWebAuthnAuth}
                    disabled={loading}
                  >
                    Continue with Passkey
                  </button>
                )}

                {options?.showNostr && sdk?.hasPlugin("nostr") && (
                  <button
                    className="shogun-nostr-button"
                    onClick={handleNostrAuth}
                    disabled={loading}
                  >
                    Continue with Nostr
                  </button>
                )}

                {options?.showOauth && sdk?.hasPlugin("oauth") && (
                  <button
                    className="shogun-oauth-button"
                    onClick={() => handleOAuth("google")}
                    disabled={loading}
                  >
                    Continue with Google
                  </button>
                )}

                <div className="shogun-form-footer">
                  {formMode === "login"
                    ? "Don't have an account?"
                    : "Already have an account?"}
                  <button
                    className="shogun-toggle-mode"
                    onClick={toggleMode}
                    disabled={loading}
                  >
                    {formMode === "login" ? "Sign Up" : "Login"}
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

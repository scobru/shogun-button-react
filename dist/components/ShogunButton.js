import React, { useContext, useState, createContext, useEffect } from "react";
import { Observable } from "rxjs";
import "../types.js"; // Import type file to extend definitions
import "../styles/index.css";
// Default context
const defaultShogunContext = {
    sdk: null,
    options: {},
    isLoggedIn: false,
    userPub: null,
    username: null,
    login: async () => ({}),
    signUp: async () => ({}),
    logout: () => { },
    observe: () => new Observable(),
    setProvider: () => false,
    hasPlugin: () => false,
    getPlugin: () => undefined,
};
// Create context using React's createContext directly
const ShogunContext = createContext(defaultShogunContext);
// Custom hook to access the context
export const useShogun = () => useContext(ShogunContext);
// Provider component
export function ShogunButtonProvider({ children, sdk, options, onLoginSuccess, onSignupSuccess, onError, }) {
    // Use React's useState directly
    const [isLoggedIn, setIsLoggedIn] = useState((sdk === null || sdk === void 0 ? void 0 : sdk.isLoggedIn()) || false);
    const [userPub, setUserPub] = useState(null);
    const [username, setUsername] = useState(null);
    // Effetto per gestire l'inizializzazione e pulizia
    useEffect(() => {
        // Controlla se l'utente è già autenticato all'avvio
        if (sdk === null || sdk === void 0 ? void 0 : sdk.isLoggedIn()) {
            setIsLoggedIn(true);
        }
        return () => {
            // Pulizia quando il componente si smonta
        };
    }, [sdk]);
    // RxJS observe method
    const observe = (path) => {
        if (!sdk) {
            return new Observable();
        }
        return sdk.observe(path);
    };
    // Unified login
    const login = async (method, ...args) => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            let result;
            let authMethod = method;
            let username;
            switch (method) {
                case "password":
                    username = args[0];
                    result = await sdk.login(args[0], args[1]);
                    break;
                case "webauthn":
                    username = args[0];
                    const webauthn = sdk.getPlugin("webauthn");
                    if (!webauthn)
                        throw new Error("WebAuthn plugin not available");
                    result = await webauthn.login(username);
                    break;
                case "web3":
                    const web3 = sdk.getPlugin("web3");
                    if (!web3)
                        throw new Error("Web3 plugin not available");
                    const connectionResult = await web3.connectMetaMask();
                    if (!connectionResult.success || !connectionResult.address) {
                        throw new Error(connectionResult.error || "Failed to connect wallet.");
                    }
                    username = connectionResult.address;
                    result = await web3.login(connectionResult.address);
                    break;
                case "nostr":
                    const nostr = sdk.getPlugin("nostr");
                    if (!nostr)
                        throw new Error("Nostr plugin not available");
                    const nostrResult = await nostr.connectBitcoinWallet();
                    if (!nostrResult || !nostrResult.success) {
                        throw new Error((nostrResult === null || nostrResult === void 0 ? void 0 : nostrResult.error) || "Connessione al wallet Bitcoin fallita");
                    }
                    const pubkey = nostrResult.address;
                    if (!pubkey)
                        throw new Error("Nessuna chiave pubblica ottenuta");
                    username = pubkey;
                    result = await nostr.login(pubkey);
                    break;
                case "oauth":
                    const oauth = sdk.getPlugin("oauth");
                    if (!oauth)
                        throw new Error("OAuth plugin not available");
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
                onLoginSuccess === null || onLoginSuccess === void 0 ? void 0 : onLoginSuccess({
                    userPub: result.userPub || "",
                    username: username || "",
                    authMethod: authMethod,
                });
            }
            else {
                onError === null || onError === void 0 ? void 0 : onError(result.error || "Login failed");
            }
            return result;
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Error during login");
            return { success: false, error: error.message };
        }
    };
    // Unified signup
    const signUp = async (method, ...args) => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            let result;
            let authMethod = method;
            let username;
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
                    const webauthn = sdk.getPlugin("webauthn");
                    if (!webauthn)
                        throw new Error("WebAuthn plugin not available");
                    result = await webauthn.signUp(username);
                    break;
                case "web3":
                    const web3 = sdk.getPlugin("web3");
                    if (!web3)
                        throw new Error("Web3 plugin not available");
                    const connectionResult = await web3.connectMetaMask();
                    if (!connectionResult.success || !connectionResult.address) {
                        throw new Error(connectionResult.error || "Failed to connect wallet.");
                    }
                    username = connectionResult.address;
                    result = await web3.signUp(connectionResult.address);
                    break;
                case "nostr":
                    const nostr = sdk.getPlugin("nostr");
                    if (!nostr)
                        throw new Error("Nostr plugin not available");
                    const nostrResult = await nostr.connectBitcoinWallet();
                    if (!nostrResult || !nostrResult.success) {
                        throw new Error((nostrResult === null || nostrResult === void 0 ? void 0 : nostrResult.error) || "Connessione al wallet Bitcoin fallita");
                    }
                    const pubkey = nostrResult.address;
                    if (!pubkey)
                        throw new Error("Nessuna chiave pubblica ottenuta");
                    username = pubkey;
                    result = await nostr.signUp(pubkey);
                    break;
                case "oauth":
                    const oauth = sdk.getPlugin("oauth");
                    if (!oauth)
                        throw new Error("OAuth plugin not available");
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
                onSignupSuccess === null || onSignupSuccess === void 0 ? void 0 : onSignupSuccess({
                    userPub: userPub,
                    username: username || "",
                    authMethod: authMethod,
                });
            }
            else {
                onError === null || onError === void 0 ? void 0 : onError(result.error);
            }
            return result;
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Error during registration");
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
    const setProvider = (provider) => {
        if (!sdk) {
            return false;
        }
        try {
            let newProviderUrl = null;
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
        }
        catch (error) {
            console.error("Error setting provider:", error);
            return false;
        }
    };
    const hasPlugin = (name) => {
        return sdk ? sdk.hasPlugin(name) : false;
    };
    const getPlugin = (name) => {
        return sdk ? sdk.getPlugin(name) : undefined;
    };
    // Provide the context value to children
    return (React.createElement(ShogunContext.Provider, { value: {
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
        } }, children));
}
// Component for Shogun login button
export const ShogunButton = (() => {
    const Button = () => {
        const { isLoggedIn, username, logout, login, signUp, sdk, options } = useShogun();
        // Form states
        const [modalIsOpen, setModalIsOpen] = useState(false);
        const [formUsername, setFormUsername] = useState("");
        const [formPassword, setFormPassword] = useState("");
        const [formPasswordConfirm, setFormPasswordConfirm] = useState("");
        const [formMode, setFormMode] = useState("login");
        const [error, setError] = useState("");
        const [loading, setLoading] = useState(false);
        // If already logged in, show only logout button
        if (isLoggedIn && username) {
            return (React.createElement("div", { className: "shogun-logged-in-container" },
                React.createElement("button", { className: "shogun-button shogun-logged-in" },
                    username.substring(0, 6),
                    "...",
                    username.substring(username.length - 4)),
                React.createElement("button", { onClick: logout, className: "shogun-logout-button" }, "Logout")));
        }
        // Event handlers
        const handleAuth = async (method, ...args) => {
            setError("");
            setLoading(true);
            try {
                const action = formMode === "login" ? login : signUp;
                const result = await action(method, ...args);
                if (result && !result.success && result.error) {
                    setError(result.error);
                }
                else if (result && result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                }
                else {
                    setModalIsOpen(false);
                }
            }
            catch (e) {
                setError(e.message || "An unexpected error occurred.");
            }
            finally {
                setLoading(false);
            }
        };
        const handleSubmit = (e) => {
            e.preventDefault();
            handleAuth("password", formUsername, formPassword, formPasswordConfirm);
        };
        const handleWeb3Auth = () => handleAuth("web3");
        const handleWebAuthnAuth = () => {
            if (!(sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("webauthn"))) {
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
        const handleOAuth = (provider) => handleAuth("oauth", provider);
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
        return (React.createElement(React.Fragment, null,
            React.createElement("button", { className: "shogun-button", onClick: openModal }, "Login / Sign Up"),
            modalIsOpen && (React.createElement("div", { className: "shogun-modal-overlay", onClick: closeModal },
                React.createElement("div", { className: "shogun-modal", onClick: (e) => e.stopPropagation() },
                    React.createElement("div", { className: "shogun-modal-header" },
                        React.createElement("h2", null, formMode === "login" ? "Login" : "Sign Up"),
                        React.createElement("button", { className: "shogun-close-button", onClick: closeModal }, "\u00D7")),
                    React.createElement("div", { className: "shogun-modal-content" },
                        error && React.createElement("div", { className: "shogun-error-message" }, error),
                        React.createElement("form", { onSubmit: handleSubmit },
                            React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "username" }, "Username"),
                                React.createElement("input", { type: "text", id: "username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true })),
                            React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "password" }, "Password"),
                                React.createElement("input", { type: "password", id: "password", value: formPassword, onChange: (e) => setFormPassword(e.target.value), disabled: loading, required: true })),
                            formMode === "signup" && (React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "passwordConfirm" }, "Confirm Password"),
                                React.createElement("input", { type: "password", id: "passwordConfirm", value: formPasswordConfirm, onChange: (e) => setFormPasswordConfirm(e.target.value), disabled: loading, required: true }))),
                            React.createElement("button", { type: "submit", className: "shogun-submit-button", disabled: loading }, loading
                                ? "Loading..."
                                : formMode === "login"
                                    ? "Login"
                                    : "Sign Up")),
                        React.createElement("div", { className: "shogun-divider" }, "OR"),
                        (options === null || options === void 0 ? void 0 : options.showMetamask) && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("web3")) && (React.createElement("button", { className: "shogun-metamask-button", onClick: handleWeb3Auth, disabled: loading }, "Continue with Wallet")),
                        (options === null || options === void 0 ? void 0 : options.showWebauthn) && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("webauthn")) && (React.createElement("button", { className: "shogun-webauthn-button", onClick: handleWebAuthnAuth, disabled: loading }, "Continue with Passkey")),
                        (options === null || options === void 0 ? void 0 : options.showNostr) && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("nostr")) && (React.createElement("button", { className: "shogun-nostr-button", onClick: handleNostrAuth, disabled: loading }, "Continue with Nostr")),
                        (options === null || options === void 0 ? void 0 : options.showOauth) && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("oauth")) && (React.createElement("button", { className: "shogun-oauth-button", onClick: () => handleOAuth("google"), disabled: loading }, "Continue with Google")),
                        React.createElement("div", { className: "shogun-form-footer" },
                            formMode === "login"
                                ? "Don't have an account?"
                                : "Already have an account?",
                            React.createElement("button", { className: "shogun-toggle-mode", onClick: toggleMode, disabled: loading }, formMode === "login" ? "Sign Up" : "Login"))))))));
    };
    Button.displayName = "ShogunButton";
    return Object.assign(Button, {
        Provider: ShogunButtonProvider,
        useShogun: useShogun,
    });
})();

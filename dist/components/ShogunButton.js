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
// SVG Icons Components
const WalletIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M21 12V7H5a2 2 0 0 1 0-4h14v4" }),
    React.createElement("path", { d: "M3 5v14a2 2 0 0 0 2 2h16v-5" }),
    React.createElement("path", { d: "M18 12a2 2 0 0 0 0 4h4v-4Z" })));
const KeyIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("circle", { cx: "7.5", cy: "15.5", r: "5.5" }),
    React.createElement("path", { d: "m21 2-9.6 9.6" }),
    React.createElement("path", { d: "m15.5 7.5 3 3L22 7l-3-3" })));
const GoogleIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor" },
    React.createElement("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }),
    React.createElement("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
    React.createElement("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", fill: "#FBBC05" }),
    React.createElement("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })));
const NostrIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M19.5 4.5 15 9l-3-3-4.5 4.5L9 12l-1.5 1.5L12 18l4.5-4.5L15 12l1.5-1.5L21 6l-1.5-1.5Z" }),
    React.createElement("path", { d: "M12 12 6 6l-1.5 1.5L9 12l-4.5 4.5L6 18l6-6Z" })));
const WebAuthnIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M7 11v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-4" }),
    React.createElement("path", { d: "M14 4V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" })));
const LogoutIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
    React.createElement("polyline", { points: "16 17 21 12 16 7" }),
    React.createElement("line", { x1: "21", y1: "12", x2: "9", y2: "12" })));
const UserIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
    React.createElement("circle", { cx: "12", cy: "7", r: "4" })));
const LockIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
    React.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })));
const CloseIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })));
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
        const [dropdownOpen, setDropdownOpen] = useState(false);
        // If already logged in, show only logout button
        if (isLoggedIn && username) {
            return (React.createElement("div", { className: "shogun-logged-in-container" },
                React.createElement("div", { className: "shogun-dropdown" },
                    React.createElement("button", { className: "shogun-button shogun-logged-in", onClick: () => setDropdownOpen(!dropdownOpen) },
                        React.createElement("div", { className: "shogun-avatar" }, username.substring(0, 2).toUpperCase()),
                        React.createElement("span", { className: "shogun-username" }, username.length > 12
                            ? `${username.substring(0, 6)}...${username.substring(username.length - 4)}`
                            : username)),
                    dropdownOpen && (React.createElement("div", { className: "shogun-dropdown-menu" },
                        React.createElement("div", { className: "shogun-dropdown-header" },
                            React.createElement("div", { className: "shogun-avatar-large" }, username.substring(0, 2).toUpperCase()),
                            React.createElement("div", { className: "shogun-user-info" },
                                React.createElement("span", { className: "shogun-username-full" }, username.length > 20
                                    ? `${username.substring(0, 10)}...${username.substring(username.length - 6)}`
                                    : username))),
                        React.createElement("div", { className: "shogun-dropdown-item", onClick: logout },
                            React.createElement(LogoutIcon, null),
                            React.createElement("span", null, "Disconnect")))))));
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
            React.createElement("button", { className: "shogun-connect-button", onClick: openModal },
                React.createElement(WalletIcon, null),
                React.createElement("span", null, "Connect")),
            modalIsOpen && (React.createElement("div", { className: "shogun-modal-overlay", onClick: closeModal },
                React.createElement("div", { className: "shogun-modal", onClick: (e) => e.stopPropagation() },
                    React.createElement("div", { className: "shogun-modal-header" },
                        React.createElement("h2", null, formMode === "login" ? "Sign In" : "Create Account"),
                        React.createElement("button", { className: "shogun-close-button", onClick: closeModal },
                            React.createElement(CloseIcon, null))),
                    React.createElement("div", { className: "shogun-modal-content" },
                        error && React.createElement("div", { className: "shogun-error-message" }, error),
                        React.createElement("div", { className: "shogun-auth-options" },
                            (options === null || options === void 0 ? void 0 : options.showMetamask) && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("web3")) && (React.createElement("button", { className: "shogun-auth-option-button", onClick: handleWeb3Auth, disabled: loading },
                                React.createElement(WalletIcon, null),
                                React.createElement("span", null, "Continue with Wallet"))),
                            (options === null || options === void 0 ? void 0 : options.showWebauthn) && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("webauthn")) && (React.createElement("button", { className: "shogun-auth-option-button", onClick: handleWebAuthnAuth, disabled: loading },
                                React.createElement(WebAuthnIcon, null),
                                React.createElement("span", null, "Continue with Passkey"))),
                            (options === null || options === void 0 ? void 0 : options.showNostr) && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("nostr")) && (React.createElement("button", { className: "shogun-auth-option-button", onClick: handleNostrAuth, disabled: loading },
                                React.createElement(NostrIcon, null),
                                React.createElement("span", null, "Continue with Nostr"))),
                            (options === null || options === void 0 ? void 0 : options.showOauth) && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("oauth")) && (React.createElement("button", { className: "shogun-auth-option-button shogun-google-button", onClick: () => handleOAuth("google"), disabled: loading },
                                React.createElement(GoogleIcon, null),
                                React.createElement("span", null, "Continue with Google")))),
                        React.createElement("div", { className: "shogun-divider" },
                            React.createElement("span", null, "or continue with password")),
                        React.createElement("form", { onSubmit: handleSubmit, className: "shogun-auth-form" },
                            React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "username" },
                                    React.createElement(UserIcon, null),
                                    React.createElement("span", null, "Username")),
                                React.createElement("input", { type: "text", id: "username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true, placeholder: "Enter your username" })),
                            React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "password" },
                                    React.createElement(LockIcon, null),
                                    React.createElement("span", null, "Password")),
                                React.createElement("input", { type: "password", id: "password", value: formPassword, onChange: (e) => setFormPassword(e.target.value), disabled: loading, required: true, placeholder: "Enter your password" })),
                            formMode === "signup" && (React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "passwordConfirm" },
                                    React.createElement(KeyIcon, null),
                                    React.createElement("span", null, "Confirm Password")),
                                React.createElement("input", { type: "password", id: "passwordConfirm", value: formPasswordConfirm, onChange: (e) => setFormPasswordConfirm(e.target.value), disabled: loading, required: true, placeholder: "Confirm your password" }))),
                            React.createElement("button", { type: "submit", className: "shogun-submit-button", disabled: loading }, loading
                                ? "Processing..."
                                : formMode === "login"
                                    ? "Sign In"
                                    : "Create Account")),
                        React.createElement("div", { className: "shogun-form-footer" },
                            formMode === "login"
                                ? "Don't have an account?"
                                : "Already have an account?",
                            React.createElement("button", { className: "shogun-toggle-mode", onClick: toggleMode, disabled: loading }, formMode === "login" ? "Sign Up" : "Sign In"))))))));
    };
    Button.displayName = "ShogunButton";
    return Object.assign(Button, {
        Provider: ShogunButtonProvider,
        useShogun: useShogun,
    });
})();

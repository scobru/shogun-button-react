import React, { useContext, useState, createContext, useEffect, useRef, } from "react";
import { Observable } from "rxjs";
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
    hasPlugin: () => false,
    getPlugin: () => undefined,
    exportGunPair: async () => "",
    importGunPair: async () => false,
};
// Create context using React's createContext directly
const ShogunContext = createContext(defaultShogunContext);
// Custom hook to access the context
export const useShogun = () => useContext(ShogunContext);
// Provider component
export function ShogunButtonProvider({ children, sdk, options, onLoginSuccess, onSignupSuccess, onError, onLogout, // AGGIUNTA
 }) {
    // Use React's useState directly
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userPub, setUserPub] = useState(null);
    const [username, setUsername] = useState(null);
    // Effetto per gestire l'inizializzazione e pulizia
    useEffect(() => {
        var _a, _b;
        if (!sdk)
            return;
        // Verifichiamo se l'utente è già loggato all'inizializzazione
        if (sdk.isLoggedIn()) {
            const pub = (_b = (_a = sdk.gun.user()) === null || _a === void 0 ? void 0 : _a.is) === null || _b === void 0 ? void 0 : _b.pub;
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
    const observe = (path) => {
        if (!sdk) {
            return new Observable();
        }
        return sdk.rx.observe(path);
    };
    // Unified login
    const login = async (method, ...args) => {
        var _a, _b;
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
                case "pair":
                    // New pair authentication method
                    const pair = args[0];
                    if (!pair || typeof pair !== "object") {
                        throw new Error("Invalid pair data provided");
                    }
                    result = await new Promise((resolve, reject) => {
                        sdk.gun.user().auth(pair, (ack) => {
                            if (ack.err) {
                                reject(new Error(`Pair authentication failed: ${ack.err}`));
                                return;
                            }
                            const pub = ack.pub || pair.pub;
                            const alias = ack.alias || `user_${pub === null || pub === void 0 ? void 0 : pub.substring(0, 8)}`;
                            resolve({
                                success: true,
                                userPub: pub,
                                alias: alias,
                                method: "pair",
                            });
                        });
                    });
                    username = result.alias;
                    authMethod = "pair";
                    break;
                case "webauthn":
                    username = args[0];
                    const webauthn = sdk.getPlugin("webauthn");
                    if (!webauthn)
                        throw new Error("WebAuthn plugin not available");
                    result = await webauthn.login(username);
                    authMethod = "webauthn";
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
                    authMethod = "web3";
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
                    authMethod = "nostr";
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
                const userPub = result.userPub || ((_b = (_a = sdk.gun.user()) === null || _a === void 0 ? void 0 : _a.is) === null || _b === void 0 ? void 0 : _b.pub) || "";
                const displayName = result.alias || username || userPub.slice(0, 8) + "...";
                setIsLoggedIn(true);
                setUserPub(userPub);
                setUsername(displayName);
                onLoginSuccess === null || onLoginSuccess === void 0 ? void 0 : onLoginSuccess({
                    userPub: userPub,
                    username: displayName,
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
        var _a, _b;
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
                    // NON serve più setPin né passare il pin
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
                const userPub = result.userPub || ((_b = (_a = sdk.gun.user()) === null || _a === void 0 ? void 0 : _a.is) === null || _b === void 0 ? void 0 : _b.pub) || "";
                const displayName = result.alias || username || userPub.slice(0, 8) + "...";
                setIsLoggedIn(true);
                setUserPub(userPub);
                setUsername(displayName);
                onSignupSuccess === null || onSignupSuccess === void 0 ? void 0 : onSignupSuccess({
                    userPub: userPub,
                    username: displayName,
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
        sessionStorage.removeItem("gun/pair");
        sessionStorage.removeItem("gun/session");
        sessionStorage.removeItem("pair");
        if (onLogout)
            onLogout(); // AGGIUNTA
    };
    const hasPlugin = (name) => {
        return sdk ? sdk.hasPlugin(name) : false;
    };
    const getPlugin = (name) => {
        return sdk ? sdk.getPlugin(name) : undefined;
    };
    // Export Gun pair functionality
    const exportGunPair = async (password) => {
        if (!sdk) {
            throw new Error("SDK not initialized");
        }
        if (!isLoggedIn) {
            throw new Error("User not authenticated");
        }
        try {
            const pair = sessionStorage.getItem("gun/pair") || sessionStorage.getItem("pair");
            if (!pair) {
                throw new Error("No Gun pair available for current user");
            }
            let pairData = JSON.stringify(pair);
            // If password provided, encrypt the pair
            if (password && password.trim()) {
                // Use Gun's SEA for encryption if available
                if (window.SEA && window.SEA.encrypt) {
                    pairData = await window.SEA.encrypt(pairData, password);
                }
                else {
                    console.warn("SEA encryption not available, exporting unencrypted");
                }
            }
            return pairData;
        }
        catch (error) {
            throw new Error(`Failed to export Gun pair: ${error.message}`);
        }
    };
    // Import Gun pair functionality
    const importGunPair = async (pairData, password) => {
        if (!sdk) {
            throw new Error("SDK not initialized");
        }
        try {
            let dataString = pairData;
            // If password provided, decrypt the pair
            if (password && password.trim()) {
                if (window.SEA && window.SEA.decrypt) {
                    dataString = await window.SEA.decrypt(pairData, password);
                    if (!dataString) {
                        throw new Error("Failed to decrypt pair data - wrong password?");
                    }
                }
                else {
                    console.warn("SEA decryption not available, assuming unencrypted data");
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
        }
        catch (error) {
            throw new Error(`Failed to import Gun pair: ${error.message}`);
        }
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
            hasPlugin,
            getPlugin,
            exportGunPair,
            importGunPair,
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
const ImportIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    React.createElement("polyline", { points: "14,2 14,8 20,8" }),
    React.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
    React.createElement("line", { x1: "12", y1: "17", x2: "12", y2: "9" })));
const ExportIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    React.createElement("polyline", { points: "14,2 14,8 20,8" }),
    React.createElement("line", { x1: "12", y1: "11", x2: "12", y2: "21" }),
    React.createElement("polyline", { points: "16,15 12,11 8,15" })));
// Component for Shogun login button
export const ShogunButton = (() => {
    const Button = () => {
        const { isLoggedIn, username, logout, login, signUp, sdk, options, exportGunPair, importGunPair, } = useShogun();
        // Form states
        const [modalIsOpen, setModalIsOpen] = useState(false);
        const [formUsername, setFormUsername] = useState("");
        const [formPassword, setFormPassword] = useState("");
        const [formPasswordConfirm, setFormPasswordConfirm] = useState("");
        const [formHint, setFormHint] = useState("");
        const [formSecurityQuestion] = useState("What is your favorite color?"); // Hardcoded for now
        const [formSecurityAnswer, setFormSecurityAnswer] = useState("");
        const [formMode, setFormMode] = useState("login");
        const [authView, setAuthView] = useState("options");
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
        const dropdownRef = useRef(null);
        // Rimuovi tutto ciò che riguarda oauthPin
        // Handle click outside to close dropdown
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current &&
                    !dropdownRef.current.contains(event.target)) {
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
            return (React.createElement("div", { className: "shogun-logged-in-container" },
                React.createElement("div", { className: "shogun-dropdown", ref: dropdownRef },
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
                        React.createElement("div", { className: "shogun-dropdown-item", onClick: () => {
                                setDropdownOpen(false);
                                setAuthView("export");
                                setModalIsOpen(true);
                            } },
                            React.createElement(ExportIcon, null),
                            React.createElement("span", null, "Export Pair")),
                        React.createElement("div", { className: "shogun-dropdown-item", onClick: logout },
                            React.createElement(LogoutIcon, null),
                            React.createElement("span", null, "Disconnect")))))));
        }
        // Event handlers
        const handleAuth = async (method, ...args) => {
            setError("");
            setLoading(true);
            try {
                // Use formMode to determine whether to call login or signUp
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
        const handleSubmit = async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
                if (formMode === "signup") {
                    const result = await signUp("password", formUsername, formPassword, formPasswordConfirm);
                    if (result && result.success) {
                        if (sdk === null || sdk === void 0 ? void 0 : sdk.gundb) {
                            await sdk.gundb.setPasswordHint(formUsername, formPassword, formHint, [formSecurityQuestion], [formSecurityAnswer]);
                        }
                        setModalIsOpen(false);
                    }
                    else if (result && result.error) {
                        setError(result.error);
                    }
                }
                else {
                    await handleAuth("password", formUsername, formPassword);
                }
            }
            catch (e) {
                setError(e.message || "An unexpected error occurred.");
            }
            finally {
                setLoading(false);
            }
        };
        const handleWebAuthnAuth = () => {
            if (!(sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("webauthn"))) {
                setError("WebAuthn is not supported in your browser");
                return;
            }
            setAuthView("webauthn-username");
        };
        const handleRecover = async () => {
            setError("");
            setLoading(true);
            try {
                if (!(sdk === null || sdk === void 0 ? void 0 : sdk.gundb)) {
                    throw new Error("SDK not ready");
                }
                const result = await sdk.gundb.forgotPassword(formUsername, [
                    formSecurityAnswer,
                ]);
                if (result.success && result.hint) {
                    setRecoveredHint(result.hint);
                    setAuthView("showHint");
                }
                else {
                    setError(result.error || "Could not recover hint.");
                }
            }
            catch (e) {
                setError(e.message || "An unexpected error occurred.");
            }
            finally {
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
            }
            catch (e) {
                setError(e.message || "Failed to export pair");
            }
            finally {
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
                const success = await importGunPair(importPairData, importPassword || undefined);
                if (success) {
                    setShowImportSuccess(true);
                    // Chiudiamo il modal con un piccolo delay per permettere all'utente di vedere il successo
                    setTimeout(() => {
                        setModalIsOpen(false);
                        setShowImportSuccess(false);
                    }, 1500);
                }
                else {
                    throw new Error("Failed to import pair");
                }
            }
            catch (e) {
                setError(e.message || "Failed to import pair");
            }
            finally {
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
        const renderAuthOptions = () => (React.createElement("div", { className: "shogun-auth-options" },
            options.showMetamask !== false && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("web3")) && (React.createElement("div", { className: "shogun-auth-option-group" },
                React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => handleAuth("web3"), disabled: loading },
                    React.createElement(WalletIcon, null),
                    formMode === "login"
                        ? "Login with MetaMask"
                        : "Signup with MetaMask"))),
            options.showWebauthn !== false && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("webauthn")) && (React.createElement("div", { className: "shogun-auth-option-group" },
                React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: handleWebAuthnAuth, disabled: loading },
                    React.createElement(WebAuthnIcon, null),
                    formMode === "login"
                        ? "Login with WebAuthn"
                        : "Signup with WebAuthn"))),
            options.showNostr !== false && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("nostr")) && (React.createElement("div", { className: "shogun-auth-option-group" },
                React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => handleAuth("nostr"), disabled: loading },
                    React.createElement(NostrIcon, null),
                    formMode === "login" ? "Login with Nostr" : "Signup with Nostr"))),
            options.showOauth !== false && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("oauth")) && (React.createElement("div", { className: "shogun-auth-option-group" },
                React.createElement("button", { type: "button", className: "shogun-auth-option-button shogun-google-button", onClick: () => handleAuth("oauth", "google"), disabled: loading },
                    React.createElement(GoogleIcon, null),
                    formMode === "login"
                        ? "Login with Google"
                        : "Signup with Google"))),
            React.createElement("div", { className: "shogun-divider" },
                React.createElement("span", null, "or")),
            React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => setAuthView("password"), disabled: loading },
                React.createElement(LockIcon, null),
                formMode === "login"
                    ? "Login with Password"
                    : "Signup with Password"),
            formMode === "login" && (React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => setAuthView("import"), disabled: loading },
                React.createElement(ImportIcon, null),
                "Import Gun Pair"))));
        const renderPasswordForm = () => (React.createElement("form", { onSubmit: handleSubmit, className: "shogun-auth-form" },
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
            formMode === "signup" && (React.createElement(React.Fragment, null,
                React.createElement("div", { className: "shogun-form-group" },
                    React.createElement("label", { htmlFor: "passwordConfirm" },
                        React.createElement(KeyIcon, null),
                        React.createElement("span", null, "Confirm Password")),
                    React.createElement("input", { type: "password", id: "passwordConfirm", value: formPasswordConfirm, onChange: (e) => setFormPasswordConfirm(e.target.value), disabled: loading, required: true, placeholder: "Confirm your password" })),
                React.createElement("div", { className: "shogun-form-group" },
                    React.createElement("label", { htmlFor: "hint" },
                        React.createElement(UserIcon, null),
                        React.createElement("span", null, "Password Hint")),
                    React.createElement("input", { type: "text", id: "hint", value: formHint, onChange: (e) => setFormHint(e.target.value), disabled: loading, required: true, placeholder: "Enter your password hint" })),
                React.createElement("div", { className: "shogun-form-group" },
                    React.createElement("label", { htmlFor: "securityQuestion" },
                        React.createElement(UserIcon, null),
                        React.createElement("span", null, "Security Question")),
                    React.createElement("input", { type: "text", id: "securityQuestion", value: formSecurityQuestion, disabled: true })),
                React.createElement("div", { className: "shogun-form-group" },
                    React.createElement("label", { htmlFor: "securityAnswer" },
                        React.createElement(UserIcon, null),
                        React.createElement("span", null, "Security Answer")),
                    React.createElement("input", { type: "text", id: "securityAnswer", value: formSecurityAnswer, onChange: (e) => setFormSecurityAnswer(e.target.value), disabled: loading, required: true, placeholder: "Enter your security answer" })))),
            React.createElement("button", { type: "submit", className: "shogun-submit-button", disabled: loading }, loading
                ? "Processing..."
                : formMode === "login"
                    ? "Sign In"
                    : "Create Account"),
            React.createElement("div", { className: "shogun-form-footer" },
                React.createElement("button", { type: "button", className: "shogun-toggle-mode shogun-prominent-toggle", onClick: toggleMode, disabled: loading }, formMode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Log in"),
                formMode === "login" && (React.createElement("button", { type: "button", className: "shogun-toggle-mode", onClick: () => setAuthView("recover"), disabled: loading }, "Forgot password?")))));
        const renderWebAuthnUsernameForm = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("h3", null, formMode === "login"
                ? "Login with WebAuthn"
                : "Sign Up with WebAuthn"),
            React.createElement("div", { style: {
                    backgroundColor: "#f0f9ff",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #0ea5e9",
                } },
                React.createElement("p", { style: {
                        fontSize: "14px",
                        color: "#0c4a6e",
                        margin: "0",
                        fontWeight: "500",
                    } }, "\uD83D\uDD11 WebAuthn Authentication"),
                React.createElement("p", { style: { fontSize: "13px", color: "#075985", margin: "4px 0 0 0" } },
                    "Please enter your username to continue with WebAuthn",
                    " ",
                    formMode === "login" ? "login" : "registration",
                    ".")),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "username" },
                    React.createElement(UserIcon, null),
                    React.createElement("span", null, "Username")),
                React.createElement("input", { type: "text", id: "username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true, placeholder: "Enter your username", autoFocus: true })),
            React.createElement("button", { type: "button", className: "shogun-submit-button", onClick: () => handleAuth("webauthn", formUsername), disabled: loading || !formUsername.trim() }, loading ? "Processing..." : `Continue with WebAuthn`),
            React.createElement("div", { className: "shogun-form-footer" },
                React.createElement("button", { type: "button", className: "shogun-back-button", onClick: () => setAuthView("options"), disabled: loading }, "\u2190 Back to Options"))));
        const renderRecoveryForm = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "username" },
                    React.createElement(UserIcon, null),
                    React.createElement("span", null, "Username")),
                React.createElement("input", { type: "text", id: "username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true, placeholder: "Enter your username" })),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", null, "Security Question"),
                React.createElement("p", null, formSecurityQuestion)),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "securityAnswer" },
                    React.createElement(KeyIcon, null),
                    React.createElement("span", null, "Answer")),
                React.createElement("input", { type: "text", id: "securityAnswer", value: formSecurityAnswer, onChange: (e) => setFormSecurityAnswer(e.target.value), disabled: loading, required: true, placeholder: "Enter your answer" })),
            React.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleRecover, disabled: loading }, loading ? "Recovering..." : "Get Hint"),
            React.createElement("div", { className: "shogun-form-footer" },
                React.createElement("button", { className: "shogun-toggle-mode", onClick: () => setAuthView("password"), disabled: loading }, "Back to Login"))));
        const renderHint = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("h3", null, "Your Password Hint"),
            React.createElement("p", { className: "shogun-hint" }, recoveredHint),
            React.createElement("button", { className: "shogun-submit-button", onClick: () => {
                    setAuthView("password");
                    resetForm();
                    setFormMode("login");
                } }, "Back to Login")));
        const renderExportForm = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("h3", null, "Export Gun Pair"),
            React.createElement("div", { style: {
                    backgroundColor: "#f0f9ff",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #0ea5e9",
                } },
                React.createElement("p", { style: {
                        fontSize: "14px",
                        color: "#0c4a6e",
                        margin: "0",
                        fontWeight: "500",
                    } }, "\uD83D\uDD12 Backup Your Account"),
                React.createElement("p", { style: { fontSize: "13px", color: "#075985", margin: "4px 0 0 0" } }, "Export your Gun pair to backup your account. You can use this to login from another device or restore access if needed.")),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "exportPassword" },
                    React.createElement(LockIcon, null),
                    React.createElement("span", null, "Encryption Password (optional but recommended)")),
                React.createElement("input", { type: "password", id: "exportPassword", value: exportPassword, onChange: (e) => setExportPassword(e.target.value), disabled: loading, placeholder: "Leave empty to export unencrypted" })),
            exportedPair && (React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", null, "Your Gun Pair (copy this safely):"),
                showCopySuccess && (React.createElement("div", { style: {
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        marginBottom: "8px",
                        fontSize: "14px",
                        border: "1px solid #22c55e",
                    } }, "\u2705 Copied to clipboard successfully!")),
                React.createElement("textarea", { value: exportedPair, readOnly: true, rows: 6, style: {
                        fontFamily: "monospace",
                        fontSize: "12px",
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                    } }),
                !navigator.clipboard && (React.createElement("p", { style: { fontSize: "12px", color: "#666", marginTop: "8px" } }, "\u26A0\uFE0F Auto-copy not available. Please manually copy the text above.")))),
            React.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleExportPair, disabled: loading }, loading ? "Exporting..." : "Export Pair"),
            React.createElement("div", { className: "shogun-form-footer" },
                React.createElement("button", { className: "shogun-toggle-mode", onClick: () => {
                        if (isLoggedIn) {
                            // If user is logged in, close the modal instead of going to options
                            setModalIsOpen(false);
                            setExportPassword("");
                            setExportedPair("");
                        }
                        else {
                            setAuthView("options");
                            setExportPassword("");
                            setExportedPair("");
                        }
                    }, disabled: loading }, "Back"))));
        const renderImportForm = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("h3", null, "Import Gun Pair"),
            React.createElement("div", { style: {
                    backgroundColor: "#fef3c7",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #f59e0b",
                } },
                React.createElement("p", { style: {
                        fontSize: "14px",
                        color: "#92400e",
                        margin: "0",
                        fontWeight: "500",
                    } }, "\uD83D\uDD11 Restore Your Account"),
                React.createElement("p", { style: { fontSize: "13px", color: "#a16207", margin: "4px 0 0 0" } }, "Import a Gun pair to login with your existing account from another device. Make sure you have your backup data ready.")),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "importPairData" },
                    React.createElement(ImportIcon, null),
                    React.createElement("span", null, "Gun Pair Data")),
                React.createElement("textarea", { id: "importPairData", value: importPairData, onChange: (e) => setImportPairData(e.target.value), disabled: loading, placeholder: "Paste your Gun pair JSON here...", rows: 6, style: {
                        fontFamily: "monospace",
                        fontSize: "12px",
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                    } })),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "importPassword" },
                    React.createElement(LockIcon, null),
                    React.createElement("span", null, "Decryption Password (if encrypted)")),
                React.createElement("input", { type: "password", id: "importPassword", value: importPassword, onChange: (e) => setImportPassword(e.target.value), disabled: loading, placeholder: "Enter password if pair was encrypted" })),
            showImportSuccess && (React.createElement("div", { style: {
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    border: "1px solid #22c55e",
                    textAlign: "center",
                } }, "\u2705 Pair imported successfully! Logging you in...")),
            React.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleImportPair, disabled: loading || showImportSuccess }, loading
                ? "Importing..."
                : showImportSuccess
                    ? "Success!"
                    : "Import and Login"),
            React.createElement("div", { className: "shogun-form-footer" },
                React.createElement("button", { className: "shogun-toggle-mode", onClick: () => {
                        setAuthView("options");
                        setImportPassword("");
                        setImportPairData("");
                    }, disabled: loading }, "Back to Login Options"))));
        // Render logic
        return (React.createElement(React.Fragment, null,
            React.createElement("button", { className: "shogun-connect-button", onClick: openModal },
                React.createElement(WalletIcon, null),
                React.createElement("span", null, "Login / Sign Up")),
            modalIsOpen && (React.createElement("div", { className: "shogun-modal-overlay", onClick: closeModal },
                React.createElement("div", { className: "shogun-modal", onClick: (e) => e.stopPropagation() },
                    React.createElement("div", { className: "shogun-modal-header" },
                        React.createElement("h2", null, authView === "recover"
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
                                                : "Sign Up"),
                        React.createElement("button", { className: "shogun-close-button", onClick: closeModal, "aria-label": "Close" },
                            React.createElement(CloseIcon, null))),
                    React.createElement("div", { className: "shogun-modal-content" },
                        error && React.createElement("div", { className: "shogun-error-message" }, error),
                        authView === "options" && (React.createElement(React.Fragment, null,
                            renderAuthOptions(),
                            React.createElement("div", { className: "shogun-form-footer" },
                                React.createElement("button", { type: "button", className: "shogun-toggle-mode shogun-prominent-toggle", onClick: toggleMode, disabled: loading }, formMode === "login"
                                    ? "Don't have an account? Sign up"
                                    : "Already have an account? Log in")))),
                        authView === "password" && (React.createElement(React.Fragment, null,
                            React.createElement("button", { className: "shogun-back-button", onClick: () => setAuthView("options") }, "\u2190 Back"),
                            renderPasswordForm())),
                        authView === "recover" && renderRecoveryForm(),
                        authView === "showHint" && renderHint(),
                        authView === "export" && renderExportForm(),
                        authView === "import" && renderImportForm(),
                        authView === "webauthn-username" &&
                            renderWebAuthnUsernameForm()))))));
    };
    Button.displayName = "ShogunButton";
    return Object.assign(Button, {
        Provider: ShogunButtonProvider,
        useShogun: useShogun,
    });
})();

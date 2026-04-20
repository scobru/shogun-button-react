import React, { useContext, useState, createContext, useEffect, useRef, } from "react";
import "../styles/index.css";
// Helper type to check if core is ShogunCore
function isShogunCore(core) {
    return (core &&
        typeof core.isLoggedIn === "function" &&
        typeof core.zen !== "undefined");
}
// Default context
const defaultShogunContext = {
    core: null,
    options: {},
    isLoggedIn: false,
    userPub: null,
    username: null,
    login: async () => ({}),
    signUp: async () => ({}),
    logout: () => { },
    setProvider: () => false,
    hasPlugin: () => false,
    getPlugin: () => undefined,
    exportZenPair: async () => "",
    importZenPair: async () => false,
    zenPlugin: null,
    put: async () => { },
    get: () => null,
    remove: async () => { },
    completePendingSignup: () => { },
    hasPendingSignup: false,
    setHasPendingSignup: (_value) => { },
};
// Create context using React's createContext directly
const ShogunContext = createContext(defaultShogunContext);
// Custom hook to access the context
export const useShogun = () => useContext(ShogunContext);
// Provider component
export function ShogunButtonProvider({ children, core, options, onLoginSuccess, onSignupSuccess, onError, }) {
    // Use React's useState directly
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userPub, setUserPub] = useState(null);
    const [username, setUsername] = useState(null);
    const [hasPendingSignup, setHasPendingSignup] = useState(false);
    // Effetto per gestire l'inizializzazione e pulizia
    useEffect(() => {
        var _a, _b;
        if (!core)
            return;
        // Verifichiamo se l'utente è già loggato all'inizializzazione
        let isLoggedIn = false;
        let pub = null;
        if (isShogunCore(core)) {
            isLoggedIn = core.isLoggedIn();
            if (isLoggedIn) {
                pub = (_b = (_a = core.user) === null || _a === void 0 ? void 0 : _a.is) === null || _b === void 0 ? void 0 : _b.pub;
            }
        }
        if (isLoggedIn && pub) {
            setIsLoggedIn(true);
            setUserPub(pub);
            setUsername(pub.slice(0, 8) + "...");
        }
        // Poiché il metodo 'on' non esiste su ShogunCore,
        // gestiamo gli stati direttamente nei metodi di login/logout
    }, [core]);
    // Unified login
    const login = React.useCallback(async (method, ...args) => {
        var _a, _b;
        try {
            if (!core) {
                throw new Error("SDK not initialized");
            }
            let result;
            let authMethod = method;
            let username;
            switch (method) {
                case "password":
                    username = args[0];
                    console.log(`[DEBUG] ShogunButton: Calling core.login for username: ${username}`);
                    if (isShogunCore(core)) {
                        result = await core.login(args[0], args[1]);
                    }
                    else {
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
                        result = await core.login("pair", "", pair);
                    }
                    else {
                        throw new Error("Pair authentication requires ShogunCore");
                    }
                    username = result.alias;
                    authMethod = "pair";
                    break;
                case "webauthn":
                    username = args[0];
                    if (isShogunCore(core)) {
                        const webauthn = core.getPlugin("webauthn");
                        if (!webauthn)
                            throw new Error("WebAuthn plugin not available");
                        result = await webauthn.login(username);
                    }
                    else {
                        throw new Error("WebAuthn requires ShogunCore");
                    }
                    break;
                case "web3":
                    if (isShogunCore(core)) {
                        const web3 = core.getPlugin("web3");
                        if (!web3)
                            throw new Error("Web3 plugin not available");
                        const connectionResult = await web3.connectMetaMask();
                        if (!connectionResult.success || !connectionResult.address) {
                            throw new Error(connectionResult.error || "Failed to connect wallet.");
                        }
                        username = connectionResult.address;
                        result = await web3.login(connectionResult.address);
                    }
                    else {
                        throw new Error("Web3 requires ShogunCore");
                    }
                    break;
                case "nostr":
                    if (isShogunCore(core)) {
                        const nostr = core.getPlugin("nostr");
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
                    }
                    else {
                        throw new Error("Nostr requires ShogunCore");
                    }
                    break;
                case "challenge":
                    username = args[0];
                    if (!username)
                        throw new Error("Username required for challenge login");
                    if (isShogunCore(core)) {
                        const challengePlugin = core.getPlugin("challenge");
                        if (!challengePlugin)
                            throw new Error("Challenge plugin not available");
                        result = await challengePlugin.login(username);
                        authMethod = "challenge";
                    }
                    else {
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
                    }
                    else {
                        throw new Error("Seed authentication requires ShogunCore");
                    }
                    break;
                default:
                    throw new Error("Unsupported login method");
            }
            if (result.success) {
                let userPub = result.userPub || "";
                if (!userPub && isShogunCore(core)) {
                    userPub = ((_b = (_a = core.user) === null || _a === void 0 ? void 0 : _a.is) === null || _b === void 0 ? void 0 : _b.pub) || "";
                }
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
    }, [core, onLoginSuccess, onError]);
    // Unified signup
    const signUp = React.useCallback(async (method, ...args) => {
        var _a, _b, _c;
        try {
            if (!core) {
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
                    console.log(`[DEBUG] ShogunButton: Calling core.signUp for username: ${username}`);
                    console.log(`[DEBUG] ShogunButton: core object:`, core);
                    try {
                        console.log(`[DEBUG] ShogunButton: About to call core.signUp...`);
                        if (isShogunCore(core)) {
                            result = await core.signUp(args[0], args[1]);
                        }
                        else {
                            throw new Error("Unsupported core type");
                        }
                        console.log(`[DEBUG] ShogunButton: core.signUp completed successfully`);
                        console.log(`[DEBUG] ShogunButton: core.signUp result:`, result);
                    }
                    catch (error) {
                        console.error(`[DEBUG] ShogunButton: core.signUp error:`, error);
                        throw error;
                    }
                    break;
                case "webauthn": {
                    username = typeof args[0] === "string" ? args[0].trim() : "";
                    const webauthnOptions = args.length > 1 && typeof args[1] === "object" && args[1] !== null
                        ? args[1]
                        : {};
                    if (!username) {
                        throw new Error("Username is required for WebAuthn registration");
                    }
                    if (isShogunCore(core)) {
                        const webauthn = core.getPlugin("webauthn");
                        if (!webauthn)
                            throw new Error("WebAuthn plugin not available");
                        const pluginOptions = {};
                        if (webauthnOptions.seedPhrase) {
                            pluginOptions.seedPhrase = webauthnOptions.seedPhrase.trim();
                            pluginOptions.generateSeedPhrase =
                                (_a = webauthnOptions.generateSeedPhrase) !== null && _a !== void 0 ? _a : false;
                        }
                        else if (typeof webauthnOptions.generateSeedPhrase === "boolean") {
                            pluginOptions.generateSeedPhrase =
                                webauthnOptions.generateSeedPhrase;
                        }
                        if (pluginOptions.generateSeedPhrase === undefined &&
                            !pluginOptions.seedPhrase) {
                            pluginOptions.generateSeedPhrase = true;
                        }
                        result = await webauthn.signUp(username, pluginOptions);
                    }
                    else {
                        throw new Error("WebAuthn requires ShogunCore");
                    }
                    break;
                }
                case "web3":
                    if (isShogunCore(core)) {
                        const web3 = core.getPlugin("web3");
                        if (!web3)
                            throw new Error("Web3 plugin not available");
                        const connectionResult = await web3.connectMetaMask();
                        if (!connectionResult.success || !connectionResult.address) {
                            throw new Error(connectionResult.error || "Failed to connect wallet.");
                        }
                        username = connectionResult.address;
                        result = await web3.signUp(connectionResult.address);
                    }
                    else {
                        throw new Error("Web3 requires ShogunCore");
                    }
                    break;
                case "nostr":
                    if (isShogunCore(core)) {
                        const nostr = core.getPlugin("nostr");
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
                    }
                    else {
                        throw new Error("Nostr requires ShogunCore");
                    }
                    break;
                default:
                    throw new Error("Unsupported signup method");
            }
            if (result.success) {
                let userPub = result.userPub || "";
                if (!userPub && isShogunCore(core)) {
                    userPub = ((_c = (_b = core.user) === null || _b === void 0 ? void 0 : _b.is) === null || _c === void 0 ? void 0 : _c.pub) || "";
                }
                const displayName = result.alias || username || userPub.slice(0, 8) + "...";
                setIsLoggedIn(true);
                setUserPub(userPub);
                setUsername(displayName);
                const signupPayload = {
                    userPub: userPub,
                    username: displayName,
                    seedPhrase: result.seedPhrase,
                    authMethod: authMethod,
                };
                const pendingBackup = Boolean(result.seedPhrase || result.trapdoor);
                setHasPendingSignup(pendingBackup);
                onSignupSuccess === null || onSignupSuccess === void 0 ? void 0 : onSignupSuccess(signupPayload);
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
    }, [core, onSignupSuccess, onError]);
    // Logout
    const logout = React.useCallback(() => {
        if (isShogunCore(core)) {
            core.logout();
        }
        setIsLoggedIn(false);
        setUserPub(null);
        setUsername(null);
    }, [core]);
    // Implementazione del metodo setProvider
    const setProvider = React.useCallback((provider) => {
        var _a;
        if (!core) {
            return false;
        }
        try {
            let newProviderUrl = null;
            if (provider && provider.connection && provider.connection.url) {
                newProviderUrl = provider.connection.url;
            }
            else if (typeof provider === "string") {
                newProviderUrl = provider;
            }
            if (newProviderUrl) {
                const zen = ((_a = core === null || core === void 0 ? void 0 : core.db) === null || _a === void 0 ? void 0 : _a.zen) || (core === null || core === void 0 ? void 0 : core.zen);
                if (zen && typeof zen.opt === "function") {
                    try {
                        zen.opt({ peers: [newProviderUrl] });
                        return true;
                    }
                    catch (e) {
                        console.error("Error adding peer via zen.opt:", e);
                        return false;
                    }
                }
            }
            return false;
        }
        catch (error) {
            console.error("Error setting provider:", error);
            return false;
        }
    }, [core]);
    const hasPlugin = React.useCallback((name) => {
        if (isShogunCore(core)) {
            return core.hasPlugin(name);
        }
        return false;
    }, [core]);
    const getPlugin = React.useCallback((name) => {
        if (isShogunCore(core)) {
            return core.getPlugin(name);
        }
        return undefined;
    }, [core]);
    // Export Zen pair functionality
    const exportZenPair = React.useCallback(async (password) => {
        var _a;
        if (!core) {
            throw new Error("SDK not initialized");
        }
        if (!isLoggedIn) {
            throw new Error("User not authenticated");
        }
        try {
            const pair = sessionStorage.getItem("zen/pair") || sessionStorage.getItem("pair");
            if (!pair) {
                throw new Error("No Zen pair available for current user");
            }
            let pairData = JSON.stringify(pair);
            // If password provided, encrypt the pair
            if (password && password.trim()) {
                // Use core's zen SEA for encryption if available
                const sea = ((_a = core.zen) === null || _a === void 0 ? void 0 : _a.SEA) || window.SEA;
                if (sea && sea.encrypt) {
                    pairData = await sea.encrypt(pairData, password);
                }
                else {
                    console.warn("SEA encryption not available, exporting unencrypted");
                }
            }
            return pairData;
        }
        catch (error) {
            throw new Error(`Failed to export Zen pair: ${error.message}`);
        }
    }, [core, isLoggedIn]);
    // Import Zen pair functionality
    const importZenPair = React.useCallback(async (pairData, password) => {
        var _a;
        if (!core) {
            throw new Error("SDK not initialized");
        }
        try {
            let dataString = pairData;
            // If password provided, decrypt the pair
            if (password && password.trim()) {
                const sea = ((_a = core.zen) === null || _a === void 0 ? void 0 : _a.SEA) || window.SEA;
                if (sea && sea.decrypt) {
                    dataString = await sea.decrypt(pairData, password);
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
            throw new Error(`Failed to import Zen pair: ${error.message}`);
        }
    }, [core, login]);
    // Plugin initialization removed
    const zenPlugin = null;
    const completePendingSignup = React.useCallback(() => {
        setHasPendingSignup(false);
    }, [setHasPendingSignup]);
    // Create a properly typed context value
    const contextValue = React.useMemo(() => ({
        core,
        options,
        isLoggedIn,
        userPub,
        username,
        login,
        signUp,
        logout,
        hasPlugin,
        getPlugin,
        exportZenPair,
        importZenPair,
        setProvider,
        zenPlugin,
        completePendingSignup,
        hasPendingSignup,
        setHasPendingSignup,
        put: async (path, data) => {
            if (isShogunCore(core)) {
                if (!core.zen)
                    throw new Error("Zen instance not available");
                return new Promise((resolve, reject) => {
                    core.zen.get(path).put(data, (ack) => {
                        if (ack.err)
                            reject(new Error(ack.err));
                        else
                            resolve();
                    });
                });
            }
            else {
                throw new Error("Core not available");
            }
        },
        get: (path) => {
            if (isShogunCore(core)) {
                if (!core.zen)
                    return null;
                return core.zen.get(path);
            }
            return null;
        },
        remove: async (path) => {
            if (isShogunCore(core)) {
                if (!core.zen)
                    throw new Error("Zen instance not available");
                return new Promise((resolve, reject) => {
                    core.zen.get(path).put(null, (ack) => {
                        if (ack.err)
                            reject(new Error(ack.err));
                        else
                            resolve();
                    });
                });
            }
            else {
                throw new Error("Core not available");
            }
        },
    }), [
        core,
        options,
        isLoggedIn,
        userPub,
        username,
        login,
        signUp,
        logout,
        hasPlugin,
        getPlugin,
        exportZenPair,
        importZenPair,
        zenPlugin,
        completePendingSignup,
        hasPendingSignup,
        setHasPendingSignup,
    ]);
    // Provide the context value to children
    return (React.createElement(ShogunContext.Provider, { value: contextValue }, children));
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
const ChallengeIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" })));
const ExportIcon = () => (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    React.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    React.createElement("polyline", { points: "14,2 14,8 20,8" }),
    React.createElement("line", { x1: "12", y1: "11", x2: "12", y2: "21" }),
    React.createElement("polyline", { points: "16,15 12,11 8,15" })));
// Component for Shogun login button
export const ShogunButton = (() => {
    const Button = () => {
        const { isLoggedIn, username, logout, login, signUp, core, options, exportZenPair, importZenPair, hasPlugin, hasPendingSignup, setHasPendingSignup, } = useShogun();
        // Form states
        const [modalIsOpen, setModalIsOpen] = useState(false);
        const [formUsername, setFormUsername] = useState("");
        const [formPassword, setFormPassword] = useState("");
        const [formPasswordConfirm, setFormPasswordConfirm] = useState("");
        const [formMode, setFormMode] = useState("login");
        const [authView, setAuthView] = useState("options");
        const [error, setError] = useState("");
        const [loading, setLoading] = useState(false);
        const [dropdownOpen, setDropdownOpen] = useState(false);
        const [exportPassword, setExportPassword] = useState("");
        const [importPassword, setImportPassword] = useState("");
        const [importPairData, setImportPairData] = useState("");
        const [exportedPair, setExportedPair] = useState("");
        const [showCopySuccess, setShowCopySuccess] = useState(false);
        const [showImportSuccess, setShowImportSuccess] = useState(false);
        const [webauthnSeedPhrase, setWebauthnSeedPhrase] = useState("");
        const [webauthnRecoverySeed, setWebauthnRecoverySeed] = useState("");
        const [formMnemonic, setFormMnemonic] = useState("");
        const dropdownRef = useRef(null);
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
        useEffect(() => {
            if (hasPendingSignup) {
                setModalIsOpen(true);
                if (authView !== "webauthn-signup-result") {
                    if (webauthnSeedPhrase) {
                        setAuthView("webauthn-signup-result");
                    }
                }
            }
        }, [hasPendingSignup, authView, webauthnSeedPhrase]);
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
                }
                else if (result && result.redirectUrl) {
                    window.location.href = result.redirectUrl;
                }
                else {
                    const shouldShowWebauthnSeed = formMode === "signup" &&
                        method === "webauthn" &&
                        result &&
                        result.success &&
                        result.seedPhrase;
                    if (shouldShowWebauthnSeed) {
                        setWebauthnSeedPhrase(result.seedPhrase);
                        setShowCopySuccess(false);
                        setAuthView("webauthn-signup-result");
                    }
                    else {
                        setModalIsOpen(false);
                    }
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
            console.log(`[DEBUG] handleSubmit called, formMode: ${formMode}, username: ${formUsername}`);
            setError("");
            setLoading(true);
            try {
                if (formMode === "signup") {
                    const result = await signUp("password", formUsername, formPassword, formPasswordConfirm);
                    if (result && result.success) {
                        // Password hint functionality has been removed from shogun-core
                        // Users should store hints manually in their own data structures if needed
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
                    throw new Error((result === null || result === void 0 ? void 0 : result.error) || "Failed to restore account");
                }
                const seedToDisplay = result.seedPhrase || recoveryCode;
                setWebauthnSeedPhrase(seedToDisplay);
                setWebauthnRecoverySeed("");
                setShowCopySuccess(false);
                setAuthView("webauthn-signup-result");
            }
            catch (e) {
                setError(e.message || "Failed to restore WebAuthn account");
            }
            finally {
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
            }
            catch (e) {
                setError(e.message || "Challenge login failed");
            }
            finally {
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
            }
            catch (e) {
                setError(e.message || "Seed login failed");
            }
            finally {
                setLoading(false);
            }
        };
        const handleExportPair = async () => {
            setError("");
            setLoading(true);
            try {
                const pairData = await exportZenPair(exportPassword || undefined);
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
                const success = await importZenPair(importPairData, importPassword || undefined);
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
            setError("");
            setLoading(false);
            setAuthView("options");
            setExportPassword("");
            setImportPassword("");
            setImportPairData("");
            setExportedPair("");
            setShowCopySuccess(false);
            setShowImportSuccess(false);
            // Additional reset code if needed
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
        const finalizeSignup = () => {
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
        const renderAuthOptions = () => (React.createElement("div", { className: "shogun-auth-options" },
            options.showMetamask !== false && hasPlugin("web3") && (React.createElement("div", { className: "shogun-auth-option-group" },
                React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => handleAuth("web3"), disabled: loading },
                    React.createElement(WalletIcon, null),
                    formMode === "login"
                        ? "Login with MetaMask"
                        : "Signup with MetaMask"))),
            options.showWebauthn !== false && hasPlugin("webauthn") && (React.createElement("div", { className: "shogun-auth-option-group" },
                React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: handleWebAuthnAuth, disabled: loading },
                    React.createElement(WebAuthnIcon, null),
                    formMode === "login"
                        ? "Login with WebAuthn"
                        : "Signup with WebAuthn"))),
            options.showNostr !== false && hasPlugin("nostr") && (React.createElement("div", { className: "shogun-auth-option-group" },
                React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => handleAuth("nostr"), disabled: loading },
                    React.createElement(NostrIcon, null),
                    formMode === "login" ? "Login with Nostr" : "Signup with Nostr"))),
            options.showChallenge !== false && hasPlugin("challenge") && (React.createElement("div", { className: "shogun-auth-option-group" },
                React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: handleChallengeAuth, disabled: loading },
                    React.createElement(ChallengeIcon, null),
                    formMode === "login"
                        ? "Login with Challenge"
                        : "Signup with Challenge (N/A)"))),
            React.createElement("div", { className: "shogun-divider" },
                React.createElement("span", null, "or")),
            React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => setAuthView("password"), disabled: loading },
                React.createElement(LockIcon, null),
                formMode === "login"
                    ? "Login with Password"
                    : "Signup with Password"),
            options.showSeedLogin !== false && formMode === "login" && (React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => setAuthView("seed-login"), disabled: loading },
                React.createElement(KeyIcon, null),
                "Login with Seed phrase")),
            formMode === "login" && (React.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => setAuthView("import"), disabled: loading },
                React.createElement(ImportIcon, null),
                "Import Zen Pair"))));
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
                    React.createElement("input", { type: "password", id: "passwordConfirm", value: formPasswordConfirm, onChange: (e) => setFormPasswordConfirm(e.target.value), disabled: loading, required: true, placeholder: "Confirm your password" })))),
            React.createElement("button", { type: "submit", className: "shogun-submit-button", disabled: loading }, loading
                ? "Processing..."
                : formMode === "login"
                    ? "Sign In"
                    : "Create Account"),
            React.createElement("div", { className: "shogun-form-footer" },
                React.createElement("button", { type: "button", className: "shogun-toggle-mode shogun-prominent-toggle", onClick: toggleMode, disabled: loading }, formMode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Log in"))));
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
                React.createElement("button", { type: "button", className: "shogun-back-button", onClick: () => setAuthView("options"), disabled: loading }, "\u2190 Back to Options"),
                formMode === "login" && (React.createElement("button", { type: "button", className: "shogun-toggle-mode", onClick: () => setAuthView("webauthn-recovery"), disabled: loading }, "Restore with Recovery Code")))));
        const renderWebauthnRecoveryForm = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("h3", null, "Restore WebAuthn Account"),
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
                    } }, "\u26A0\uFE0F Recovery Required"),
                React.createElement("p", { style: {
                        fontSize: "13px",
                        color: "#a16207",
                        margin: "4px 0 0 0",
                    } }, "Enter the username and recovery code saved during signup to restore access on this device.")),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "recoveryUsername" },
                    React.createElement(UserIcon, null),
                    React.createElement("span", null, "Username")),
                React.createElement("input", { type: "text", id: "recoveryUsername", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, placeholder: "Enter your username", autoFocus: true })),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "recoverySeed" },
                    React.createElement(KeyIcon, null),
                    React.createElement("span", null, "Recovery Code")),
                React.createElement("textarea", { id: "recoverySeed", value: webauthnRecoverySeed, onChange: (e) => setWebauthnRecoverySeed(e.target.value), disabled: loading, placeholder: "Enter your WebAuthn seed phrase...", rows: 4, style: {
                        fontFamily: "monospace",
                        fontSize: "12px",
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #f59e0b",
                        borderRadius: "4px",
                        backgroundColor: "#fffbeb",
                    } })),
            React.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleWebauthnImport, disabled: loading }, loading ? "Restoring..." : "Restore Account"),
            React.createElement("div", { className: "shogun-form-footer" },
                React.createElement("button", { type: "button", className: "shogun-back-button", onClick: () => {
                        setError("");
                        setAuthView("webauthn-username");
                    }, disabled: loading }, "\u2190 Back to WebAuthn"))));
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
        const renderWebauthnSignupResult = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("h3", null, "WebAuthn Account Created!"),
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
                    } }, "\u26A0\uFE0F Important: Save Your Recovery Code"),
                React.createElement("p", { style: { fontSize: "13px", color: "#a16207", margin: "4px 0 0 0" } }, "This seed phrase lets you add new devices or recover your WebAuthn account. Keep it private and store it securely.")),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", null, "Your WebAuthn Recovery Code (Seed Phrase):"),
                React.createElement("textarea", { value: webauthnSeedPhrase, readOnly: true, rows: 4, style: {
                        fontFamily: "monospace",
                        fontSize: "12px",
                        width: "100%",
                        padding: "8px",
                        border: "2px solid #f59e0b",
                        borderRadius: "4px",
                        backgroundColor: "#fffbeb",
                    } }),
                React.createElement("button", { type: "button", className: "shogun-submit-button", style: { marginTop: "8px" }, onClick: async () => {
                        if (navigator.clipboard && webauthnSeedPhrase) {
                            await navigator.clipboard.writeText(webauthnSeedPhrase);
                            setShowCopySuccess(true);
                            setTimeout(() => setShowCopySuccess(false), 3000);
                        }
                    }, disabled: !webauthnSeedPhrase }, showCopySuccess ? "✅ Copied!" : "📋 Copy Recovery Code"),
                !navigator.clipboard && (React.createElement("p", { style: { fontSize: "12px", color: "#666", marginTop: "8px" } }, "\u26A0\uFE0F Please manually copy the code above for safekeeping."))),
            React.createElement("div", { style: {
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    padding: "12px",
                    borderRadius: "8px",
                    marginTop: "16px",
                    fontSize: "14px",
                    border: "1px solid #22c55e",
                    textAlign: "center",
                } }, "\u2705 You're now logged in with WebAuthn!"),
            React.createElement("button", { type: "button", className: "shogun-submit-button", style: { marginTop: "16px" }, onClick: finalizeSignup }, "Close and Start Using App")));
        const renderChallengeForm = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "challenge-username" },
                    React.createElement(UserIcon, null),
                    React.createElement("span", null, "Username")),
                React.createElement("input", { type: "text", id: "challenge-username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true, placeholder: "Enter your username", autoFocus: true })),
            React.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleChallengeLogin, disabled: loading }, loading ? "Processing..." : "Continue"),
            React.createElement("button", { type: "button", className: "shogun-back-button", onClick: () => setAuthView("options"), disabled: loading }, "Back")));
        const renderSeedLoginForm = () => (React.createElement("div", { className: "shogun-auth-form" },
            React.createElement("h3", null, "Login with Seed Phrase"),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "seed-username" },
                    React.createElement(UserIcon, null),
                    React.createElement("span", null, "Username")),
                React.createElement("input", { type: "text", id: "seed-username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true, placeholder: "Enter your username", autoFocus: true })),
            React.createElement("div", { className: "shogun-form-group" },
                React.createElement("label", { htmlFor: "seed-mnemonic" },
                    React.createElement(KeyIcon, null),
                    React.createElement("span", null, "Seed Phrase (12/24 words)")),
                React.createElement("textarea", { id: "seed-mnemonic", value: formMnemonic, onChange: (e) => setFormMnemonic(e.target.value), disabled: loading, required: true, placeholder: "Enter your seed phrase...", rows: 3, style: {
                        fontFamily: "monospace",
                        fontSize: "12px",
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                    } })),
            React.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleSeedLogin, disabled: loading || !formUsername.trim() || !formMnemonic.trim() }, loading ? "Processing..." : "Login with Seed"),
            React.createElement("button", { type: "button", className: "shogun-back-button", onClick: () => setAuthView("options"), disabled: loading }, "Back")));
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
                        React.createElement("h2", null, authView === "export"
                            ? "Export Gun Pair"
                            : authView === "import"
                                ? "Import Gun Pair"
                                : authView === "webauthn-username"
                                    ? "WebAuthn"
                                    : authView === "seed-login"
                                        ? "Login with Seed"
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
                        authView === "seed-login" && renderSeedLoginForm(),
                        authView === "password" && (React.createElement(React.Fragment, null,
                            React.createElement("button", { className: "shogun-back-button", onClick: () => setAuthView("options") }, "\u2190 Back"),
                            renderPasswordForm())),
                        authView === "export" && renderExportForm(),
                        authView === "import" && renderImportForm(),
                        authView === "webauthn-username" &&
                            renderWebAuthnUsernameForm(),
                        authView === "webauthn-recovery" &&
                            renderWebauthnRecoveryForm(),
                        authView === "webauthn-signup-result" &&
                            renderWebauthnSignupResult(),
                        authView === "challenge-username" && renderChallengeForm()))))));
    };
    Button.displayName = "ShogunButton";
    return Object.assign(Button, {
        Provider: ShogunButtonProvider,
        useShogun: useShogun,
    });
})();

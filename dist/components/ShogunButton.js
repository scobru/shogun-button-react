"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShogunButton = exports.useShogun = void 0;
exports.ShogunButtonProvider = ShogunButtonProvider;
const react_1 = __importStar(require("react"));
const rxjs_1 = require("rxjs");
require("../styles/index.css");
// Default context
const defaultShogunContext = {
    sdk: null,
    options: {},
    isLoggedIn: false,
    isConnected: false,
    userPub: null,
    username: null,
    login: async () => ({}),
    signUp: async () => ({}),
    logout: () => { },
    observe: () => new rxjs_1.Observable(),
    hasPlugin: () => false,
    getPlugin: () => undefined,
    exportGunPair: async () => "",
    importGunPair: async () => false,
};
// Create context using React's createContext directly
const ShogunContext = (0, react_1.createContext)(defaultShogunContext);
// Custom hook to access the context
const useShogun = () => (0, react_1.useContext)(ShogunContext);
exports.useShogun = useShogun;
// Provider component
function ShogunButtonProvider({ children, sdk, options, onLoginSuccess, onSignupSuccess, onError, onLogout, // AGGIUNTA
 }) {
    var _a, _b;
    // Use React's useState directly
    const [isLoggedIn, setIsLoggedIn] = (0, react_1.useState)(false);
    const [userPub, setUserPub] = (0, react_1.useState)(null);
    const [username, setUsername] = (0, react_1.useState)(null);
    // Effetto per gestire l'inizializzazione e pulizia
    (0, react_1.useEffect)(() => {
        var _a, _b;
        console.log(`🔧 ShogunButtonProvider useEffect - SDK available:`, !!sdk);
        if (!sdk)
            return;
        // Check for existing session data
        const sessionData = sessionStorage.getItem("gunSessionData");
        const pairData = sessionStorage.getItem("gun/pair") || sessionStorage.getItem("pair");
        console.log(`🔧 Session data available:`, {
            hasSessionData: !!sessionData,
            hasPairData: !!pairData,
        });
        // Verifichiamo se l'utente è già loggato all'inizializzazione
        // Aggiungiamo un controllo di sicurezza per verificare se il metodo esiste
        if (sdk && typeof sdk.isLoggedIn === "function") {
            const isLoggedIn = sdk.isLoggedIn();
            console.log(`🔧 SDK isLoggedIn(): ${isLoggedIn}`);
            if (isLoggedIn) {
                const pub = (_b = (_a = sdk.gun.user()) === null || _a === void 0 ? void 0 : _a.is) === null || _b === void 0 ? void 0 : _b.pub;
                console.log(`🔧 User already logged in with pub: ${pub === null || pub === void 0 ? void 0 : pub.slice(0, 8)}...`);
                if (pub) {
                    console.log(`🔧 Setting user state from existing session`);
                    setIsLoggedIn(true);
                    setUserPub(pub);
                    setUsername(pub.slice(0, 8) + "...");
                }
            }
            else {
                console.log(`🔧 User not logged in`);
                // Try to restore session if we have pair data
                if (pairData && !isLoggedIn) {
                    console.log(`🔧 Attempting to restore session from pair data`);
                    try {
                        const pair = JSON.parse(pairData);
                        if (pair.pub) {
                            console.log(`🔧 Found pair with pub: ${pair.pub.slice(0, 8)}...`);
                            // Don't auto-login, just log the available data
                        }
                    }
                    catch (error) {
                        console.error(`🔧 Error parsing pair data:`, error);
                    }
                }
            }
        }
        else {
            console.log(`🔧 SDK isLoggedIn method not available`);
        }
        // Poiché il metodo 'on' non esiste su ShogunCore,
        // gestiamo gli stati direttamente nei metodi di login/logout
    }, [sdk, onLoginSuccess]);
    // RxJS observe method
    const observe = (path) => {
        if (!sdk) {
            return new rxjs_1.Observable();
        }
        return sdk.rx.observe(path);
    };
    // Unified login
    const login = async (method, ...args) => {
        var _a, _b, _c;
        console.log(`🔧 ShogunButtonProvider.login called with method: ${method}`, args);
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            let result;
            let authMethod = method;
            let username;
            console.log(`🔧 Processing login method: ${method}`);
            switch (method) {
                case "password":
                    username = args[0];
                    console.log(`🔧 Password login for username: ${username}`);
                    result = await sdk.login(args[0], args[1]);
                    break;
                case "pair":
                    // New pair authentication method
                    const pair = args[0];
                    if (!pair || typeof pair !== "object") {
                        throw new Error("Invalid pair data provided");
                    }
                    console.log(`🔧 Pair login with pub: ${(_a = pair.pub) === null || _a === void 0 ? void 0 : _a.slice(0, 8)}...`);
                    // Prefer official API from shogun-core when available
                    if (typeof sdk.loginWithPair === "function") {
                        result = await sdk.loginWithPair(pair);
                    }
                    else {
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
                    }
                    username = result.alias;
                    authMethod = "pair";
                    break;
                case "webauthn":
                    username = args[0];
                    console.log(`🔧 WebAuthn login for username: ${username}`);
                    const webauthn = sdk.getPlugin("webauthn");
                    if (!webauthn)
                        throw new Error("WebAuthn plugin not available");
                    result = await webauthn.login(username);
                    authMethod = "webauthn";
                    break;
                case "web3":
                    console.log(`🔧 Web3 login initiated`);
                    const web3 = sdk.getPlugin("web3");
                    if (!web3)
                        throw new Error("Web3 plugin not available");
                    const connectionResult = await web3.connectMetaMask();
                    if (!connectionResult.success || !connectionResult.address) {
                        throw new Error(connectionResult.error || "Failed to connect wallet.");
                    }
                    username = connectionResult.address;
                    console.log(`🔧 Web3 connected to address: ${username}`);
                    result = await web3.login(connectionResult.address);
                    authMethod = "web3";
                    break;
                case "nostr":
                    console.log(`🔧 Nostr login initiated`);
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
                    console.log(`🔧 Nostr connected to pubkey: ${username}`);
                    result = await nostr.login(pubkey);
                    authMethod = "nostr";
                    break;
                case "oauth":
                    console.log(`🔧 OAuth login initiated`);
                    const oauth = sdk.getPlugin("oauth");
                    if (!oauth)
                        throw new Error("OAuth plugin not available");
                    const provider = args[0] || "google";
                    // Se abbiamo code e state, significa che siamo in un callback
                    if (args[1] && args[2]) {
                        const code = args[1];
                        const state = args[2];
                        result = await oauth.handleOAuthCallback(provider, code, state);
                    }
                    else {
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
            console.log(`🔧 Login result:`, result);
            if (result.success) {
                // Try multiple ways to get userPub
                let userPub = result.userPub;
                if (!userPub) {
                    console.log(`🔧 userPub not in result, trying sdk.gun.user()?.is?.pub`);
                    userPub = (_c = (_b = sdk.gun.user()) === null || _b === void 0 ? void 0 : _b.is) === null || _c === void 0 ? void 0 : _c.pub;
                }
                if (!userPub) {
                    console.log(`🔧 userPub still not available, trying to get from gun user object`);
                    const gunUser = sdk.gun.user();
                    console.log(`🔧 Gun user object:`, gunUser);
                    if (gunUser && gunUser.is) {
                        userPub = gunUser.is.pub;
                        console.log(`🔧 Found userPub in gun user:`, userPub ? userPub.slice(0, 8) + "..." : "null");
                    }
                }
                if (!userPub) {
                    console.error(`🔧 Could not get userPub after successful login`);
                    // Try to get it from the result object if available
                    if (result &&
                        typeof result === "object" &&
                        "user" in result &&
                        result.user &&
                        typeof result.user === "object" &&
                        "pub" in result.user) {
                        userPub = result.user.pub;
                        console.log(`🔧 Got userPub from result.user:`, userPub ? userPub.slice(0, 8) + "..." : "null");
                    }
                }
                const displayName = result.alias ||
                    username ||
                    (userPub ? userPub.slice(0, 8) + "..." : "Unknown User");
                console.log(`🔧 Login successful! Setting user state:`, {
                    userPub: userPub ? userPub.slice(0, 8) + "..." : "null",
                    displayName,
                    authMethod,
                });
                setIsLoggedIn(true);
                setUserPub(userPub || "");
                setUsername(displayName);
                onLoginSuccess === null || onLoginSuccess === void 0 ? void 0 : onLoginSuccess({
                    userPub: userPub || "",
                    username: displayName,
                    authMethod: authMethod,
                });
            }
            else {
                console.error(`🔧 Login failed:`, result.error);
                onError === null || onError === void 0 ? void 0 : onError(result.error || "Login failed");
            }
            return result;
        }
        catch (error) {
            console.error(`🔧 Login error:`, error);
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
                    // Se abbiamo code e state, significa che siamo in un callback
                    if (args[1] && args[2]) {
                        const code = args[1];
                        const state = args[2];
                        result = await oauth.handleOAuthCallback(provider, code, state);
                    }
                    else {
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
        return sdk && typeof sdk.hasPlugin === "function"
            ? sdk.hasPlugin(name)
            : false;
    };
    const getPlugin = (name) => {
        return sdk && typeof sdk.getPlugin === "function"
            ? sdk.getPlugin(name)
            : undefined;
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
            // Prefer SDK export if available, fallback to storage
            let pairJson = null;
            if (typeof sdk.exportPair === "function") {
                pairJson = sdk.exportPair();
            }
            else {
                const stored = sessionStorage.getItem("gun/pair") ||
                    sessionStorage.getItem("pair") ||
                    null;
                // Stored value is already a JSON stringified pair; don't double-encode
                pairJson = stored;
            }
            if (!pairJson) {
                throw new Error("No Gun pair available for current user");
            }
            let pairData = pairJson;
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
    return (react_1.default.createElement(ShogunContext.Provider, { value: {
            sdk,
            options,
            isLoggedIn,
            isConnected: !!((_b = (_a = sdk === null || sdk === void 0 ? void 0 : sdk.gun.user()) === null || _a === void 0 ? void 0 : _a.is) === null || _b === void 0 ? void 0 : _b.pub), // Verifica corretta se l'utente Gun è autenticato
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
const WalletIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("path", { d: "M21 12V7H5a2 2 0 0 1 0-4h14v4" }),
    react_1.default.createElement("path", { d: "M3 5v14a2 2 0 0 0 2 2h16v-5" }),
    react_1.default.createElement("path", { d: "M18 12a2 2 0 0 0 0 4h4v-4Z" })));
const KeyIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("circle", { cx: "7.5", cy: "15.5", r: "5.5" }),
    react_1.default.createElement("path", { d: "m21 2-9.6 9.6" }),
    react_1.default.createElement("path", { d: "m15.5 7.5 3 3L22 7l-3-3" })));
const GoogleIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor" },
    react_1.default.createElement("path", { d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z", fill: "#4285F4" }),
    react_1.default.createElement("path", { d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z", fill: "#34A853" }),
    react_1.default.createElement("path", { d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z", fill: "#FBBC05" }),
    react_1.default.createElement("path", { d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z", fill: "#EA4335" })));
const NostrIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("path", { d: "M19.5 4.5 15 9l-3-3-4.5 4.5L9 12l-1.5 1.5L12 18l4.5-4.5L15 12l1.5-1.5L21 6l-1.5-1.5Z" }),
    react_1.default.createElement("path", { d: "M12 12 6 6l-1.5 1.5L9 12l-4.5 4.5L6 18l6-6Z" })));
const WebAuthnIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("path", { d: "M7 11v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-4" }),
    react_1.default.createElement("path", { d: "M14 4V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2" })));
const LogoutIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
    react_1.default.createElement("polyline", { points: "16 17 21 12 16 7" }),
    react_1.default.createElement("line", { x1: "21", y1: "12", x2: "9", y2: "12" })));
const UserIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
    react_1.default.createElement("circle", { cx: "12", cy: "7", r: "4" })));
const LockIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("rect", { x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2" }),
    react_1.default.createElement("path", { d: "M7 11V7a5 5 0 0 1 10 0v4" })));
const CloseIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
    react_1.default.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })));
const ImportIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    react_1.default.createElement("polyline", { points: "14,2 14,8 20,8" }),
    react_1.default.createElement("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
    react_1.default.createElement("line", { x1: "12", y1: "17", x2: "12", y2: "9" })));
const ExportIcon = () => (react_1.default.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
    react_1.default.createElement("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
    react_1.default.createElement("polyline", { points: "14,2 14,8 20,8" }),
    react_1.default.createElement("line", { x1: "12", y1: "11", x2: "12", y2: "21" }),
    react_1.default.createElement("polyline", { points: "16,15 12,11 8,15" })));
// Component for Shogun login button
exports.ShogunButton = (() => {
    const Button = () => {
        const { isLoggedIn, username, logout, login, signUp, sdk, options, exportGunPair, importGunPair, } = (0, exports.useShogun)();
        // Form states
        const [modalIsOpen, setModalIsOpen] = (0, react_1.useState)(false);
        const [formUsername, setFormUsername] = (0, react_1.useState)("");
        const [formPassword, setFormPassword] = (0, react_1.useState)("");
        const [formPasswordConfirm, setFormPasswordConfirm] = (0, react_1.useState)("");
        const [formHint, setFormHint] = (0, react_1.useState)("");
        const [formSecurityQuestion] = (0, react_1.useState)("What is your favorite color?"); // Hardcoded for now
        const [formSecurityAnswer, setFormSecurityAnswer] = (0, react_1.useState)("");
        const [formMode, setFormMode] = (0, react_1.useState)("login");
        const [authView, setAuthView] = (0, react_1.useState)("options");
        const [error, setError] = (0, react_1.useState)("");
        const [loading, setLoading] = (0, react_1.useState)(false);
        const [dropdownOpen, setDropdownOpen] = (0, react_1.useState)(false);
        const [recoveredHint, setRecoveredHint] = (0, react_1.useState)("");
        const [exportPassword, setExportPassword] = (0, react_1.useState)("");
        const [importPassword, setImportPassword] = (0, react_1.useState)("");
        const [importPairData, setImportPairData] = (0, react_1.useState)("");
        const [exportedPair, setExportedPair] = (0, react_1.useState)("");
        const [showCopySuccess, setShowCopySuccess] = (0, react_1.useState)(false);
        const [showImportSuccess, setShowImportSuccess] = (0, react_1.useState)(false);
        const dropdownRef = (0, react_1.useRef)(null);
        // Rimuovi tutto ciò che riguarda oauthPin
        // Handle click outside to close dropdown
        (0, react_1.useEffect)(() => {
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
            return (react_1.default.createElement("div", { className: "shogun-logged-in-container" },
                react_1.default.createElement("div", { className: "shogun-dropdown", ref: dropdownRef },
                    react_1.default.createElement("button", { className: "shogun-button shogun-logged-in", onClick: () => setDropdownOpen(!dropdownOpen) },
                        react_1.default.createElement("div", { className: "shogun-avatar" }, username.substring(0, 2).toUpperCase()),
                        react_1.default.createElement("span", { className: "shogun-username" }, username.length > 12
                            ? `${username.substring(0, 6)}...${username.substring(username.length - 4)}`
                            : username)),
                    dropdownOpen && (react_1.default.createElement("div", { className: "shogun-dropdown-menu" },
                        react_1.default.createElement("div", { className: "shogun-dropdown-header" },
                            react_1.default.createElement("div", { className: "shogun-avatar-large" }, username.substring(0, 2).toUpperCase()),
                            react_1.default.createElement("div", { className: "shogun-user-info" },
                                react_1.default.createElement("span", { className: "shogun-username-full" }, username.length > 20
                                    ? `${username.substring(0, 10)}...${username.substring(username.length - 6)}`
                                    : username))),
                        react_1.default.createElement("div", { className: "shogun-dropdown-item", onClick: () => {
                                setDropdownOpen(false);
                                setAuthView("export");
                                setModalIsOpen(true);
                            } },
                            react_1.default.createElement(ExportIcon, null),
                            react_1.default.createElement("span", null, "Export Pair")),
                        react_1.default.createElement("div", { className: "shogun-dropdown-item", onClick: logout },
                            react_1.default.createElement(LogoutIcon, null),
                            react_1.default.createElement("span", null, "Disconnect")))))));
        }
        // Event handlers
        const handleAuth = async (method, ...args) => {
            console.log(`🔧 handleAuth called with method: ${method}`, args);
            setError("");
            setLoading(true);
            try {
                // Use formMode to determine whether to call login or signUp
                const action = formMode === "login" ? login : signUp;
                console.log(`🔧 Using action: ${formMode === "login" ? "login" : "signUp"}`);
                console.log(`🔧 Calling ${action.name} with method: ${method}`);
                const result = await action(method, ...args);
                console.log(`🔧 ${action.name} result:`, result);
                if (result && !result.success && result.error) {
                    console.error(`🔧 ${action.name} failed with error:`, result.error);
                    setError(result.error);
                }
                else if (result && result.redirectUrl) {
                    console.log(`🔧 Redirecting to: ${result.redirectUrl}`);
                    window.location.href = result.redirectUrl;
                }
                else if (result && result.success) {
                    console.log(`🔧 ${action.name} successful, closing modal`);
                    setModalIsOpen(false);
                }
                else {
                    console.warn(`🔧 Unexpected result:`, result);
                    setModalIsOpen(false);
                }
            }
            catch (e) {
                console.error(`🔧 handleAuth error:`, e);
                setError(e.message || "An unexpected error occurred.");
            }
            finally {
                console.log(`🔧 handleAuth completed, setting loading to false`);
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
                        if (sdk === null || sdk === void 0 ? void 0 : sdk.db) {
                            sdk.db.setPasswordHint(formHint);
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
                if (!(sdk === null || sdk === void 0 ? void 0 : sdk.db)) {
                    throw new Error("SDK not ready");
                }
                const result = await sdk.db.forgotPassword(formUsername, [
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
            console.log("🔧 toggleMode called - current formMode:", formMode);
            console.log("🔧 loading state:", loading);
            resetForm();
            setAuthView("options"); // Porta alla selezione dei metodi invece che direttamente al form password
            setFormMode((prev) => {
                const newMode = prev === "login" ? "signup" : "login";
                console.log("🔧 Switching from", prev, "to", newMode);
                return newMode;
            });
        };
        // Add buttons for both login and signup for alternative auth methods
        const renderAuthOptions = () => (react_1.default.createElement("div", { className: "shogun-auth-options" },
            options.showMetamask !== false && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("web3")) && (react_1.default.createElement("div", { className: "shogun-auth-option-group" },
                react_1.default.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => handleAuth("web3"), disabled: loading },
                    react_1.default.createElement(WalletIcon, null),
                    formMode === "login"
                        ? "Login with MetaMask"
                        : "Signup with MetaMask"))),
            options.showWebauthn !== false && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("webauthn")) && (react_1.default.createElement("div", { className: "shogun-auth-option-group" },
                react_1.default.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: handleWebAuthnAuth, disabled: loading },
                    react_1.default.createElement(WebAuthnIcon, null),
                    formMode === "login"
                        ? "Login with WebAuthn"
                        : "Signup with WebAuthn"))),
            options.showNostr !== false && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("nostr")) && (react_1.default.createElement("div", { className: "shogun-auth-option-group" },
                react_1.default.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => handleAuth("nostr"), disabled: loading },
                    react_1.default.createElement(NostrIcon, null),
                    formMode === "login" ? "Login with Nostr" : "Signup with Nostr"))),
            options.showOauth !== false && (sdk === null || sdk === void 0 ? void 0 : sdk.hasPlugin("oauth")) && (react_1.default.createElement("div", { className: "shogun-auth-option-group" },
                react_1.default.createElement("button", { type: "button", className: "shogun-auth-option-button shogun-google-button", onClick: () => handleAuth("oauth", "google"), disabled: loading },
                    react_1.default.createElement(GoogleIcon, null),
                    formMode === "login"
                        ? "Login with Google"
                        : "Signup with Google"))),
            react_1.default.createElement("div", { className: "shogun-divider" },
                react_1.default.createElement("span", null, "or")),
            react_1.default.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => setAuthView("password"), disabled: loading },
                react_1.default.createElement(LockIcon, null),
                formMode === "login"
                    ? "Login with Password"
                    : "Signup with Password"),
            formMode === "login" && (react_1.default.createElement("button", { type: "button", className: "shogun-auth-option-button", onClick: () => setAuthView("import"), disabled: loading },
                react_1.default.createElement(ImportIcon, null),
                "Import Gun Pair"))));
        const renderPasswordForm = () => (react_1.default.createElement("form", { onSubmit: handleSubmit, className: "shogun-auth-form" },
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", { htmlFor: "username" },
                    react_1.default.createElement(UserIcon, null),
                    react_1.default.createElement("span", null, "Username")),
                react_1.default.createElement("input", { type: "text", id: "username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true, placeholder: "Enter your username" })),
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", { htmlFor: "password" },
                    react_1.default.createElement(LockIcon, null),
                    react_1.default.createElement("span", null, "Password")),
                react_1.default.createElement("input", { type: "password", id: "password", value: formPassword, onChange: (e) => setFormPassword(e.target.value), disabled: loading, required: true, placeholder: "Enter your password" })),
            formMode === "signup" && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement("div", { className: "shogun-form-group" },
                    react_1.default.createElement("label", { htmlFor: "passwordConfirm" },
                        react_1.default.createElement(KeyIcon, null),
                        react_1.default.createElement("span", null, "Confirm Password")),
                    react_1.default.createElement("input", { type: "password", id: "passwordConfirm", value: formPasswordConfirm, onChange: (e) => setFormPasswordConfirm(e.target.value), disabled: loading, required: true, placeholder: "Confirm your password" })),
                react_1.default.createElement("div", { className: "shogun-form-group" },
                    react_1.default.createElement("label", { htmlFor: "hint" },
                        react_1.default.createElement(UserIcon, null),
                        react_1.default.createElement("span", null, "Password Hint")),
                    react_1.default.createElement("input", { type: "text", id: "hint", value: formHint, onChange: (e) => setFormHint(e.target.value), disabled: loading, required: true, placeholder: "Enter your password hint" })),
                react_1.default.createElement("div", { className: "shogun-form-group" },
                    react_1.default.createElement("label", { htmlFor: "securityQuestion" },
                        react_1.default.createElement(UserIcon, null),
                        react_1.default.createElement("span", null, "Security Question")),
                    react_1.default.createElement("input", { type: "text", id: "securityQuestion", value: formSecurityQuestion, disabled: true })),
                react_1.default.createElement("div", { className: "shogun-form-group" },
                    react_1.default.createElement("label", { htmlFor: "securityAnswer" },
                        react_1.default.createElement(UserIcon, null),
                        react_1.default.createElement("span", null, "Security Answer")),
                    react_1.default.createElement("input", { type: "text", id: "securityAnswer", value: formSecurityAnswer, onChange: (e) => setFormSecurityAnswer(e.target.value), disabled: loading, required: true, placeholder: "Enter your security answer" })))),
            react_1.default.createElement("button", { type: "submit", className: "shogun-submit-button", disabled: loading }, loading
                ? "Processing..."
                : formMode === "login"
                    ? "Sign In"
                    : "Create Account"),
            react_1.default.createElement("div", { className: "shogun-form-footer" },
                react_1.default.createElement("button", { type: "button", className: "shogun-toggle-mode shogun-prominent-toggle", onClick: () => {
                        console.log("🔧 Signup button clicked!");
                        console.log("🔧 Current formMode:", formMode);
                        console.log("🔧 Current loading:", loading);
                        console.log("🔧 Current authView:", authView);
                        toggleMode();
                    }, disabled: loading }, formMode === "login"
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Log in"),
                formMode === "login" && (react_1.default.createElement("button", { type: "button", className: "shogun-toggle-mode", onClick: () => setAuthView("recover"), disabled: loading }, "Forgot password?")))));
        const renderWebAuthnUsernameForm = () => (react_1.default.createElement("div", { className: "shogun-auth-form" },
            react_1.default.createElement("h3", null, formMode === "login"
                ? "Login with WebAuthn"
                : "Sign Up with WebAuthn"),
            react_1.default.createElement("div", { style: {
                    backgroundColor: "#f0f9ff",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #0ea5e9",
                } },
                react_1.default.createElement("p", { style: {
                        fontSize: "14px",
                        color: "#0c4a6e",
                        margin: "0",
                        fontWeight: "500",
                    } }, "\uD83D\uDD11 WebAuthn Authentication"),
                react_1.default.createElement("p", { style: { fontSize: "13px", color: "#075985", margin: "4px 0 0 0" } },
                    "Please enter your username to continue with WebAuthn",
                    " ",
                    formMode === "login" ? "login" : "registration",
                    ".")),
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", { htmlFor: "username" },
                    react_1.default.createElement(UserIcon, null),
                    react_1.default.createElement("span", null, "Username")),
                react_1.default.createElement("input", { type: "text", id: "username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true, placeholder: "Enter your username", autoFocus: true })),
            react_1.default.createElement("button", { type: "button", className: "shogun-submit-button", onClick: () => handleAuth("webauthn", formUsername), disabled: loading || !formUsername.trim() }, loading ? "Processing..." : `Continue with WebAuthn`),
            react_1.default.createElement("div", { className: "shogun-form-footer" },
                react_1.default.createElement("button", { type: "button", className: "shogun-back-button", onClick: () => setAuthView("options"), disabled: loading }, "\u2190 Back to Options"))));
        const renderRecoveryForm = () => (react_1.default.createElement("div", { className: "shogun-auth-form" },
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", { htmlFor: "username" },
                    react_1.default.createElement(UserIcon, null),
                    react_1.default.createElement("span", null, "Username")),
                react_1.default.createElement("input", { type: "text", id: "username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true, placeholder: "Enter your username" })),
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", null, "Security Question"),
                react_1.default.createElement("p", null, formSecurityQuestion)),
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", { htmlFor: "securityAnswer" },
                    react_1.default.createElement(KeyIcon, null),
                    react_1.default.createElement("span", null, "Answer")),
                react_1.default.createElement("input", { type: "text", id: "securityAnswer", value: formSecurityAnswer, onChange: (e) => setFormSecurityAnswer(e.target.value), disabled: loading, required: true, placeholder: "Enter your answer" })),
            react_1.default.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleRecover, disabled: loading }, loading ? "Recovering..." : "Get Hint"),
            react_1.default.createElement("div", { className: "shogun-form-footer" },
                react_1.default.createElement("button", { className: "shogun-toggle-mode", onClick: () => setAuthView("password"), disabled: loading }, "Back to Login"))));
        const renderHint = () => (react_1.default.createElement("div", { className: "shogun-auth-form" },
            react_1.default.createElement("h3", null, "Your Password Hint"),
            react_1.default.createElement("p", { className: "shogun-hint" }, recoveredHint),
            react_1.default.createElement("button", { className: "shogun-submit-button", onClick: () => {
                    setAuthView("password");
                    resetForm();
                    setFormMode("login");
                } }, "Back to Login")));
        const renderExportForm = () => (react_1.default.createElement("div", { className: "shogun-auth-form" },
            react_1.default.createElement("h3", null, "Export Gun Pair"),
            react_1.default.createElement("div", { style: {
                    backgroundColor: "#f0f9ff",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #0ea5e9",
                } },
                react_1.default.createElement("p", { style: {
                        fontSize: "14px",
                        color: "#0c4a6e",
                        margin: "0",
                        fontWeight: "500",
                    } }, "\uD83D\uDD12 Backup Your Account"),
                react_1.default.createElement("p", { style: { fontSize: "13px", color: "#075985", margin: "4px 0 0 0" } }, "Export your Gun pair to backup your account. You can use this to login from another device or restore access if needed.")),
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", { htmlFor: "exportPassword" },
                    react_1.default.createElement(LockIcon, null),
                    react_1.default.createElement("span", null, "Encryption Password (optional but recommended)")),
                react_1.default.createElement("input", { type: "password", id: "exportPassword", value: exportPassword, onChange: (e) => setExportPassword(e.target.value), disabled: loading, placeholder: "Leave empty to export unencrypted" })),
            exportedPair && (react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", null, "Your Gun Pair (copy this safely):"),
                showCopySuccess && (react_1.default.createElement("div", { style: {
                        backgroundColor: "#dcfce7",
                        color: "#166534",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        marginBottom: "8px",
                        fontSize: "14px",
                        border: "1px solid #22c55e",
                    } }, "\u2705 Copied to clipboard successfully!")),
                react_1.default.createElement("textarea", { value: exportedPair, readOnly: true, rows: 6, style: {
                        fontFamily: "monospace",
                        fontSize: "12px",
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                    } }),
                !navigator.clipboard && (react_1.default.createElement("p", { style: { fontSize: "12px", color: "#666", marginTop: "8px" } }, "\u26A0\uFE0F Auto-copy not available. Please manually copy the text above.")))),
            react_1.default.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleExportPair, disabled: loading }, loading ? "Exporting..." : "Export Pair"),
            react_1.default.createElement("div", { className: "shogun-form-footer" },
                react_1.default.createElement("button", { className: "shogun-toggle-mode", onClick: () => {
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
        const renderImportForm = () => (react_1.default.createElement("div", { className: "shogun-auth-form" },
            react_1.default.createElement("h3", null, "Import Gun Pair"),
            react_1.default.createElement("div", { style: {
                    backgroundColor: "#fef3c7",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    border: "1px solid #f59e0b",
                } },
                react_1.default.createElement("p", { style: {
                        fontSize: "14px",
                        color: "#92400e",
                        margin: "0",
                        fontWeight: "500",
                    } }, "\uD83D\uDD11 Restore Your Account"),
                react_1.default.createElement("p", { style: { fontSize: "13px", color: "#a16207", margin: "4px 0 0 0" } }, "Import a Gun pair to login with your existing account from another device. Make sure you have your backup data ready.")),
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", { htmlFor: "importPairData" },
                    react_1.default.createElement(ImportIcon, null),
                    react_1.default.createElement("span", null, "Gun Pair Data")),
                react_1.default.createElement("textarea", { id: "importPairData", value: importPairData, onChange: (e) => setImportPairData(e.target.value), disabled: loading, placeholder: "Paste your Gun pair JSON here...", rows: 6, style: {
                        fontFamily: "monospace",
                        fontSize: "12px",
                        width: "100%",
                        padding: "8px",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                    } })),
            react_1.default.createElement("div", { className: "shogun-form-group" },
                react_1.default.createElement("label", { htmlFor: "importPassword" },
                    react_1.default.createElement(LockIcon, null),
                    react_1.default.createElement("span", null, "Decryption Password (if encrypted)")),
                react_1.default.createElement("input", { type: "password", id: "importPassword", value: importPassword, onChange: (e) => setImportPassword(e.target.value), disabled: loading, placeholder: "Enter password if pair was encrypted" })),
            showImportSuccess && (react_1.default.createElement("div", { style: {
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    padding: "12px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    fontSize: "14px",
                    border: "1px solid #22c55e",
                    textAlign: "center",
                } }, "\u2705 Pair imported successfully! Logging you in...")),
            react_1.default.createElement("button", { type: "button", className: "shogun-submit-button", onClick: handleImportPair, disabled: loading || showImportSuccess }, loading
                ? "Importing..."
                : showImportSuccess
                    ? "Success!"
                    : "Import and Login"),
            react_1.default.createElement("div", { className: "shogun-form-footer" },
                react_1.default.createElement("button", { className: "shogun-toggle-mode", onClick: () => {
                        setAuthView("options");
                        setImportPassword("");
                        setImportPairData("");
                    }, disabled: loading }, "Back to Login Options"))));
        // Render logic
        return (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement("button", { className: "shogun-connect-button", onClick: openModal },
                react_1.default.createElement(WalletIcon, null),
                react_1.default.createElement("span", null, "Login / Sign Up")),
            modalIsOpen && (react_1.default.createElement("div", { className: "shogun-modal-overlay", onClick: closeModal },
                react_1.default.createElement("div", { className: "shogun-modal", onClick: (e) => e.stopPropagation() },
                    react_1.default.createElement("div", { className: "shogun-modal-header" },
                        react_1.default.createElement("h2", null, authView === "recover"
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
                        react_1.default.createElement("button", { className: "shogun-close-button", onClick: closeModal, "aria-label": "Close" },
                            react_1.default.createElement(CloseIcon, null))),
                    react_1.default.createElement("div", { className: "shogun-modal-content" },
                        error && react_1.default.createElement("div", { className: "shogun-error-message" }, error),
                        authView === "options" && (react_1.default.createElement(react_1.default.Fragment, null,
                            renderAuthOptions(),
                            react_1.default.createElement("div", { className: "shogun-form-footer" },
                                react_1.default.createElement("button", { type: "button", className: "shogun-toggle-mode shogun-prominent-toggle", onClick: () => {
                                        console.log("🔧 Signup button clicked!");
                                        console.log("🔧 Current formMode:", formMode);
                                        console.log("🔧 Current loading:", loading);
                                        console.log("🔧 Current authView:", authView);
                                        toggleMode();
                                    }, disabled: loading }, formMode === "login"
                                    ? "Don't have an account? Sign up"
                                    : "Already have an account? Log in")))),
                        authView === "password" && (react_1.default.createElement(react_1.default.Fragment, null,
                            react_1.default.createElement("button", { className: "shogun-back-button", onClick: () => setAuthView("options") }, "\u2190 Back"),
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
        useShogun: exports.useShogun,
    });
})();

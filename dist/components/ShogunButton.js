import React, { useContext, useState, createContext, useEffect } from 'react';
import { Observable } from 'rxjs';
import '../types.js'; // Import type file to extend definitions
import '../styles/index.css';
// Default context
const defaultContext = {
    sdk: null,
    options: {
        appName: 'Shogun App',
        darkMode: true,
        showMetamask: true,
        showWebauthn: true,
    },
    isLoggedIn: false,
    userPub: null,
    username: null,
    wallet: null,
    did: null,
    login: async () => ({}),
    signUp: async () => ({}),
    loginWithMetaMask: async () => ({}),
    signUpWithMetaMask: async () => ({}),
    loginWithWebAuthn: async () => ({}),
    signUpWithWebAuthn: async () => ({}),
    logout: () => { },
    observe: () => new Observable(),
    getCurrentDID: async () => null,
    resolveDID: async () => ({}),
    authenticateWithDID: async () => ({}),
    registerDIDOnChain: async () => ({}),
    setProvider: () => false,
    hasPlugin: () => false,
    getPlugin: () => undefined,
};
// Create context using React's createContext directly
const ShogunContext = createContext(defaultContext);
// Hook to use Shogun context - use React's useContext directly
export const useShogun = () => useContext(ShogunContext);
// Shogun Provider
export function ShogunButtonProvider({ children, sdk, options, onLoginSuccess, onSignupSuccess, onError, }) {
    // Use React's useState directly
    const [isLoggedIn, setIsLoggedIn] = useState((sdk === null || sdk === void 0 ? void 0 : sdk.isLoggedIn()) || false);
    const [userPub, setUserPub] = useState(null);
    const [username, setUsername] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [did, setDid] = useState(null);
    // Effetto per gestire l'inizializzazione e pulizia
    useEffect(() => {
        // Controlla se l'utente è già autenticato all'avvio
        if (sdk === null || sdk === void 0 ? void 0 : sdk.isLoggedIn()) {
            setIsLoggedIn(true);
            // Recupera le informazioni dell'utente
            setTimeout(async () => {
                // Recupera il DID se esiste
                try {
                    if (sdk.did) {
                        const userDid = await sdk.did.getCurrentUserDID();
                        if (userDid)
                            setDid(userDid);
                    }
                    // Recupera il wallet principale
                    const mainWallet = sdk.getMainWallet();
                    if (mainWallet)
                        setWallet(mainWallet);
                }
                catch (error) {
                    console.error("Errore durante l'inizializzazione:", error);
                }
            }, 0);
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
    // Metodi DID
    const getCurrentDID = async () => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            if (!sdk.did) {
                throw new Error("DID plugin not available");
            }
            return await sdk.did.getCurrentUserDID();
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Errore nel recupero del DID");
            return null;
        }
    };
    const resolveDID = async (did) => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            if (!sdk.did) {
                throw new Error("DID plugin not available");
            }
            return await sdk.did.resolveDID(did);
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Errore nella risoluzione del DID");
            return { success: false, error: error.message };
        }
    };
    const authenticateWithDID = async (did, challenge) => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            if (!sdk.did) {
                throw new Error("DID plugin not available");
            }
            const result = await sdk.did.authenticateWithDID(did, challenge);
            if (result.success) {
                setIsLoggedIn(true);
                setUserPub(result.userPub || "");
                setUsername(result.username || null);
                setDid(did);
                setWallet(sdk.getMainWallet());
                onLoginSuccess === null || onLoginSuccess === void 0 ? void 0 : onLoginSuccess({
                    userPub: result.userPub || "",
                    username: result.username || "",
                    did: did,
                    wallet: sdk.getMainWallet(),
                    authMethod: "standard"
                });
            }
            return result;
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Errore nell'autenticazione con DID");
            return { success: false, error: error.message };
        }
    };
    const registerDIDOnChain = async (did, signer) => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            if (!sdk.did) {
                throw new Error("DID plugin not available");
            }
            return await sdk.did.registerDIDOnChain(did, signer);
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Errore nella registrazione del DID sulla blockchain");
            return { success: false, error: error.message };
        }
    };
    // Standard login
    const login = async (username, password) => {
        try {
            const result = await sdk.login(username, password);
            if (result.success) {
                setIsLoggedIn(true);
                setUserPub(result.userPub || '');
                setUsername(username);
                setWallet(result.wallet || null);
                // Recupera il DID dell'utente dopo il login
                if (result.did) {
                    setDid(result.did);
                }
                else if (sdk.did) {
                    try {
                        const userDid = await sdk.did.getCurrentUserDID();
                        setDid(userDid);
                    }
                    catch (error) {
                        console.error("Errore nel recupero del DID:", error);
                    }
                }
                onLoginSuccess === null || onLoginSuccess === void 0 ? void 0 : onLoginSuccess({
                    userPub: result.userPub || '',
                    username,
                    password,
                    wallet: result.wallet,
                    did: result.did || did,
                    authMethod: 'standard'
                });
                return result;
            }
            onError === null || onError === void 0 ? void 0 : onError(result.error || 'Login failed');
            return result;
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || 'Error during login');
            return { success: false, error: error.message };
        }
    };
    // Standard registration
    const signUp = async (username, password, confirmPassword) => {
        if (password !== confirmPassword) {
            onError === null || onError === void 0 ? void 0 : onError('Passwords do not match');
            return { success: false, error: 'Passwords do not match' };
        }
        try {
            const result = await sdk.signUp(username, password);
            if (result.success) {
                setIsLoggedIn(true);
                // Explicit cast to access required properties
                const extResult = result;
                const publicKey = extResult.userPub || extResult.publicKey || '';
                setUserPub(publicKey);
                setUsername(username);
                setWallet(extResult.wallet || null);
                // Imposta il DID se presente nel risultato
                if (extResult.did) {
                    setDid(extResult.did);
                }
                else if (sdk.did) {
                    try {
                        const userDid = await sdk.did.getCurrentUserDID();
                        if (userDid)
                            setDid(userDid);
                    }
                    catch (error) {
                        console.error("Errore nel recupero del DID:", error);
                    }
                }
                onSignupSuccess === null || onSignupSuccess === void 0 ? void 0 : onSignupSuccess({
                    userPub: publicKey,
                    username,
                    password,
                    wallet: extResult.wallet,
                    did: extResult.did || did,
                    authMethod: 'standard_signup'
                });
                return result;
            }
            onError === null || onError === void 0 ? void 0 : onError(result.error);
            return result;
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || 'Error during registration');
            return { success: false, error: error.message };
        }
    };
    // MetaMask login function
    const loginWithMetaMask = async () => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            // Verifica se il plugin MetaMask è disponibile
            if (!sdk.hasPlugin('metamask') && !sdk.metamask) {
                throw new Error("MetaMask plugin not available");
            }
            // Check if MetaMask is available in browser
            const ethereum = window.ethereum;
            if (!ethereum) {
                throw new Error("MetaMask is not installed. Install the MetaMask extension to continue.");
            }
            // Request access to accounts
            let accounts;
            try {
                accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            }
            catch (error) {
                console.error('Error requesting accounts:', error);
                throw new Error("Unable to get MetaMask accounts");
            }
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in MetaMask');
            }
            const address = accounts[0];
            console.log('MetaMask address:', address);
            // Login using SDK
            const result = await sdk.loginWithMetaMask(address);
            if (result.success) {
                // Get main wallet from SDK
                const mainWallet = sdk.getMainWallet();
                setIsLoggedIn(true);
                setUserPub(result.userPub || "");
                setWallet(mainWallet);
                // Recupera il DID dell'utente
                if (result.did) {
                    setDid(result.did);
                }
                else if (sdk.did) {
                    try {
                        const userDid = await sdk.did.getCurrentUserDID();
                        if (userDid)
                            setDid(userDid);
                    }
                    catch (error) {
                        console.error("Errore nel recupero del DID:", error);
                    }
                }
                onLoginSuccess === null || onLoginSuccess === void 0 ? void 0 : onLoginSuccess({
                    userPub: result.userPub || "",
                    username: address,
                    wallet: mainWallet,
                    did: result.did || did,
                    authMethod: "metamask_direct"
                });
                return result;
            }
            else {
                throw new Error(result.error || "MetaMask login failed");
            }
        }
        catch (error) {
            console.error('Complete MetaMask error:', error);
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Error during MetaMask login");
            throw error;
        }
    };
    // MetaMask registration function
    const signUpWithMetaMask = async () => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            // Verifica se il plugin MetaMask è disponibile
            if (!sdk.hasPlugin('metamask') && !sdk.metamask) {
                throw new Error("MetaMask plugin not available");
            }
            // Check if MetaMask is available in browser
            const ethereum = window.ethereum;
            if (!ethereum) {
                throw new Error("MetaMask is not installed. Install the MetaMask extension to continue.");
            }
            // Request access to accounts
            let accounts;
            try {
                accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            }
            catch (error) {
                console.error('Error requesting accounts:', error);
                throw new Error("Unable to get MetaMask accounts");
            }
            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts found in MetaMask');
            }
            const address = accounts[0];
            console.log('MetaMask address for signup:', address);
            // Registration using SDK
            const result = await sdk.signUpWithMetaMask(address);
            if (result.success) {
                // Get main wallet from SDK
                const mainWallet = sdk.getMainWallet();
                setIsLoggedIn(true);
                setUserPub(result.userPub || "");
                setWallet(mainWallet);
                // Imposta il DID se presente nel risultato
                if (result.did) {
                    setDid(result.did);
                }
                else if (sdk.did) {
                    try {
                        const userDid = await sdk.did.getCurrentUserDID();
                        if (userDid)
                            setDid(userDid);
                    }
                    catch (error) {
                        console.error("Errore nel recupero del DID:", error);
                    }
                }
                onSignupSuccess === null || onSignupSuccess === void 0 ? void 0 : onSignupSuccess({
                    userPub: result.userPub || "",
                    username: address,
                    wallet: mainWallet,
                    did: result.did,
                    authMethod: "metamask_signup"
                });
                return result;
            }
            else {
                throw new Error(result.error || "MetaMask signup failed");
            }
        }
        catch (error) {
            console.error('Complete MetaMask error:', error);
            onError === null || onError === void 0 ? void 0 : onError(error.message);
            throw error;
        }
    };
    // WebAuthn login
    const loginWithWebAuthn = async (username) => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            // Verifica se il plugin WebAuthn è disponibile
            if (!sdk.hasPlugin('webauthn') && !sdk.webauthn) {
                throw new Error("WebAuthn plugin not available");
            }
            if (!sdk.isWebAuthnSupported()) {
                throw new Error("WebAuthn is not supported in this browser");
            }
            const result = await sdk.loginWithWebAuthn(username);
            if (result.success) {
                const mainWallet = sdk.getMainWallet();
                setIsLoggedIn(true);
                setUserPub(result.userPub || "");
                setUsername(username);
                setWallet(mainWallet);
                // Recupera il DID dell'utente
                if (result.did) {
                    setDid(result.did);
                }
                else if (sdk.did) {
                    try {
                        const userDid = await sdk.did.getCurrentUserDID();
                        if (userDid)
                            setDid(userDid);
                    }
                    catch (error) {
                        console.error("Errore nel recupero del DID:", error);
                    }
                }
                onLoginSuccess === null || onLoginSuccess === void 0 ? void 0 : onLoginSuccess({
                    userPub: result.userPub || "",
                    username,
                    wallet: mainWallet,
                    did: result.did || did,
                    authMethod: "webauthn"
                });
                return result;
            }
            else {
                throw new Error(result.error || "WebAuthn login failed");
            }
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Error during WebAuthn login");
            throw error;
        }
    };
    // WebAuthn registration
    const signUpWithWebAuthn = async (username) => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            // Verifica se il plugin WebAuthn è disponibile
            if (!sdk.hasPlugin('webauthn') && !sdk.webauthn) {
                throw new Error("WebAuthn plugin not available");
            }
            if (!sdk.isWebAuthnSupported()) {
                throw new Error("WebAuthn is not supported in this browser");
            }
            const result = await sdk.signUpWithWebAuthn(username);
            if (result.success) {
                const mainWallet = sdk.getMainWallet();
                setIsLoggedIn(true);
                setUserPub(result.userPub || "");
                setUsername(username);
                setWallet(mainWallet);
                // Imposta il DID se presente nel risultato
                if (result.did) {
                    setDid(result.did);
                }
                else if (sdk.did) {
                    try {
                        const userDid = await sdk.did.getCurrentUserDID();
                        if (userDid)
                            setDid(userDid);
                    }
                    catch (error) {
                        console.error("Errore nel recupero del DID:", error);
                    }
                }
                onSignupSuccess === null || onSignupSuccess === void 0 ? void 0 : onSignupSuccess({
                    userPub: result.userPub || "",
                    username,
                    wallet: mainWallet,
                    did: result.did,
                    authMethod: "webauthn"
                });
                return result;
            }
            else {
                throw new Error(result.error || "WebAuthn registration failed");
            }
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Error during WebAuthn registration");
            throw error;
        }
    };
    // Logout
    const logout = () => {
        sdk.logout();
        setIsLoggedIn(false);
        setUserPub(null);
        setUsername(null);
        setWallet(null);
        setDid(null);
    };
    // Implementazione del metodo setProvider
    const setProvider = (provider) => {
        try {
            if (!sdk) {
                throw new Error("SDK not initialized");
            }
            // Verifico se posso creare un nuovo provider
            let providerUrl = null;
            // Se è un provider ethers, estraggo l'URL
            if (provider && provider.connection && provider.connection.url) {
                providerUrl = provider.connection.url;
            }
            // Se è una stringa, la utilizzo direttamente come URL
            else if (typeof provider === 'string') {
                providerUrl = provider;
            }
            if (providerUrl) {
                // Tentiamo di usare il metodo setRpcUrl se disponibile
                if (typeof sdk.setRpcUrl === 'function') {
                    const result = sdk.setRpcUrl(providerUrl);
                    console.log(`Provider configurato: ${providerUrl}, risultato: ${result}`);
                    return result;
                }
                // Altrimenti memorizzo solo l'URL del provider per uso futuro
                console.log(`Provider URL salvato: ${providerUrl}, ma non applicato (metodo non disponibile)`);
                return true;
            }
            return false;
        }
        catch (error) {
            onError === null || onError === void 0 ? void 0 : onError(error.message || "Errore nell'impostazione del provider");
            return false;
        }
    };
    // Implementazione metodo hasPlugin
    const hasPlugin = (name) => {
        if (!sdk)
            return false;
        return sdk.hasPlugin(name);
    };
    // Implementazione metodo getPlugin
    const getPlugin = (name) => {
        if (!sdk)
            return undefined;
        return sdk.getPlugin(name);
    };
    // Return the context provider
    return (React.createElement(ShogunContext.Provider, { value: {
            sdk,
            options,
            isLoggedIn,
            userPub,
            username,
            wallet,
            did,
            login,
            signUp,
            loginWithMetaMask,
            signUpWithMetaMask,
            loginWithWebAuthn,
            signUpWithWebAuthn,
            logout,
            observe,
            getCurrentDID,
            resolveDID,
            authenticateWithDID,
            registerDIDOnChain,
            setProvider,
            hasPlugin,
            getPlugin,
        } }, children));
}
// Component for Shogun login button
export const ShogunButton = (() => {
    const Button = () => {
        const { isLoggedIn, username, did, logout, login, signUp, loginWithMetaMask, signUpWithMetaMask, loginWithWebAuthn, signUpWithWebAuthn, registerDIDOnChain, sdk, options } = useShogun();
        // Form states
        const [showModal, setShowModal] = useState(false);
        const [formUsername, setFormUsername] = useState('');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [formMode, setFormMode] = useState('login');
        const [error, setError] = useState('');
        const [loading, setLoading] = useState(false);
        const [showDid, setShowDid] = useState(false);
        const handleRegisterDID = async () => {
            if (!did)
                return;
            setLoading(true);
            setError('');
            try {
                const result = await registerDIDOnChain(did);
                if (result.success) {
                    alert(`DID registrato con successo! TX: ${result.txHash}`);
                }
                else {
                    setError(result.error || 'Errore nella registrazione del DID');
                }
            }
            catch (err) {
                setError(err.message || 'Errore nella registrazione del DID');
            }
            finally {
                setLoading(false);
            }
        };
        // If already logged in, show only logout button
        if (isLoggedIn && username) {
            return (React.createElement("div", { className: "shogun-logged-in-container" },
                React.createElement("button", { onClick: () => setShowDid(!showDid), className: "shogun-button shogun-logged-in" },
                    username.substring(0, 6),
                    "...",
                    username.substring(username.length - 4)),
                showDid && did && (React.createElement("div", { className: "shogun-did-container" },
                    React.createElement("p", { className: "shogun-did-text" }, did),
                    React.createElement("button", { onClick: handleRegisterDID, className: "shogun-register-did-button", disabled: loading }, loading ? 'Registrazione...' : 'Registra DID on-chain'),
                    error && React.createElement("p", { className: "shogun-error-message" }, error))),
                React.createElement("button", { onClick: logout, className: "shogun-logout-button" }, "Logout")));
        }
        // Event handlers
        const handleStandardAuth = async (e) => {
            e.preventDefault();
            setError('');
            setLoading(true);
            try {
                if (formMode === 'login') {
                    const result = await login(formUsername, password);
                    if (!result.success) {
                        throw new Error(result.error || "Authentication failed");
                    }
                }
                else {
                    if (password !== confirmPassword) {
                        throw new Error("Passwords do not match");
                    }
                    const result = await signUp(formUsername, password, confirmPassword);
                    if (!result.success) {
                        throw new Error(result.error || "Registration failed");
                    }
                }
                // Close modal after success
                setShowModal(false);
                resetForm();
            }
            catch (err) {
                setError(err.message || "An error occurred");
            }
            finally {
                setLoading(false);
            }
        };
        const handleMetaMaskAuth = async () => {
            setError('');
            setLoading(true);
            try {
                const result = formMode === 'login'
                    ? await loginWithMetaMask()
                    : await signUpWithMetaMask();
                if (!result.success) {
                    throw new Error(result.error || "MetaMask authentication failed");
                }
                // Close modal after success
                setShowModal(false);
                resetForm();
            }
            catch (err) {
                setError(err.message || "An error occurred with MetaMask");
            }
            finally {
                setLoading(false);
            }
        };
        const handleWebAuthnAuth = async () => {
            if (!(sdk === null || sdk === void 0 ? void 0 : sdk.isWebAuthnSupported())) {
                setError('WebAuthn is not supported in your browser');
                return;
            }
            if (!formUsername) {
                setError('Username required for WebAuthn');
                return;
            }
            setError('');
            setLoading(true);
            try {
                const result = formMode === 'login'
                    ? await loginWithWebAuthn(formUsername)
                    : await signUpWithWebAuthn(formUsername);
                if (!result.success) {
                    throw new Error(result.error || "WebAuthn authentication failed");
                }
                // Close modal after success
                setShowModal(false);
                resetForm();
            }
            catch (err) {
                setError(err.message || "An error occurred with WebAuthn");
            }
            finally {
                setLoading(false);
            }
        };
        const resetForm = () => {
            setFormUsername('');
            setPassword('');
            setConfirmPassword('');
            setError('');
            setLoading(false);
        };
        const toggleFormMode = () => {
            setFormMode(prevMode => prevMode === 'login' ? 'signup' : 'login');
            resetForm();
        };
        // This is the modal that will open when clicking the button
        const renderModal = () => {
            if (!showModal)
                return null;
            return (React.createElement("div", { className: "shogun-modal-overlay" },
                React.createElement("div", { className: "shogun-modal" },
                    React.createElement("div", { className: "shogun-modal-header" },
                        React.createElement("h2", null,
                            formMode === 'login' ? 'Sign in' : 'Sign up',
                            " with Shogun"),
                        React.createElement("button", { className: "shogun-close-button", onClick: () => setShowModal(false) }, "\u00D7")),
                    React.createElement("div", { className: "shogun-modal-content" },
                        error && React.createElement("div", { className: "shogun-error-message" }, error),
                        React.createElement("form", { onSubmit: handleStandardAuth },
                            React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "username" }, "Username"),
                                React.createElement("input", { type: "text", id: "username", value: formUsername, onChange: (e) => setFormUsername(e.target.value), disabled: loading, required: true })),
                            React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "password" }, "Password"),
                                React.createElement("input", { type: "password", id: "password", value: password, onChange: (e) => setPassword(e.target.value), disabled: loading, required: true })),
                            formMode === 'signup' && (React.createElement("div", { className: "shogun-form-group" },
                                React.createElement("label", { htmlFor: "confirmPassword" }, "Confirm Password"),
                                React.createElement("input", { type: "password", id: "confirmPassword", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), disabled: loading, required: true }))),
                            React.createElement("button", { type: "submit", className: "shogun-submit-button", disabled: loading }, loading ? 'Loading...' : formMode === 'login' ? 'Sign in' : 'Sign up')),
                        React.createElement("div", { className: "shogun-divider" }, "or"),
                        options.showMetamask && (React.createElement("button", { className: "shogun-metamask-button", onClick: handleMetaMaskAuth, disabled: loading },
                            formMode === 'login' ? 'Sign in' : 'Sign up',
                            " with Web3")),
                        options.showWebauthn && (React.createElement("button", { className: "shogun-webauthn-button", onClick: handleWebAuthnAuth, disabled: loading },
                            formMode === 'login' ? 'Sign in' : 'Sign up',
                            " with WebAuthn")),
                        React.createElement("div", { className: "shogun-form-footer" },
                            React.createElement("p", null,
                                formMode === 'login' ? "Don't have an account?" : "Already have an account?",
                                React.createElement("button", { type: "button", className: "shogun-toggle-mode", onClick: toggleFormMode, disabled: loading }, formMode === 'login' ? 'Sign up' : 'Sign in')))))));
        };
        // Main button that opens the modal
        return (React.createElement(React.Fragment, null,
            React.createElement("button", { onClick: () => setShowModal(true), className: "shogun-button" }, "Access with Shogun"),
            renderModal()));
    };
    // Add Custom property to Button component
    Button.Custom = ({ children, onClick }) => {
        const { isLoggedIn, logout } = useShogun();
        const handleClick = () => {
            if (isLoggedIn) {
                logout();
            }
            onClick === null || onClick === void 0 ? void 0 : onClick();
        };
        return (React.createElement("div", { onClick: handleClick, className: "shogun-button-custom" }, children));
    };
    return Button;
})();

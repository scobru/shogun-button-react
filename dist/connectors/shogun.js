import { ShogunCore } from "shogun-core";
/**
 * Creates a Shogun connector for authentication
 */
function shogunConnector({ appName, appDescription, appUrl, appIcon, showMetamask = true, showWebauthn = true, showNostr = true, showOauth = true, darkMode = true, websocketSecure = false, providerUrl = null, peers = [""], logging, timeouts, authToken, oauth, gunInstance }) {
    // Configurazione dell'SDK Shogun
    const config = {
        // GunDB configuration
        gundb: {
            peers: peers,
            websocket: websocketSecure,
            localStorage: false,
            radisk: false,
            multicast: false,
            axe: false,
            authToken: authToken
        },
        // Provider Ethereum per operazioni blockchain
        providerUrl: providerUrl,
        // Configurazione di MetaMask
        metamask: {
            enabled: showMetamask
        },
        web3: {
            enabled: showMetamask
        },
        // Configurazione di WebAuthn
        webauthn: {
            enabled: showWebauthn,
            rpName: appName || "Shogun App",
            rpId: typeof window !== 'undefined' ? window.location.hostname : ''
        },
        nostr: {
            enabled: showNostr
        },
        oauth: {
            enabled: showOauth,
            providers: oauth === null || oauth === void 0 ? void 0 : oauth.providers
        },
        // Logging configuration
        logging: logging || {
            enabled: true,
            level: "warning"
        },
        // Timeouts configuration
        timeouts: timeouts || {
            login: 15000,
            signup: 20000,
            operation: 30000
        },
        // Plugin configuration
        plugins: {
            autoRegister: [] // Array vuoto di ShogunPlugin per la registrazione automatica
        },
        gunInstance: gunInstance
    };
    // Inizializza l'SDK Shogun
    const sdk = new ShogunCore(config);
    // Memorizziamo l'URL del provider corrente
    let currentProviderUrl = providerUrl;
    return {
        sdk,
        options: {
            appName,
            appDescription,
            appUrl,
            appIcon,
            showMetamask,
            showWebauthn,
            showNostr,
            showOauth,
            darkMode,
            websocketSecure,
            providerUrl,
            peers,
            logging,
            timeouts,
            authToken,
            oauth,
            gunInstance
        },
        // Metodi helper per funzionalità comuni
        setProvider: (provider) => {
            // Metodo di compatibilità per i cambiamenti in shogun-core
            // Questo metodo è utilizzato quando l'app cambia il provider RPC
            try {
                let newProviderUrl = null;
                // Se è un provider ethers, estraiamo l'URL
                if (provider && provider.connection && provider.connection.url) {
                    newProviderUrl = provider.connection.url;
                }
                // Se è una stringa, utilizziamola direttamente come URL
                else if (typeof provider === 'string') {
                    newProviderUrl = provider;
                }
                if (newProviderUrl) {
                    // Memorizziamo il nuovo URL del provider
                    currentProviderUrl = newProviderUrl;
                    // Utilizziamo il metodo setRpcUrl di ShogunCore
                    if (typeof sdk.setRpcUrl === 'function') {
                        const result = sdk.setRpcUrl(newProviderUrl);
                        console.log(`Provider RPC aggiornato: ${newProviderUrl}, risultato: ${result}`);
                        return result;
                    }
                    else {
                        // Fallback nel caso in cui il metodo non sia disponibile
                        console.log(`Provider URL salvato: ${newProviderUrl}, ma non applicato (metodo setRpcUrl non disponibile)`);
                    }
                    return true;
                }
                return false;
            }
            catch (error) {
                console.error("Errore nell'impostazione del provider:", error);
                return false;
            }
        },
        // Metodo per ottenere l'URL del provider corrente
        getCurrentProviderUrl: () => {
            // Prima proviamo ad utilizzare il metodo di ShogunCore
            if (typeof sdk.getRpcUrl === 'function') {
                const url = sdk.getRpcUrl();
                if (url)
                    return url;
            }
            // Fallback alla variabile locale
            return currentProviderUrl;
        },
        // Aggiunti metodi per gestire i plugin
        registerPlugin: (plugin) => {
            try {
                if (typeof sdk.register === 'function') {
                    sdk.register(plugin);
                    return true;
                }
                return false;
            }
            catch (error) {
                console.error("Errore nella registrazione del plugin:", error);
                return false;
            }
        },
        hasPlugin: (name) => {
            try {
                if (typeof sdk.hasPlugin === 'function') {
                    return sdk.hasPlugin(name);
                }
                // Fallback per compatibilità con versioni precedenti
                return false;
            }
            catch (error) {
                console.error("Errore nella verifica del plugin:", error);
                return false;
            }
        }
    };
}
export { shogunConnector };

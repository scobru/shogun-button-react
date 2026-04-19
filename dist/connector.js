import { ShogunCore } from "shogun-core";
export async function shogunConnector(options) {
    const { zenInstance, appName, timeouts, webauthn, nostr, web3, challenge, showWebauthn, showNostr, showMetamask, showChallenge, darkMode, enableGunDebug = true, enableConnectionMonitoring = true, defaultPageSize = 20, connectionTimeout = 10000, debounceInterval = 100, crypto, ...restOptions } = options;
    let core = null;
    let zen = null;
    zen = zenInstance;
    // Create ShogunCore with zenInstance
    core = new ShogunCore({
        zenInstance: zen,
        webauthn: (webauthn === null || webauthn === void 0 ? void 0 : webauthn.enabled) ? {
            enabled: true,
            rpName: appName || "Shogun App",
            rpId: typeof window !== "undefined" ? window.location.hostname : "localhost",
        } : undefined,
        web3: (web3 === null || web3 === void 0 ? void 0 : web3.enabled) ? { enabled: true } : undefined,
        nostr: (nostr === null || nostr === void 0 ? void 0 : nostr.enabled) ? { enabled: true } : undefined,
        challenge: (challenge === null || challenge === void 0 ? void 0 : challenge.enabled) ? { enabled: true } : undefined,
        timeouts,
        silent: false, // Enable console logs for debugging
    });
    // Note: ShogunCore initializes automatically in constructor
    // No need to call initialize() separately
    console.log(`[DEBUG] ShogunConnector: ShogunCore initialized with zenInstance`);
    const setProvider = (provider) => {
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
    };
    const getCurrentProviderUrl = () => {
        var _a;
        const zen = ((_a = core === null || core === void 0 ? void 0 : core.db) === null || _a === void 0 ? void 0 : _a.zen) || (core === null || core === void 0 ? void 0 : core.zen);
        try {
            const peersObj = zen && zen.back ? zen.back("opt.peers") : undefined;
            const urls = peersObj && typeof peersObj === "object" ? Object.keys(peersObj) : [];
            return urls.length > 0 ? urls[0] : null;
        }
        catch {
            return null;
        }
    };
    const registerPlugin = (plugin) => {
        if (core && typeof core.register === "function") {
            try {
                core.register(plugin);
                return true;
            }
            catch (error) {
                console.error(`Error registering plugin: ${plugin.name}`, error);
                return false;
            }
        }
        return false;
    };
    const hasPlugin = (name) => {
        return core ? core.hasPlugin(name) : false;
    };
    // Plugin registration removed - GunAdvancedPlugin no longer available
    return {
        core,
        options,
        setProvider,
        getCurrentProviderUrl,
        registerPlugin,
        hasPlugin,
        zenPlugin: null,
    };
}

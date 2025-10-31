import { ShogunCore } from "shogun-core";
export async function shogunConnector(options) {
    const { gunInstance, appName, timeouts, webauthn, nostr, web3, zkproof, showWebauthn, showNostr, showMetamask, showZkProof, darkMode, enableGunDebug = true, enableConnectionMonitoring = true, defaultPageSize = 20, connectionTimeout = 10000, debounceInterval = 100, crypto, ...restOptions } = options;
    let core = null;
    let gun = null;
    gun = gunInstance;
    // Create ShogunCore with gunInstance (required in v2.0.0)
    core = new ShogunCore({
        gunInstance: gun,
        webauthn: (webauthn === null || webauthn === void 0 ? void 0 : webauthn.enabled) ? {
            enabled: true,
            rpName: appName || "Shogun App",
            rpId: typeof window !== "undefined" ? window.location.hostname : "localhost",
        } : undefined,
        web3: (web3 === null || web3 === void 0 ? void 0 : web3.enabled) ? { enabled: true } : undefined,
        nostr: (nostr === null || nostr === void 0 ? void 0 : nostr.enabled) ? { enabled: true } : undefined,
        zkproof: (zkproof === null || zkproof === void 0 ? void 0 : zkproof.enabled) ? {
            enabled: true,
            defaultGroupId: zkproof.defaultGroupId || "shogun-users",
        } : undefined,
        timeouts,
        silent: false, // Enable console logs for debugging
    });
    // Note: ShogunCore v2.0.0 initializes automatically in constructor
    // No need to call initialize() separately
    console.log(`[DEBUG] ShogunConnector: ShogunCore initialized with gunInstance`);
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
                const gun = ((_a = core === null || core === void 0 ? void 0 : core.db) === null || _a === void 0 ? void 0 : _a.gun) || (core === null || core === void 0 ? void 0 : core.gun);
                if (gun && typeof gun.opt === "function") {
                    try {
                        gun.opt({ peers: [newProviderUrl] });
                        return true;
                    }
                    catch (e) {
                        console.error("Error adding peer via gun.opt:", e);
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
        const gun = ((_a = core === null || core === void 0 ? void 0 : core.db) === null || _a === void 0 ? void 0 : _a.gun) || (core === null || core === void 0 ? void 0 : core.gun);
        try {
            const peersObj = gun && gun.back ? gun.back("opt.peers") : undefined;
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
        gunPlugin: null,
    };
}

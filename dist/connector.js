import { ShogunCore } from "shogun-core";
export function shogunConnector(options) {
    const { gunInstance, gunOptions, appName, timeouts, webauthn, nostr, web3, zkproof, showWebauthn, showNostr, showMetamask, showZkProof, darkMode, enableGunDebug = true, enableConnectionMonitoring = true, defaultPageSize = 20, connectionTimeout = 10000, debounceInterval = 100, ...restOptions } = options;
    const core = new ShogunCore({
        gunOptions: gunOptions || undefined,
        gunInstance: gunInstance || undefined,
        webauthn,
        nostr,
        web3,
        zkproof,
        timeouts,
    });
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
            const peersObj = gun && gun.back ? gun.back('opt.peers') : undefined;
            const urls = peersObj && typeof peersObj === 'object' ? Object.keys(peersObj) : [];
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

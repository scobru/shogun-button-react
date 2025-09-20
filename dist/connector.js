import { ShogunCore } from "shogun-core";
import { GunAdvancedPlugin } from "./plugins/GunAdvancedPlugin";
export function shogunConnector(options) {
    const { peers = ["https://gun-manhattan.herokuapp.com/gun"], appName, timeouts, oauth, webauthn, nostr, web3, localStorage, radisk, showOauth, showWebauthn, showNostr, showMetamask, darkMode, authToken, enableGunDebug = true, enableConnectionMonitoring = true, defaultPageSize = 20, connectionTimeout = 10000, debounceInterval = 100, ...restOptions } = options;
    const core = new ShogunCore({
        gunOptions: {
            peers,
            scope: appName,
            authToken,
            localStorage,
            radisk,
        },
        oauth,
        webauthn,
        nostr,
        web3,
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
    // Registra automaticamente il plugin Gun avanzato
    let gunPlugin = null;
    if (core) {
        gunPlugin = new GunAdvancedPlugin(core, {
            enableDebug: enableGunDebug,
            enableConnectionMonitoring,
            defaultPageSize,
            connectionTimeout,
            debounceInterval,
        });
        registerPlugin(gunPlugin);
    }
    // Ensure gunPlugin is always available
    if (!gunPlugin) {
        throw new Error("Failed to initialize GunAdvancedPlugin");
    }
    return {
        core,
        options,
        setProvider,
        getCurrentProviderUrl,
        registerPlugin,
        hasPlugin,
        gunPlugin,
    };
}

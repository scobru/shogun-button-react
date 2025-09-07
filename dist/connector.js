import { ShogunCore } from "shogun-core";
import { GunAdvancedPlugin } from "./plugins/GunAdvancedPlugin";
export function shogunConnector(options) {
    const { peers = ["https://gun-manhattan.herokuapp.com/gun"], appName, logging, timeouts, oauth, enableGunDebug = true, enableConnectionMonitoring = true, defaultPageSize = 20, connectionTimeout = 10000, debounceInterval = 100, ...restOptions } = options;
    const core = new ShogunCore({
        peers,
        scope: appName,
        logging,
        timeouts,
        oauth,
    });
    const setProvider = (provider) => {
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
                if (typeof core.setRpcUrl === "function") {
                    return core.setRpcUrl(newProviderUrl);
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
        if (core && typeof core.getRpcUrl === "function") {
            return core.getRpcUrl();
        }
        return null;
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

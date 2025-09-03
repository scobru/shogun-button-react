import { ShogunCore } from "shogun-core";
import { GunAdvancedPlugin } from "./plugins/GunAdvancedPlugin";
export function shogunConnector(options) {
    const { peers = ["https://gun-manhattan.herokuapp.com/gun"], appName, logging, timeouts, oauth, 
    // Nuove opzioni per il plugin
    enableGunDebug = true, enableConnectionMonitoring = true, defaultPageSize = 20, connectionTimeout = 10000, debounceInterval = 100, ...restOptions } = options;
    const sdk = new ShogunCore({
        peers,
        scope: appName,
        logging,
        timeouts,
        oauth,
    });
    const registerPlugin = (plugin) => {
        if (sdk && typeof sdk.register === "function") {
            try {
                sdk.register(plugin);
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
        return sdk ? sdk.hasPlugin(name) : false;
    };
    // Registra automaticamente il plugin Gun avanzato
    let gunPlugin = null;
    if (sdk) {
        gunPlugin = new GunAdvancedPlugin(sdk, {
            enableDebug: enableGunDebug,
            enableConnectionMonitoring,
            defaultPageSize,
            connectionTimeout,
            debounceInterval,
        });
        registerPlugin(gunPlugin);
    }
    return {
        sdk,
        options,
        registerPlugin,
        hasPlugin,
        gunPlugin, // Esporta il plugin per uso esterno
    };
}

import { ShogunCore } from "shogun-core";
export function shogunConnector(options) {
    const { peers = ["https://gun-manhattan.herokuapp.com/gun"], appName, logging, timeouts, oauth, ...restOptions } = options;
    const sdk = new ShogunCore({
        peers,
        scope: appName,
        logging,
        timeouts,
        oauth,
    });
    const setProvider = (provider) => {
        if (!sdk) {
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
                if (typeof sdk.setRpcUrl === "function") {
                    return sdk.setRpcUrl(newProviderUrl);
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
        if (sdk && typeof sdk.getRpcUrl === "function") {
            return sdk.getRpcUrl();
        }
        return null;
    };
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
    return {
        sdk,
        options,
        setProvider,
        getCurrentProviderUrl,
        registerPlugin,
        hasPlugin,
    };
}

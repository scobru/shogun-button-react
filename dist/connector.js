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
        registerPlugin,
        hasPlugin,
    };
}

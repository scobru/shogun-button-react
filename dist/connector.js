"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shogunConnector = shogunConnector;
const shogun_core_1 = require("shogun-core");
function shogunConnector(options) {
    const { peers = ["https://relay.shogun-eco.xyz/gun"], appName, timeouts, oauth, showMetamask, showWebauthn, showNostr, showOauth, localStorage, radisk, ...restOptions } = options;
    // Build ShogunCore configuration with authentication plugins
    const shogunConfig = {
        peers,
        scope: appName,
        timeouts,
        localStorage,
        radisk,
    };
    // Configure Web3/MetaMask plugin
    if (showMetamask) {
        shogunConfig.web3 = { enabled: true };
        console.log("✅ Web3 plugin configured");
    }
    // Configure WebAuthn plugin
    if (showWebauthn) {
        shogunConfig.webauthn = {
            enabled: true,
            rpName: appName || "Shogun App",
            rpId: typeof window !== "undefined" ? window.location.hostname : "localhost",
        };
        console.log("✅ WebAuthn plugin configured");
    }
    // Configure Nostr plugin
    if (showNostr) {
        shogunConfig.nostr = { enabled: true };
        console.log("✅ Nostr plugin configured");
    }
    // Configure OAuth plugin
    if (showOauth && oauth) {
        shogunConfig.oauth = {
            enabled: true,
            usePKCE: true, // Mandatory for security
            allowUnsafeClientSecret: true, // Required for Google OAuth
            ...oauth,
        };
        console.log("✅ OAuth plugin configured");
    }
    console.log("🔧 Creating ShogunCore with config:", {
        showMetamask,
        showWebauthn,
        showNostr,
        showOauth,
    });
    const core = new shogun_core_1.ShogunCore(shogunConfig);
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
    return {
        core,
        options,
        registerPlugin,
        hasPlugin,
    };
}

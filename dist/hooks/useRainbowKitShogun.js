import { useConnectModal, useAccountModal, useChainModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useShogun } from '../components/ShogunButton';
/**
 * Hook personalizzato per integrare RainbowKit con Shogun
 * Questo hook gestisce la connessione wallet tramite RainbowKit
 * e l'autenticazione tramite Shogun utilizzando il ShogunButton esistente
 */
export const useRainbowKitShogun = () => {
    const { openConnectModal } = useConnectModal();
    const { openAccountModal } = useAccountModal();
    const { openChainModal } = useChainModal();
    const { address, isConnected } = useAccount();
    const { login, signUp, core, isLoggedIn } = useShogun();
    /**
     * Connette il wallet tramite RainbowKit e autentica con Shogun
     */
    const connectAndLogin = async () => {
        try {
            // Se non c'è connessione, apri il modal di RainbowKit
            if (!isConnected) {
                openConnectModal === null || openConnectModal === void 0 ? void 0 : openConnectModal();
                return { success: false, needsConnection: true };
            }
            // Se c'è già una connessione, procedi con l'autenticazione Shogun
            if (address) {
                const result = await login("web3", address);
                return result;
            }
            throw new Error("No address available");
        }
        catch (error) {
            console.error("RainbowKit Shogun connection failed:", error);
            return {
                success: false,
                error: error.message || "Connection failed"
            };
        }
    };
    /**
     * Registra un nuovo utente tramite RainbowKit e Shogun
     */
    const connectAndSignUp = async () => {
        try {
            // Se non c'è connessione, apri il modal di RainbowKit
            if (!isConnected) {
                openConnectModal === null || openConnectModal === void 0 ? void 0 : openConnectModal();
                return { success: false, needsConnection: true };
            }
            // Se c'è già una connessione, procedi con la registrazione Shogun
            if (address) {
                const result = await signUp("web3", address);
                return result;
            }
            throw new Error("No address available");
        }
        catch (error) {
            console.error("RainbowKit Shogun signup failed:", error);
            return {
                success: false,
                error: error.message || "Signup failed"
            };
        }
    };
    /**
     * Autentica direttamente con un indirizzo (utile quando l'indirizzo è già noto)
     */
    const loginWithAddress = async (walletAddress) => {
        try {
            if (!walletAddress) {
                throw new Error("Address is required");
            }
            const result = await login("web3", walletAddress);
            return result;
        }
        catch (error) {
            console.error("Login with address failed:", error);
            return {
                success: false,
                error: error.message || "Login failed"
            };
        }
    };
    /**
     * Registra direttamente con un indirizzo (utile quando l'indirizzo è già noto)
     */
    const signUpWithAddress = async (walletAddress) => {
        try {
            if (!walletAddress) {
                throw new Error("Address is required");
            }
            const result = await signUp("web3", walletAddress);
            return result;
        }
        catch (error) {
            console.error("Signup with address failed:", error);
            return {
                success: false,
                error: error.message || "Signup failed"
            };
        }
    };
    return {
        // RainbowKit state
        address,
        isConnected,
        openConnectModal,
        openAccountModal,
        openChainModal,
        // Shogun state
        isLoggedIn,
        // Actions
        connectAndLogin,
        connectAndSignUp,
        loginWithAddress,
        signUpWithAddress,
        // Utilities
        isReady: !!core && !!openConnectModal,
    };
};

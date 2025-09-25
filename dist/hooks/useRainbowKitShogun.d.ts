/**
 * Hook personalizzato per integrare RainbowKit con Shogun
 * Questo hook gestisce la connessione wallet tramite RainbowKit
 * e l'autenticazione tramite Shogun utilizzando il ShogunButton esistente
 */
export declare const useRainbowKitShogun: () => {
    address: any;
    isConnected: any;
    openConnectModal: any;
    openAccountModal: any;
    openChainModal: any;
    isLoggedIn: boolean;
    connectAndLogin: () => Promise<any>;
    connectAndSignUp: () => Promise<any>;
    loginWithAddress: (walletAddress: string) => Promise<any>;
    signUpWithAddress: (walletAddress: string) => Promise<any>;
    isReady: boolean;
};

import React from 'react';
import { ShogunButton, ShogunButtonProvider } from './ShogunButton';
import { useRainbowKitShogun } from '../hooks/useRainbowKitShogun';
/**
 * Componente wrapper che integra RainbowKit con ShogunButton
 * Quando RainbowKit è disponibile, il pulsante MetaMask utilizzerà RainbowKit
 * invece della connessione diretta a MetaMask
 */
export const ShogunButtonWithRainbowKit = ({ core, options, onLoginSuccess, onSignupSuccess, onError, }) => {
    const rainbowKit = useRainbowKitShogun();
    // Merge RainbowKit integration with options
    const enhancedOptions = {
        ...options,
        rainbowKitIntegration: rainbowKit.isReady ? {
            openConnectModal: rainbowKit.openConnectModal,
            openAccountModal: rainbowKit.openAccountModal,
            openChainModal: rainbowKit.openChainModal,
            isConnected: rainbowKit.isConnected,
            address: rainbowKit.address,
        } : undefined,
    };
    return (React.createElement(ShogunButtonProvider, { core: core, options: enhancedOptions, onLoginSuccess: onLoginSuccess, onSignupSuccess: onSignupSuccess, onError: onError },
        React.createElement(ShogunButton, null)));
};

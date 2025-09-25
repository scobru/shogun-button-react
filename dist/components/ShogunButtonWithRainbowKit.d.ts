import React from 'react';
import { ShogunConnectorOptions } from '../interfaces/connector-options';
interface ShogunButtonWithRainbowKitProps {
    core: any;
    options: ShogunConnectorOptions;
    onLoginSuccess?: (data: any) => void;
    onSignupSuccess?: (data: any) => void;
    onError?: (error: string) => void;
}
/**
 * Componente wrapper che integra RainbowKit con ShogunButton
 * Quando RainbowKit è disponibile, il pulsante MetaMask utilizzerà RainbowKit
 * invece della connessione diretta a MetaMask
 */
export declare const ShogunButtonWithRainbowKit: React.FC<ShogunButtonWithRainbowKitProps>;
export {};

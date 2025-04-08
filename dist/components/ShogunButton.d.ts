import React from 'react';
import { ethers } from 'ethers';
import { ShogunCore } from 'shogun-core';
import '../types.js';
import '../index.css';
export declare const useShogun: () => any;
type ShogunButtonProviderProps = {
    children: React.ReactNode;
    sdk: ShogunCore;
    options: {
        appName: string;
        appDescription?: string;
        appUrl?: string;
        appIcon?: string;
        showMetamask?: boolean;
        showWebauthn?: boolean;
        darkMode?: boolean;
    };
    onLoginSuccess?: (data: {
        userPub: string;
        username: string;
        password?: string;
        wallet?: ethers.Wallet;
        did?: string;
        authMethod?: 'standard' | 'metamask_direct' | 'metamask_saved' | 'metamask_signup' | 'standard_signup' | 'webauthn' | 'mnemonic';
    }) => void;
    onSignupSuccess?: (data: {
        userPub: string;
        username: string;
        password?: string;
        wallet?: ethers.Wallet;
        did?: string;
        authMethod?: 'standard' | 'metamask_direct' | 'metamask_saved' | 'metamask_signup' | 'standard_signup' | 'webauthn' | 'mnemonic';
    }) => void;
    onError?: (error: string) => void;
};
export declare function ShogunButtonProvider({ children, sdk, options, onLoginSuccess, onSignupSuccess, onError, }: ShogunButtonProviderProps): any;
interface CustomButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
}
interface ShogunButtonComponent extends React.FC {
    Custom: React.FC<CustomButtonProps>;
}
export declare const ShogunButton: ShogunButtonComponent;
export {};

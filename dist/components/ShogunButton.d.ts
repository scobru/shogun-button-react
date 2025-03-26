import React from 'react';
import { ethers } from 'ethers';
import { ShogunCore } from 'shogun-core';
import '../types';
import '../styles/index.css';
type ShogunContextType = {
    sdk: ShogunCore | null;
    options: {
        appName: string;
        appDescription?: string;
        appUrl?: string;
        appIcon?: string;
        showMetamask?: boolean;
        showWebauthn?: boolean;
        darkMode?: boolean;
    };
    isLoggedIn: boolean;
    userPub: string | null;
    username: string | null;
    wallet: ethers.Wallet | null;
    did: string | null;
    login: (username: string, password: string) => Promise<any>;
    signUp: (username: string, password: string, confirmPassword: string) => Promise<any>;
    loginWithMetaMask: () => Promise<any>;
    signUpWithMetaMask: () => Promise<any>;
    loginWithWebAuthn: (username: string) => Promise<any>;
    signUpWithWebAuthn: (username: string) => Promise<any>;
    logout: () => void;
    getCurrentDID: () => Promise<string | null>;
    resolveDID: (did: string) => Promise<any>;
    authenticateWithDID: (did: string, challenge?: string) => Promise<any>;
    registerDIDOnChain: (did: string, signer?: ethers.Signer) => Promise<any>;
    setProvider: (provider: any) => boolean;
};
export declare const useShogun: () => ShogunContextType;
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
export declare function ShogunButtonProvider({ children, sdk, options, onLoginSuccess, onSignupSuccess, onError, }: ShogunButtonProviderProps): React.JSX.Element;
interface CustomButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
}
interface ShogunButtonComponent extends React.FC {
    Custom: React.FC<CustomButtonProps>;
}
export declare const ShogunButton: ShogunButtonComponent;
export {};

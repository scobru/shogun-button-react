import React from "react";
import { ShogunCore } from "shogun-core";
import { Observable } from "rxjs";
import "../styles/index.css";
type ShogunContextType = {
    core: ShogunCore | null;
    options: any;
    isLoggedIn: boolean;
    userPub: string | null;
    username: string | null;
    login: (method: string, ...args: any[]) => Promise<any>;
    signUp: (method: string, ...args: any[]) => Promise<any>;
    logout: () => void;
    observe: <T>(path: string) => Observable<T>;
    setProvider: (provider: any) => boolean;
    hasPlugin: (name: string) => boolean;
    getPlugin: <T>(name: string) => T | undefined;
    exportGunPair: (password?: string) => Promise<string>;
    importGunPair: (pairData: string, password?: string) => Promise<boolean>;
    gunPlugin: null;
    put: (path: string, data: any) => Promise<void>;
    get: (path: string) => any;
    remove: (path: string) => Promise<void>;
    completePendingSignup: () => void;
    hasPendingSignup: boolean;
};
export declare const useShogun: () => ShogunContextType;
type ShogunButtonProviderProps = {
    children: React.ReactNode;
    core: ShogunCore;
    options: any;
    onLoginSuccess?: (data: {
        userPub: string;
        username: string;
        password?: string;
        authMethod?: "password" | "web3" | "webauthn" | "nostr" | "zkproof";
    }) => void;
    onSignupSuccess?: (data: {
        userPub: string;
        username: string;
        password?: string;
        seedPhrase?: string;
        authMethod?: "password" | "web3" | "webauthn" | "nostr" | "zkproof";
    }) => void;
    onError?: (error: string) => void;
};
export declare function ShogunButtonProvider({ children, core, options, onLoginSuccess, onSignupSuccess, onError, }: ShogunButtonProviderProps): React.JSX.Element;
type ShogunButtonComponent = React.FC & {
    Provider: typeof ShogunButtonProvider;
    useShogun: typeof useShogun;
};
export declare const ShogunButton: ShogunButtonComponent;
export {};

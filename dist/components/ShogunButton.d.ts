import React from "react";
import { IGunInstance, ShogunCore } from "shogun-core";
import { Observable } from "rxjs";
import "../styles/index.css";
type ShogunContextType = {
    core: ShogunCore | null;
    options: any;
    isLoggedIn: boolean;
    isConnected: boolean;
    userPub: string | null;
    username: string | null;
    login: (method: string, ...args: any[]) => Promise<any>;
    signUp: (method: string, ...args: any[]) => Promise<any>;
    logout: () => void;
    observe: <T>(path: string) => Observable<T>;
    hasPlugin: (name: string) => boolean;
    getPlugin: <T>(name: string) => T | undefined;
    exportGunPair: (password?: string) => Promise<string>;
    importGunPair: (pairData: string, password?: string) => Promise<boolean>;
};
export declare const useShogun: () => ShogunContextType;
type ShogunButtonProviderProps = {
    children: React.ReactNode;
    core: ShogunCore;
    gun: IGunInstance<any>;
    options: any;
    onLoginSuccess?: (data: {
        userPub: string;
        username: string;
        password?: string;
        authMethod?: "password" | "web3" | "webauthn" | "nostr" | "oauth";
    }) => void;
    onSignupSuccess?: (data: {
        userPub: string;
        username: string;
        password?: string;
        authMethod?: "password" | "web3" | "webauthn" | "nostr" | "oauth";
    }) => void;
    onError?: (error: string) => void;
    onLogout?: () => void;
};
export declare function ShogunButtonProvider({ children, core, gun, options, onLoginSuccess, onSignupSuccess, onError, onLogout, }: ShogunButtonProviderProps): React.JSX.Element;
type ShogunButtonComponent = React.FC & {
    Provider: typeof ShogunButtonProvider;
    useShogun: typeof useShogun;
};
export declare const ShogunButton: ShogunButtonComponent;
export {};

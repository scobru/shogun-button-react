import React from "react";
import { ShogunCore } from "shogun-core";
import { Observable } from "rxjs";
import { GunAdvancedPlugin } from "../plugins/GunAdvancedPlugin";
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
    gunPlugin: GunAdvancedPlugin | null;
    useGunState: <T>(path: string, defaultValue?: T) => any;
    useGunCollection: <T>(path: string, options?: any) => any;
    useGunConnection: (path: string) => {
        isConnected: boolean;
        lastSeen: Date | null;
        error: string | null;
    };
    useGunDebug: (path: string, enabled?: boolean) => void;
    useGunRealtime: <T>(path: string, callback?: (data: T, key: string) => void) => {
        data: T | null;
        key: string | null;
    };
    put: (path: string, data: any) => Promise<void>;
    get: (path: string) => any;
    remove: (path: string) => Promise<void>;
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

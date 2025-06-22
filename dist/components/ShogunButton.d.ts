import React from "react";
import { ShogunCore } from "shogun-core";
import { Observable } from "rxjs";
import "../types/index.js";
import "../styles/index.css";
type ShogunContextType = {
    sdk: ShogunCore | null;
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
};
export declare const useShogun: () => ShogunContextType;
type ShogunButtonProviderProps = {
    children: React.ReactNode;
    sdk: ShogunCore;
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
};
export declare function ShogunButtonProvider({ children, sdk, options, onLoginSuccess, onSignupSuccess, onError, }: ShogunButtonProviderProps): React.JSX.Element;
type ShogunButtonComponent = React.FC & {
    Provider: typeof ShogunButtonProvider;
    useShogun: typeof useShogun;
};
export declare const ShogunButton: ShogunButtonComponent;
export {};

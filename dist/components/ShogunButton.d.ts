import React from "react";
import { ShogunCore } from "shogun-core";
import "../styles/index.css";
export declare const useShogun: () => any;
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
    onLogout?: () => void;
};
export declare function ShogunButtonProvider({ children, sdk, options, onLoginSuccess, onSignupSuccess, onError, onLogout, }: ShogunButtonProviderProps): JSX.Element;
type ShogunButtonComponent = React.FC & {
    Provider: typeof ShogunButtonProvider;
    useShogun: typeof useShogun;
};
export declare const ShogunButton: ShogunButtonComponent;
export {};

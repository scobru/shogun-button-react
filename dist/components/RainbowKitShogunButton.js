import React, { useState, useEffect } from 'react';
import { useRainbowKitShogun } from '../hooks/useRainbowKitShogun';
/**
 * Componente che integra RainbowKit con Shogun
 * Gestisce automaticamente la connessione wallet e l'autenticazione
 */
export const RainbowKitShogunButton = ({ connectText = "Connect Wallet", loginText = "Login with Wallet", connectedText = "Connected", mode = 'auto', onSuccess, onError, className = "shogun-connect-button", showAddress = true, }) => {
    const { address, isConnected, isLoggedIn, connectAndLogin, connectAndSignUp, isReady, } = useRainbowKitShogun();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    // Gestisce automaticamente l'autenticazione quando l'indirizzo cambia
    useEffect(() => {
        if (isConnected && address && !isLoggedIn && mode === 'auto') {
            handleAutoAuth();
        }
    }, [isConnected, address, isLoggedIn, mode]);
    const handleAutoAuth = async () => {
        var _a;
        if (!address)
            return;
        setIsLoading(true);
        setError(null);
        try {
            // Prova prima il login, se fallisce prova la registrazione
            let result = await connectAndLogin();
            if (!result.success && ((_a = result.error) === null || _a === void 0 ? void 0 : _a.includes('not found'))) {
                // Se l'utente non esiste, prova la registrazione
                result = await connectAndSignUp();
            }
            if (result.success) {
                onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(result);
            }
            else if (result.error) {
                setError(result.error);
                onError === null || onError === void 0 ? void 0 : onError(result.error);
            }
        }
        catch (err) {
            const errorMsg = err.message || "Authentication failed";
            setError(errorMsg);
            onError === null || onError === void 0 ? void 0 : onError(errorMsg);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleClick = async () => {
        var _a;
        if (!isReady) {
            setError("RainbowKit or Shogun not ready");
            return;
        }
        if (!isConnected) {
            // Apri il modal di connessione RainbowKit
            connectAndLogin();
            return;
        }
        if (isLoggedIn) {
            // Già autenticato, non fare nulla
            return;
        }
        // Connesso ma non autenticato, procedi con l'autenticazione
        setIsLoading(true);
        setError(null);
        try {
            let result;
            if (mode === 'login') {
                result = await connectAndLogin();
            }
            else if (mode === 'signup') {
                result = await connectAndSignUp();
            }
            else {
                // Modalità auto: prova login, se fallisce prova signup
                result = await connectAndLogin();
                if (!result.success && ((_a = result.error) === null || _a === void 0 ? void 0 : _a.includes('not found'))) {
                    result = await connectAndSignUp();
                }
            }
            if (result.success) {
                onSuccess === null || onSuccess === void 0 ? void 0 : onSuccess(result);
            }
            else if (result.error) {
                setError(result.error);
                onError === null || onError === void 0 ? void 0 : onError(result.error);
            }
        }
        catch (err) {
            const errorMsg = err.message || "Authentication failed";
            setError(errorMsg);
            onError === null || onError === void 0 ? void 0 : onError(errorMsg);
        }
        finally {
            setIsLoading(false);
        }
    };
    const getButtonText = () => {
        if (isLoading)
            return "Connecting...";
        if (isLoggedIn)
            return showAddress && address ? `${connectedText} (${address.slice(0, 6)}...${address.slice(-4)})` : connectedText;
        if (isConnected)
            return loginText;
        return connectText;
    };
    const getButtonClass = () => {
        let baseClass = className;
        if (isLoggedIn)
            baseClass += " shogun-connected";
        if (isLoading)
            baseClass += " shogun-loading";
        if (error)
            baseClass += " shogun-error";
        return baseClass;
    };
    if (!isReady) {
        return (React.createElement("button", { className: className, disabled: true }, "RainbowKit not available"));
    }
    return (React.createElement("div", { className: "rainbowkit-shogun-container" },
        React.createElement("button", { className: getButtonClass(), onClick: handleClick, disabled: isLoading }, getButtonText()),
        error && (React.createElement("div", { className: "shogun-error-message", style: { marginTop: '8px' } }, error))));
};

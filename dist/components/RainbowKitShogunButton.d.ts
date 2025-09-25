import React from 'react';
interface RainbowKitShogunButtonProps {
    /**
     * Testo del pulsante quando non connesso
     */
    connectText?: string;
    /**
     * Testo del pulsante quando connesso ma non autenticato
     */
    loginText?: string;
    /**
     * Testo del pulsante quando connesso e autenticato
     */
    connectedText?: string;
    /**
     * Modalità: 'login' per login, 'signup' per registrazione, 'auto' per automatico
     */
    mode?: 'login' | 'signup' | 'auto';
    /**
     * Callback chiamato quando l'autenticazione ha successo
     */
    onSuccess?: (data: any) => void;
    /**
     * Callback chiamato quando si verifica un errore
     */
    onError?: (error: string) => void;
    /**
     * Stile personalizzato per il pulsante
     */
    className?: string;
    /**
     * Se true, mostra l'indirizzo del wallet quando connesso
     */
    showAddress?: boolean;
}
/**
 * Componente che integra RainbowKit con Shogun
 * Gestisce automaticamente la connessione wallet e l'autenticazione
 */
export declare const RainbowKitShogunButton: React.FC<RainbowKitShogunButtonProps>;
export {};

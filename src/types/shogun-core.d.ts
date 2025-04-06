// Type definitions for shogun-core
// This file extends the types provided by shogun-core

import { ShogunCore, IShogunCore, ShogunSDKConfig, AuthResult, SignUpResult, WalletInfo, LoggingConfig } from 'shogun-core';
import { ethers } from 'ethers';

declare module 'shogun-core' {
  interface IShogunCore {
    // These methods are now fully implemented in the core
    setRpcUrl(rpcUrl: string): boolean;
    getRpcUrl(): string | null;
    
    // Additional method declarations if needed
    isLoggedIn(): boolean;
    logout(): void;
    login(username: string, password: string): Promise<AuthResult>;
    signUp(username: string, password: string, passwordConfirmation?: string): Promise<SignUpResult>;
    getRecentErrors(count?: number): any[]; // ShogunError[]
    
    // Wallet methods
    getMainWallet(): ethers.Wallet | null;
    createWallet(): Promise<WalletInfo>;
    loadWallets(): Promise<WalletInfo[]>;
    
    // Configure logging
    configureLogging(config: LoggingConfig): void;
  }

  // Ensure ShogunCore interface matches the IShogunCore interface
  interface ShogunCore extends IShogunCore {}
} 
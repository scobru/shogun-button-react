# Shogun Button React - LLM Documentation

## Overview

Shogun Button React is a React component library for seamless Shogun authentication integration. Provides customizable UI components with multiple authentication methods.

## Core Features

- React components for Shogun authentication
- Multiple auth methods: Username/Password, MetaMask, WebAuthn, Nostr, OAuth
- Account backup/recovery with Gun pair export/import
- Dark mode support
- Responsive design
- TypeScript support

## Installation

```bash
npm install shogun-button-react
```

## Basic Usage

### Quick Setup

```tsx
import React from "react";
import {
  ShogunButton,
  ShogunButtonProvider,
  shogunConnector,
} from "shogun-button-react";
import "shogun-button-react/styles.css";

function App() {
  const { sdk, options } = shogunConnector({
    appName: "My App",
    appDescription: "An awesome app with Shogun authentication",
    appUrl: "https://myapp.com",
    appIcon: "https://myapp.com/icon.png",
    showMetamask: true,
    showWebauthn: true,
    showNostr: true,
    showOauth: true,
    peers: ["https://gun-manhattan.herokuapp.com/gun"],
    oauth: {
      providers: {
        google: {
          clientId: "YOUR_GOOGLE_CLIENT_ID",
          redirectUri: "http://localhost:3000/auth/callback",
        },
      },
    },
  });

  return (
    <ShogunButtonProvider
      sdk={sdk}
      options={options}
      onLoginSuccess={(data) => console.log("Login successful!", data)}
      onSignupSuccess={(data) => console.log("Signup successful!", data)}
      onError={(error) => console.error("An error occurred:", error)}
      onLogout={() => console.log("User logged out")}
    >
      <div>
        <h1>Welcome to My App</h1>
        <ShogunButton />
      </div>
    </ShogunButtonProvider>
  );
}
```

## API Reference

### Components

#### ShogunButtonProvider

Provider component that supplies Shogun context.

**Props:**

- `sdk: ShogunCore` - Shogun SDK instance
- `options: ShogunConnectorOptions` - Configuration options
- `onLoginSuccess: (data: AuthData) => void` - Login success callback
- `onSignupSuccess: (data: AuthData) => void` - Signup success callback
- `onError: (error: string) => void` - Error callback
- `onLogout: () => void` - Logout callback

#### ShogunButton

Main authentication button component with modal dialogs.

### Hook

#### useShogun

Hook to access Shogun authentication state and functions.

**Returns:**

```typescript
{
  isLoggedIn: boolean;
  userPub: string;
  username: string;
  login: (method: string, ...args: any[]) => Promise<void>;
  signup: (method: string, ...args: any[]) => Promise<void>;
  logout: () => void;
  hasPlugin: (name: string) => boolean;
  getPlugin: (name: string) => any;
  exportGunPair: (password?: string) => Promise<any>;
  importGunPair: (pairData: any, password?: string) => Promise<boolean>;
  observe: <T>(path: string) => Observable<T>;
}
```

## Authentication Methods

### Password Authentication

```tsx
// Login
await login("password", "username", "password");

// Sign up
await signup("password", "username", "password");
```

### Web3 Authentication (MetaMask)

```tsx
// Login with MetaMask
await login("web3");

// Sign up with MetaMask
await signup("web3");
```

### WebAuthn Authentication

```tsx
// Login with WebAuthn
await login("webauthn", "username");

// Sign up with WebAuthn
await signup("webauthn", "username");
```

### Nostr Authentication

```tsx
// Login with Nostr
await login("nostr");

// Sign up with Nostr
await signup("nostr");
```

### OAuth Authentication

```tsx
// Login with OAuth provider
await login("oauth", "google");

// Sign up with OAuth provider
await signup("oauth", "google");
```

### Account Recovery (Gun Pair)

```tsx
// Login with exported pair
await login("pair", pairData);

// Sign up with pair
await signup("pair", pairData);
```

## Configuration Options

### ShogunConnectorOptions

```typescript
interface ShogunConnectorOptions {
  // App information
  appName: string;
  appDescription?: string;
  appUrl?: string;
  appIcon?: string;

  // Feature toggles
  showMetamask?: boolean;
  showWebauthn?: boolean;
  showNostr?: boolean;
  showOauth?: boolean;
  darkMode?: boolean;

  // Network configuration
  websocketSecure?: boolean;
  providerUrl?: string | null;
  peers?: string[];
  authToken?: string;
  gunInstance?: IGunInstance<any>;

  // Advanced options
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
  oauth?: {
    providers: Record<
      string,
      {
        clientId: string;
        clientSecret?: string;
        redirectUri?: string;
      }
    >;
  };
}
```

### ShogunConnectorResult

```typescript
interface ShogunConnectorResult {
  sdk: ShogunCore;
  options: ShogunConnectorOptions;
  registerPlugin: (plugin: any) => boolean;
  hasPlugin: (name: string) => boolean;
}
```

## Advanced Usage

### Account Backup and Recovery

```tsx
const { exportGunPair, importGunPair } = useShogun();

// Export account for backup
const handleExportPair = async () => {
  try {
    const pairData = await exportGunPair("optional-encryption-password");
    console.log("Exported pair:", pairData);
    // Save this data securely for account recovery
  } catch (error) {
    console.error("Export failed:", error);
  }
};

// Import account from backup
const handleImportPair = async () => {
  try {
    const success = await importGunPair(savedPairData, "optional-password");
    if (success) {
      console.log("Pair imported successfully");
    }
  } catch (error) {
    console.error("Import failed:", error);
  }
};
```

### Reactive Data Observation

```tsx
const { observe, isLoggedIn } = useShogun();

useEffect(() => {
  if (isLoggedIn) {
    const subscription = observe<any>("user/profile").subscribe((data) => {
      console.log("Profile data updated:", data);
    });

    return () => subscription.unsubscribe();
  }
}, [isLoggedIn, observe]);
```

### Plugin Management

```tsx
const { hasPlugin, getPlugin } = useShogun();

// Check if a plugin is available
if (hasPlugin("web3")) {
  const web3Plugin = getPlugin("web3");
  // Use the plugin
}

// Available plugins: "web3", "webauthn", "nostr", "oauth"
```

## Styling

### CSS Variables

```css
:root {
  --shogun-button-primary: #5c6bc0;
  --shogun-button-hover: #3f51b5;
  --shogun-text-primary: #333333;
  --shogun-background: #ffffff;
  --shogun-border-radius: 8px;
  --shogun-font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --shogun-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shogun-transition: all 0.2s ease-in-out;
}
```

### Dark Mode

```tsx
const { sdk, options } = shogunConnector({
  appName: "My App",
  darkMode: true, // Enable dark mode
});
```

## Common Use Cases

### 1. Simple Authentication Button

```tsx
const { sdk, options } = shogunConnector({
  appName: "My App",
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
});

return (
  <ShogunButtonProvider sdk={sdk} options={options}>
    <ShogunButton />
  </ShogunButtonProvider>
);
```

### 2. Custom Authentication Flow

```tsx
const { login, signup, logout, isLoggedIn, username } = useShogun();

return (
  <div>
    {isLoggedIn ? (
      <div>
        <h2>Welcome, {username}!</h2>
        <button onClick={logout}>Logout</button>
      </div>
    ) : (
      <div>
        <button onClick={() => login("password", "user", "pass")}>
          Login with Password
        </button>
        <button onClick={() => login("web3")}>Login with MetaMask</button>
      </div>
    )}
  </div>
);
```

### 3. Multi-Auth Application

```tsx
const { sdk, options } = shogunConnector({
  appName: "My App",
  showMetamask: true,
  showWebauthn: true,
  showNostr: true,
  showOauth: true,
  darkMode: true,
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  oauth: {
    providers: {
      google: { clientId: "YOUR_ID" },
      github: { clientId: "YOUR_GITHUB_ID" },
    },
  },
});
```

## Dependencies

- React ≥ 18.0.0
- shogun-core ≥ 1.5.19
- ethers ≥ 6.13.5
- rxjs ≥ 7.8.1

## Browser Support

- Chrome ≥ 60
- Firefox ≥ 60
- Safari ≥ 12
- Edge ≥ 79

## Version

Current version: 1.5.20

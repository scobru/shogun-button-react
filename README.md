# Shogun Button React

A React component library for seamless integration of Shogun authentication into your applications. This library provides a simple yet powerful way to add Shogun authentication to your React applications.

## Features

- 🚀 Easy to integrate
- 🎨 Customizable UI components
- 🔒 Secure authentication flow
- 🌓 Dark mode support
- 🔌 Multiple authentication methods (Username/Password, MetaMask, WebAuthn, Nostr, OAuth)
- 🔑 Account backup and recovery (Gun pair export/import)
- 📱 Responsive design
- 🌍 TypeScript support

## Installation

```bash
npm install shogun-button-react
# or
yarn add shogun-button-react
```

## Quick Start

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
    // Enable authentication methods
    showMetamask: true,
    showWebauthn: true,
    showNostr: true,
    showOauth: true,
    // Network configuration
    peers: ["https://gun-manhattan.herokuapp.com/gun"],
    // OAuth providers (optional)
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
      onLoginSuccess={(data) => {
        console.log("Login successful!", data);
      }}
      onSignupSuccess={(data) => {
        console.log("Signup successful!", data);
      }}
      onError={(error) => {
        console.error("An error occurred:", error);
      }}
      onLogout={() => {
        console.log("User logged out");
      }}
    >
      <div>
        <h1>Welcome to My App</h1>
        <ShogunButton />
      </div>
    </ShogunButtonProvider>
  );
}

export default App;
```

## API Reference

### ShogunButtonProvider

The provider component that supplies Shogun context to your application.

#### Props

| Name            | Type                                                                                          | Description                                    |
| --------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| sdk             | ShogunCore                                                                                    | Shogun SDK instance created by shogunConnector |
| options         | ShogunConnectorOptions                                                                        | Configuration options                          |
| onLoginSuccess  | (data: { userPub: string; username: string; password?: string; authMethod?: string }) => void | Callback fired on successful login             |
| onSignupSuccess | (data: { userPub: string; username: string; password?: string; authMethod?: string }) => void | Callback fired on successful signup            |
| onError         | (error: string) => void                                                                       | Callback fired when an error occurs            |
| onLogout        | () => void                                                                                    | Callback fired when user logs out              |

### ShogunButton

The main button component for triggering Shogun authentication. The component provides a complete authentication UI with modal dialogs for login and signup.

### useShogun Hook

A hook to access Shogun authentication state and functions.

```tsx
import React, { useEffect } from "react";
import { useShogun } from "shogun-button-react";

function Profile() {
  const {
    isLoggedIn,
    userPub,
    username,
    login,
    signup,
    logout,
    hasPlugin,
    getPlugin,
    exportGunPair,
    importGunPair,
    observe,
  } = useShogun();

  const handleLogin = async () => {
    // Login with username/password
    await login("password", "username", "password");

    // Or login with MetaMask
    await login("web3");

    // Or login with WebAuthn
    await login("webauthn", "username");

    // Or login with Nostr
    await login("nostr");

    // Or login with OAuth
    await login("oauth", "google");

    // Or login with Gun pair (for account recovery)
    const pairData = {
      /* Gun pair object */
    };
    await login("pair", pairData);
  };

  const handleSignUp = async () => {
    // Sign up with username/password
    await signup("password", "newusername", "newpassword");

    // Or sign up with other methods (similar to login)
    await signup("web3");
    await signup("webauthn", "newusername");
  };

  const handleExportPair = async () => {
    try {
      const pairData = await exportGunPair("optional-encryption-password");
      console.log("Exported pair:", pairData);
      // Save this data securely for account recovery
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

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

  // Observe reactive data changes
  useEffect(() => {
    if (isLoggedIn) {
      const subscription = observe<any>("user/profile").subscribe((data) => {
        console.log("Profile data updated:", data);
      });

      return () => subscription.unsubscribe();
    }
  }, [isLoggedIn, observe]);

  return isLoggedIn ? (
    <div>
      <h2>Welcome, {username}!</h2>
      <p>User Public Key: {userPub}</p>
      <button onClick={logout}>Logout</button>
      <button onClick={handleExportPair}>Export Account</button>
    </div>
  ) : (
    <div>Please login to continue</div>
  );
}
```

## Configuration Options

The `shogunConnector` accepts the following options:

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

The `shogunConnector` returns an object with the following properties:

```typescript
interface ShogunConnectorResult {
  sdk: ShogunCore;
  options: ShogunConnectorOptions;
  registerPlugin: (plugin: any) => boolean;
  hasPlugin: (name: string) => boolean;
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

## Plugin Management

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

The component comes with default styling that you can override using CSS variables:

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

Enable dark mode by setting the `darkMode` option to `true`:

```tsx
const { sdk, options } = shogunConnector({
  appName: "My App",
  darkMode: true, // Enable dark mode
});
```

## Browser Support

- Chrome ≥ 60
- Firefox ≥ 60
- Safari ≥ 12
- Edge ≥ 79

## Dependencies

- React ≥ 18.0.0
- shogun-core ≥ 1.5.19
- ethers ≥ 6.13.5
- rxjs ≥ 7.8.1

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Shogun](https://github.com/shogun)

# Shogun Button React

A React component library for seamless integration of Shogun authentication into your applications. This library provides a simple yet powerful way to add Shogun authentication to your React applications.

## Features

- 🚀 Easy to integrate
- 🎨 Customizable UI components
- 🔒 Secure authentication flow
- 🌓 Dark mode support
- 🔌 Multiple authentication methods (Username/Password, MetaMask, WebAuthn, Nostr, OAuth)
- 📱 Responsive design
- 🌍 TypeScript support

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
  const { sdk, options, setProvider } = shogunConnector({
    appName: "My App",
    appDescription: "An awesome app with Shogun authentication",
    appUrl: "https://myapp.com",
    appIcon: "https://myapp.com/icon.png",
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

| Name            | Type                     | Description                                    |
| --------------- | ------------------------ | ---------------------------------------------- |
| sdk             | ShogunSDK                | Shogun SDK instance created by shogunConnector |
| options         | Object                   | Configuration options                          |
| onLoginSuccess  | (data: AuthData) => void | Callback fired on successful login             |
| onSignupSuccess | (data: AuthData) => void | Callback fired on successful signup            |
| onError         | (error: Error) => void   | Callback fired when an error occurs            |

### ShogunButton

The main button component for triggering Shogun authentication. The component provides a complete authentication UI with modal dialogs for login and signup.

### useShogun Hook

A hook to access Shogun authentication state and functions.

```tsx
import { useShogun } from "shogun-button-react";

function Profile() {
  const {
    isLoggedIn,
    userPub,
    username,
    login,
    signup,
    logout,
    setProvider,
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
  };

  const switchToCustomNetwork = () => {
    setProvider('https://my-custom-rpc.example.com');
  };

  return isLoggedIn ? (
    <div>
      <h2>Welcome, {username}!</h2>
      <p>User Public Key: {userPub}</p>
      <button onClick={logout}>Logout</button>
      <button onClick={switchToCustomNetwork}>Switch Network</button>
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
  logging?: {
    enabled: boolean;
    level: "error" | "warning" | "info" | "debug";
  };
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };
  oauth?: {
    providers: Record<string, {
      clientId: string;
      clientSecret?: string;
      redirectUri?: string;
    }>
  }
}
```

The `shogunConnector` returns an object with the following properties:

```typescript
interface ShogunConnectorResult {
  sdk: ShogunCore;
  options: ShogunConnectorOptions;
  setProvider: (provider: string | EthersProvider) => boolean;
  getCurrentProviderUrl: () => string | null;
  registerPlugin: (plugin: any) => boolean;
  hasPlugin: (name: string) => boolean;
}
```

> **Note**: The `setProvider` method attempts to update the RPC provider URL used by the SDK. This functionality depends on the specific version of Shogun Core you're using. If the SDK does not have a public `setRpcUrl` method available, the provider URL will still be saved but not applied to the SDK directly. In such cases, the setting will only be available through the `getCurrentProviderUrl` method.

## Styling

The component comes with default styling that you can override using CSS variables:

```css
:root {
  --shogun-button-primary: #5c6bc0;
  --shogun-button-hover: #3f51b5;
  --shogun-text-primary: #333333;
  --shogun-background: #ffffff;
  /* ... other variables */
}
```

## Browser Support

- Chrome ≥ 60
- Firefox ≥ 60
- Safari ≥ 12
- Edge ≥ 79

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT © [Shogun](https://github.com/shogun)

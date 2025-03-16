# Shogun Button React

A React component library for seamless integration of Shogun authentication into your applications. This library provides a simple yet powerful way to add Shogun authentication to your React applications.

## Features

- 🚀 Easy to integrate
- 🎨 Customizable UI components
- 🔒 Secure authentication flow
- 🌓 Dark mode support
- 🔌 Multiple authentication methods (Username/Password, MetaMask, WebAuthn)
- 📱 Responsive design
- 🌍 TypeScript support

## Installation

```bash
npm install @shogun/shogun-button-react
# or
yarn add @shogun/shogun-button-react
# or
pnpm add @shogun/shogun-button-react
```

## Quick Start

```tsx
import React from 'react';
import { ShogunButton, ShogunButtonProvider, shogunConnector } from '@shogun/shogun-button-react';
import '@shogun/shogun-button-react/styles.css';

function App() {
  const { sdk, options } = shogunConnector({
    appName: 'My App',
    appDescription: 'An awesome app with Shogun authentication',
    appUrl: 'https://myapp.com',
    appIcon: 'https://myapp.com/icon.png',
  });

  return (
    <ShogunButtonProvider 
      sdk={sdk}
      options={options}
      onLoginSuccess={(data) => {
        console.log('Login successful!', data);
      }}
      onSignupSuccess={(data) => {
        console.log('Signup successful!', data);
      }}
      onError={(error) => {
        console.error('An error occurred:', error);
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

| Name | Type | Description |
|------|------|-------------|
| sdk | ShogunSDK | Shogun SDK instance created by shogunConnector |
| options | Object | Configuration options |
| onLoginSuccess | (data: AuthData) => void | Callback fired on successful login |
| onSignupSuccess | (data: AuthData) => void | Callback fired on successful signup |
| onError | (error: Error) => void | Callback fired when an error occurs |

### ShogunButton

The main button component for triggering Shogun authentication.

#### Custom Button

You can customize the button appearance using `ShogunButton.Custom`:

```tsx
<ShogunButton.Custom>
  {({ ready, authenticate }) => (
    <button
      className="my-custom-button"
      disabled={!ready}
      onClick={authenticate}
    >
      Connect with Shogun
    </button>
  )}
</ShogunButton.Custom>
```

### useShogun Hook

A hook to access Shogun authentication state and functions.

```tsx
import { useShogun } from '@shogun/shogun-button-react';

function Profile() {
  const {
    isAuthenticated,
    user,
    login,
    signup,
    logout,
    connectWithMetaMask,
    connectWithWebAuthn
  } = useShogun();

  return isAuthenticated ? (
    <div>
      <h2>Welcome, {user.username}!</h2>
      <button onClick={logout}>Logout</button>
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
  appName: string;
  appDescription?: string;
  appUrl?: string;
  appIcon?: string;
  enableMetaMask?: boolean;
  enableWebAuthn?: boolean;
  theme?: 'light' | 'dark' | 'system';
  customStyles?: ShogunStyleOptions;
}
```

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

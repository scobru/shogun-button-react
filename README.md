# Shogun Button React

A comprehensive React component library for seamless integration of Shogun authentication into your applications. This library provides a simple yet powerful way to add multi-method authentication, account management, and real-time data synchronization to your React applications.

> **Version 4.0.0** - Compatible with shogun-core ^4.0.0

## ✨ Features

- 🚀 **Easy Integration** - Simple setup with minimal configuration
- 🎨 **Customizable UI** - Modern, responsive design with dark mode support
- 🔒 **Multi-Authentication** - Support for Password, MetaMask, WebAuthn, Nostr, and ZK-Proof
- 🔑 **Account Management** - Export/import Gun pairs for account backup and recovery
- 📱 **Responsive Design** - Works seamlessly across all device sizes
- 🌍 **TypeScript Support** - Full type safety and IntelliSense support
- 🔌 **Plugin System** - Advanced Gun operations with custom hooks
- 📊 **Real-time Data** - Reactive data synchronization with RxJS observables

## 📦 Requirements

- **React**: ^18.0.0
- **shogun-core**: ^4.0.0
- **Node.js**: ≥18

## 🚀 Quick Start

### Installation

```bash
npm install shogun-button-react shogun-core
# or
yarn add shogun-button-react shogun-core
```

### Updating from 3.x

If you're upgrading from version 3.x:

```bash
yarn upgrade shogun-button-react shogun-core
# or
npm update shogun-button-react shogun-core
```

### Basic Usage

```tsx
import React from "react";
import { ShogunButton, ShogunButtonProvider, shogunConnector } from "shogun-button-react";
import "shogun-button-react/styles.css";

function App() {
  const { core, options } = shogunConnector({
    appName: "My Awesome App",
    // Enable specific authentication methods
    showMetamask: true,
    showWebauthn: true,
    showNostr: true,
    showZkProof: true,
    // Optional peers
    peers: [
      "https://gun-manhattan.herokuapp.com/gun"
    ],
  });

  return (
    <ShogunButtonProvider
      core={core}
      options={options}
      onLoginSuccess={(data) => {
        console.log("Login successful!", data);
      }}
      onSignupSuccess={(data) => {
        console.log("Account created successfully!", data);
      }}
      onError={(error) => {
        console.error("Authentication error:", error);
      }}
    >
      <div className="app">
        <header>
          <h1>Welcome to My Awesome App</h1>
          <ShogunButton />
        </header>
        <main>{/* Your app content */}</main>
      </div>
    </ShogunButtonProvider>
  );
}

export default App;
```

## 🔧 Advanced Configuration

### Custom Authentication Options

```tsx
const { core, options } = shogunConnector({
  appName: "My App",

  // Toggle authentication methods in the UI
  showMetamask: true,
  showWebauthn: true,
  showNostr: true,
  showZkProof: true,

  // Network configuration
  peers: [
    "https://gun-manhattan.herokuapp.com/gun"
  ],

  // ZK-Proof configuration
  zkproof: {
    enabled: true,
    defaultGroupId: "my-app-users",
  },

  // Gun Advanced Plugin configuration
  enableGunDebug: true,
  enableConnectionMonitoring: true,
  defaultPageSize: 20,
  connectionTimeout: 10000,
});
```

## 🎯 API Reference

### ShogunButtonProvider

The provider component that supplies Shogun context to your application.

#### Props

| Name | Type | Description | Required |
|------|------|-------------|----------|
| `core` | `ShogunCore` | Shogun SDK instance created by `shogunConnector` | ✅ |
| `options` | `ShogunConnectorOptions` | Configuration options | ✅ |
| `onLoginSuccess` | `(data: AuthData) => void` | Callback fired on successful login | ❌ |
| `onSignupSuccess` | `(data: AuthData) => void` | Callback fired on successful signup | ❌ |
| `onError` | `(error: string) => void` | Callback fired when an error occurs | ❌ |

#### AuthData Interface

```typescript
interface AuthData {
  userPub: string;           // User's public key
  username: string;          // Display name
  password?: string;         // Password (if applicable)
  seedPhrase?: string;       // Seed phrase/trapdoor (for ZK-Proof)
  authMethod?: "password" | "web3" | "webauthn" | "nostr" | "zkproof" | "pair";
}
```

### ShogunButton

The main button component that provides a complete authentication UI with modal dialogs for login, signup, and account management.

**Features:**
- Multi-method authentication selection
- Password-based login/signup with recovery
- Gun pair export/import for account backup
- Responsive modal design
- Error handling and user feedback

### useShogun Hook

A comprehensive hook to access Shogun authentication state and functions.

```tsx
import React, { useEffect } from "react";
import { useShogun } from "shogun-button-react";

function UserProfile() {
  const {
    // Authentication state
    isLoggedIn,
    userPub,
    username,

    // Authentication methods
    login,
    signUp,
    logout,

    // Plugin management
    hasPlugin,
    getPlugin,

    // Account management
    exportGunPair,
    importGunPair,

    // Data operations
    observe,
    put,
    get,
    remove,

    // Advanced Gun hooks
    useGunState,
    useGunCollection,
    useGunConnection,
    useGunDebug,
    useGunRealtime,
  } = useShogun();

  // Example: Login with different methods
  const handlePasswordLogin = async () => {
    try {
      const result = await login("password", "username", "password");
      if (result.success) {
        console.log("Password login successful!");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleMetaMaskLogin = async () => {
    try {
      const result = await login("web3");
      if (result.success) {
        console.log("MetaMask login successful!");
      }
    } catch (error) {
      console.error("MetaMask login failed:", error);
    }
  };

  const handleWebAuthnLogin = async () => {
    try {
      const result = await login("webauthn", "username");
      if (result.success) {
        console.log("WebAuthn login successful!");
      }
    } catch (error) {
      console.error("WebAuthn login failed:", error);
    }
  };

  const handleZkProofSignup = async () => {
    try {
      const result = await signUp("zkproof");
      if (result.success && result.seedPhrase) {
        console.log("ZK-Proof signup successful!");
        console.log("SAVE THIS TRAPDOOR:", result.seedPhrase);
        // CRITICAL: User must save the trapdoor for account recovery
      }
    } catch (error) {
      console.error("ZK-Proof signup failed:", error);
    }
  };

  const handleZkProofLogin = async () => {
    try {
      const trapdoor = "user-saved-trapdoor-here";
      const result = await login("zkproof", trapdoor);
      if (result.success) {
        console.log("ZK-Proof anonymous login successful!");
      }
    } catch (error) {
      console.error("ZK-Proof login failed:", error);
    }
  };

  // Example: Account backup and recovery
  const handleExportAccount = async () => {
    try {
      const pairData = await exportGunPair("my-secure-password");
      console.log("Account exported successfully!");
      
      // Save to file or copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(pairData);
        alert("Account data copied to clipboard!");
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleImportAccount = async (pairData: string, password?: string) => {
    try {
      const success = await importGunPair(pairData, password);
      if (success) {
        console.log("Account imported successfully!");
      }
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  // Example: Real-time data observation
  useEffect(() => {
    if (isLoggedIn) {
      const subscription = observe<any>('user/profile').subscribe(data => {
        console.log('Profile updated:', data);
      });
      
      return () => subscription.unsubscribe();
    }
  }, [isLoggedIn, observe]);

  if (!isLoggedIn) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="user-profile">
      <h2>Welcome, {username}!</h2>
      <div className="profile-info">
        <p><strong>Public Key:</strong> {userPub}</p>
        <p><strong>Authentication Method:</strong> {authMethod}</p>
      </div>
      
      <div className="actions">
        <button onClick={handleExportAccount}>Export Account</button>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
}
```

## 🔌 Advanced Gun Plugin Usage

### Using Gun State Hooks

```tsx
function UserSettings() {
  const { useGunState, useGunCollection } = useShogun();
  
  // Single value state
  const profile = useGunState('user/profile', {
    name: '',
    email: '',
    preferences: {}
  });
  
  // Collection management
  const posts = useGunCollection('user/posts', {
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filter: (post) => post.isPublished
  });

  const updateProfile = async () => {
    await profile.update({
      name: 'New Name',
      preferences: { theme: 'dark' }
    });
  };

  const addPost = async () => {
    await posts.addItem({
      title: 'New Post',
      content: 'Post content...',
      createdAt: Date.now(),
      isPublished: true
    });
  };

  return (
    <div>
      <h3>Profile Settings</h3>
      {profile.isLoading ? (
        <p>Loading...</p>
      ) : profile.error ? (
        <p>Error: {profile.error}</p>
      ) : (
        <div>
          <input
            value={profile.data?.name || ''}
            onChange={(e) => profile.update({ name: e.target.value })}
            placeholder="Name"
          />
          <button onClick={updateProfile}>Save Changes</button>
        </div>
      )}

      <h3>Your Posts ({posts.items.length})</h3>
      {posts.isLoading ? (
        <p>Loading posts...</p>
      ) : (
        <div>
          {posts.items.map((post, index) => (
            <div key={index}>
              <h4>{post.title}</h4>
              <p>{post.content}</p>
            </div>
          ))}
          
          <div className="pagination">
            {posts.hasPrevPage && (
              <button onClick={posts.prevPage}>Previous</button>
            )}
            <span>Page {posts.currentPage + 1} of {posts.totalPages}</span>
            {posts.hasNextPage && (
              <button onClick={posts.nextPage}>Next</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### ZK-Proof Anonymous Authentication

ZK-Proof (Zero-Knowledge Proof) authentication provides complete anonymity using Semaphore protocol. Users can authenticate without revealing their identity.

```tsx
function ZkProofExample() {
  const { login, signUp } = useShogun();
  const [trapdoor, setTrapdoor] = useState("");

  // Signup: Creates anonymous identity and returns trapdoor
  const handleSignup = async () => {
    try {
      const result = await signUp("zkproof");
      
      if (result.success && result.seedPhrase) {
        // CRITICAL: User MUST save this trapdoor!
        // It's the ONLY way to recover the anonymous account
        console.log("Your trapdoor (save securely):", result.seedPhrase);
        
        // Recommend user to:
        // 1. Write it down on paper
        // 2. Store in password manager
        // 3. Keep multiple secure copies
        alert(`Save this trapdoor securely:\n\n${result.seedPhrase}\n\nYou'll need it to login on other devices!`);
      }
    } catch (error) {
      console.error("ZK-Proof signup failed:", error);
    }
  };

  // Login: Use saved trapdoor to restore anonymous identity
  const handleLogin = async () => {
    try {
      const result = await login("zkproof", trapdoor);
      
      if (result.success) {
        console.log("Logged in anonymously!");
        console.log("Identity commitment:", result.userPub);
      }
    } catch (error) {
      console.error("ZK-Proof login failed:", error);
    }
  };

  return (
    <div>
      <h3>Anonymous Authentication with ZK-Proof</h3>
      
      <div>
        <button onClick={handleSignup}>
          Create Anonymous Identity
        </button>
      </div>

      <div>
        <input
          type="text"
          value={trapdoor}
          onChange={(e) => setTrapdoor(e.target.value)}
          placeholder="Enter your trapdoor to login"
        />
        <button onClick={handleLogin}>
          Login Anonymously
        </button>
      </div>
    </div>
  );
}
```

**Important Notes about ZK-Proof:**

- **Trapdoor is Critical**: The trapdoor is like a master password - without it, the account is permanently lost
- **No Recovery**: Unlike traditional auth, there's no "forgot password" - trapdoor loss means permanent account loss
- **Complete Anonymity**: Your identity remains private even from the application
- **Multi-Device Support**: Use the same trapdoor on different devices
- **Privacy-Preserving**: Uses Semaphore protocol for zero-knowledge proofs

### Connection Monitoring

```tsx
function ConnectionStatus() {
  const { useGunConnection, useGunDebug } = useShogun();
  
  // Monitor connection status
  const connection = useGunConnection('user/data');
  
  // Enable debug logging
  useGunDebug('user/data', true);

  return (
    <div className="connection-status">
      <div className={`status-indicator ${connection.isConnected ? 'connected' : 'disconnected'}`}>
        {connection.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      {connection.lastSeen && (
        <p>Last seen: {connection.lastSeen.toLocaleTimeString()}</p>
      )}
      
      {connection.error && (
        <p className="error">Error: {connection.error}</p>
      )}
    </div>
  );
}
```

## 🎨 Customization

### CSS Variables

Customize the appearance using CSS variables:

```css
:root {
  /* Primary colors */
  --shogun-primary: #3b82f6;
  --shogun-primary-hover: #2563eb;
  
  /* Background colors */
  --shogun-bg: #ffffff;
  --shogun-bg-secondary: #f3f4f6;
  
  /* Text colors */
  --shogun-text: #1f2937;
  --shogun-text-secondary: #6b7280;
  
  /* Border and shadow */
  --shogun-border: #e5e7eb;
  --shogun-border-radius: 12px;
  --shogun-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --shogun-transition: all 0.2s ease;
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    --shogun-bg: #1f2937;
    --shogun-bg-secondary: #374151;
    --shogun-text: #f3f4f6;
    --shogun-text-secondary: #9ca3af;
    --shogun-border: #4b5563;
  }
}
```

### Custom Styling

```css
/* Custom button styles */
.shogun-connect-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 25px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Custom modal styles */
.shogun-modal {
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

/* Custom form styles */
.shogun-form-group input {
  border-radius: 10px;
  border: 2px solid transparent;
  transition: border-color 0.3s ease;
}

.shogun-form-group input:focus {
  border-color: var(--shogun-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
```

## 🔧 Configuration Options

### Complete Configuration Interface

```typescript
interface ShogunConnectorOptions {
  // App information
  appName: string;

  // Feature toggles
  showMetamask?: boolean;
  showWebauthn?: boolean;
  showNostr?: boolean;
  darkMode?: boolean;

  // Network configuration
  peers?: string[];
  authToken?: string;
  gunInstance?: IGunInstance<any>;

  // Timeouts and provider configs
  timeouts?: {
    login?: number;
    signup?: number;
    operation?: number;
  };

  // Gun Advanced Plugin configuration
  enableGunDebug?: boolean;
  enableConnectionMonitoring?: boolean;
  defaultPageSize?: number;
  connectionTimeout?: number;
  debounceInterval?: number;
}
```

### Connector Result

```typescript
interface ShogunConnectorResult {
  core: ShogunCore;
  options: ShogunConnectorOptions;
  setProvider: (provider: any) => boolean;
  getCurrentProviderUrl: () => string | null;
  registerPlugin: (plugin: any) => boolean;
  hasPlugin: (name: string) => boolean;
  gunPlugin: GunAdvancedPlugin;
}
```

## 🌐 Browser Support

- **Chrome** ≥ 60
- **Firefox** ≥ 60
- **Safari** ≥ 12
- **Edge** ≥ 79

## 📱 Mobile Support

The library is fully responsive and works seamlessly on mobile devices. All authentication methods are optimized for touch interfaces.

## 🔒 Security Features

- **Encrypted Storage**: Gun pairs can be encrypted with passwords
- **Secure Authentication**: Multiple secure authentication methods
- **Session Management**: Automatic session handling and cleanup
- **Error Handling**: Comprehensive error handling and user feedback

## 🚀 Performance

- **Lazy Loading**: Components load only when needed
- **Optimized Rendering**: Efficient React rendering with proper memoization
- **Connection Pooling**: Smart connection management for optimal performance
- **Debounced Updates**: Prevents excessive re-renders during rapid data changes

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/shogun/shogun-button-react.git

# Install dependencies
yarn install

# Start development server
yarn dev

# Build the library
yarn build

# Run tests
yarn test
```

## 📄 License

MIT © [Shogun](https://github.com/shogun)

## 🆘 Support

- **Documentation**: [Full API Reference](https://docs.shogun.dev)
- **Issues**: [GitHub Issues](https://github.com/shogun/shogun-button-react/issues)
- **Discussions**: [GitHub Discussions](https://github.com/shogun/shogun-button-react/discussions)
- **Discord**: [Join our community](https://discord.gg/shogun)

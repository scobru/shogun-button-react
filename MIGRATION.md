# Migration Guide: v3.x to v4.0.0

This guide will help you upgrade from shogun-button-react 3.x to 4.0.0.

## Overview

Version 4.0.0 introduces compatibility with shogun-core 4.0.0 and removes OAuth authentication support.

## Breaking Changes

### 1. OAuth Authentication Removed

OAuth authentication has been removed from both shogun-core and shogun-button-react.

**Before (v3.x):**
```tsx
const { core, options } = shogunConnector({
  appName: "My App",
  showOauth: true,
  oauth: {
    clientId: "your-client-id",
    // ... other OAuth config
  }
});
```

**After (v4.0.0):**
```tsx
const { core, options } = shogunConnector({
  appName: "My App",
  // Remove showOauth and oauth configuration
  showMetamask: true,
  showWebauthn: true,
  showNostr: true,
});
```

### 2. Updated Dependencies

- **shogun-core**: Updated from `^3.3.8` to `^4.0.0`
- **rxjs**: Updated from `^7.8.1` to `^7.8.2`

## Migration Steps

### Step 1: Update Dependencies

Update your `package.json`:

```bash
yarn upgrade shogun-button-react shogun-core
# or
npm update shogun-button-react shogun-core
```

Or manually update in `package.json`:

```json
{
  "dependencies": {
    "shogun-button-react": "^4.0.0",
    "shogun-core": "^4.0.0"
  }
}
```

### Step 2: Remove OAuth Configuration

If you were using OAuth authentication:

1. Remove the `showOauth` option from your connector configuration
2. Remove any `oauth` configuration objects
3. Update your authentication flow to use alternative methods:
   - Password authentication
   - MetaMask (Web3)
   - WebAuthn
   - Nostr

**Example migration:**

```tsx
// Before
const handleLogin = async () => {
  await login("oauth", { provider: "google" });
};

// After - use an alternative method
const handleLogin = async () => {
  // Option 1: MetaMask
  await login("web3");
  
  // Option 2: WebAuthn
  await login("webauthn", "username");
  
  // Option 3: Password
  await login("password", "username", "password");
  
  // Option 4: Nostr
  await login("nostr");
};
```

### Step 3: Update TypeScript Types (if applicable)

If you have custom type definitions that reference OAuth:

```tsx
// Before
type AuthMethod = "password" | "web3" | "webauthn" | "nostr" | "oauth" | "pair";

// After
type AuthMethod = "password" | "web3" | "webauthn" | "nostr" | "pair";
```

### Step 4: Test Your Application

1. **Test Authentication Flow**: Verify that all authentication methods work correctly
2. **Test Account Management**: Ensure export/import functionality works
3. **Test Data Synchronization**: Check that real-time data sync is functioning
4. **Test Gun Plugin Hooks**: Verify that Gun advanced hooks are working

## No Code Changes Required

If you weren't using OAuth authentication, no code changes are required! The API remains the same for all other authentication methods.

## New Features in v4.0.0

- Enhanced compatibility with shogun-core 4.0.0
- Improved type definitions
- Better error handling
- Updated dependencies for better security and performance

## Rollback Instructions

If you need to rollback to v3.x:

```bash
yarn add shogun-button-react@3 shogun-core@3
# or
npm install shogun-button-react@3 shogun-core@3
```

## Need Help?

- Check the [full documentation](README.md)
- Review the [CHANGELOG](CHANGELOG.md)
- Open an issue on [GitHub](https://github.com/shogun/shogun-button-react/issues)

## Verification Checklist

After migration, verify:

- [ ] Dependencies are updated to v4.0.0
- [ ] OAuth references are removed
- [ ] Alternative authentication methods are configured
- [ ] Application builds without errors
- [ ] All authentication flows work correctly
- [ ] Gun advanced hooks function properly
- [ ] Export/import functionality works
- [ ] No TypeScript errors

## Additional Resources

- [shogun-core v4.0.0 Documentation](../shogun-core/README.md)
- [Authentication Best Practices](README.md#-advanced-configuration)
- [Gun Plugin Usage Guide](README.md#-advanced-gun-plugin-usage)


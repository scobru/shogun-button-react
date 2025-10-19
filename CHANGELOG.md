# Changelog

## Version 4.0.0 (Latest)

### 💥 Breaking Changes
- **OAuth Removed**: Removed OAuth authentication support following removal from shogun-core
  - Removed `showOauth` option from `ShogunConnectorOptions`
  - Removed `oauth` configuration from connector options
  - Removed OAuth login/signup methods from button component
  - Removed Google OAuth icon and UI elements
  - Updated `authMethod` type to exclude "oauth"

### ✨ New Features
- **ZK-Proof Authentication**: Added support for anonymous authentication using Zero-Knowledge Proofs
  - New `showZkProof` option to enable/disable ZK-Proof in UI
  - `zkproof` configuration for customizing ZK-Proof settings
  - Login with trapdoor (recovery phrase)
  - Signup generates new anonymous identity with trapdoor
  - Complete anonymity using Semaphore protocol
  - Multi-device support with same trapdoor
  - Added ZK-Proof icon and UI components
  - Added `authMethod: "zkproof"` support
  - Added `seedPhrase` field to `AuthData` interface for trapdoor backup

### ⬆️ Dependencies Update
- **shogun-core**: Updated from `^3.3.8` to `^4.0.0`
- **rxjs**: Updated from `^7.8.1` to `^7.8.2` (aligned with shogun-core 4.0.0)

### 🔄 Migration Guide
If you were using OAuth authentication:
- Remove `showOauth` property from your `shogunConnector` configuration
- Remove `oauth` provider configuration
- Use alternative authentication methods: Password, MetaMask, WebAuthn, or Nostr

For updating from version 3.x:
- Update dependencies: `yarn upgrade shogun-button-react shogun-core`
- No API changes required - all existing functionality is maintained
- Verify compatibility with shogun-core 4.0.0 features
- New ZK-Proof authentication available (opt-in via `showZkProof: true`)

### 📝 New Configuration Options

```typescript
const { core, options } = shogunConnector({
  appName: "My App",
  showZkProof: true,  // Enable ZK-Proof authentication
  zkproof: {
    enabled: true,
    defaultGroupId: "my-app-users",
  },
});
```

### 🔐 ZK-Proof Authentication Flow

**Signup:**
```typescript
const result = await signUp("zkproof");
if (result.success && result.seedPhrase) {
  // User MUST save the seedPhrase (trapdoor)
  console.log("Save this trapdoor:", result.seedPhrase);
}
```

**Login:**
```typescript
const result = await login("zkproof", savedTrapdoor);
if (result.success) {
  console.log("Logged in anonymously!");
}
```

## Version 1.3.4

### 🐛 Bug Fixes
- **Export Gun Pair Fix**: Fixed issue where "Export Pair" option was not accessible from user dropdown - now works correctly without requiring disconnect
- **Modal Logic Improvement**: Enhanced modal rendering logic to allow export functionality when user is already authenticated
- **UX Enhancement**: Improved back button behavior in export modal - now properly closes modal when user is logged in instead of showing unnecessary auth options

### 🔧 Technical Changes
- Modified component render logic to show modal even when user is logged in
- Improved export form navigation for better user experience
- Reordered dropdown menu items for better flow (Export Pair before Disconnect)

## Version 1.3.3

### ✨ New Features
- **Import Gun Pair Login**: Aggiunta possibilità di effettuare login tramite importazione di un Gun pair esistente
- **Export Gun Pair**: Funzionalità per esportare il proprio Gun pair con opzione di crittografia tramite password
- **Improved UX**: Migliorata l'interfaccia utente con feedback visivi e messaggi informativi

### 🔧 Improvements
- **Navigation Fix**: Il toggle "Don't have account? Sign up" ora porta alla selezione dei metodi di autenticazione invece che direttamente al form password
- **Visual Feedback**: Sostituiti gli alert con feedback visivi eleganti per export/import
- **Better Icons**: Aggiunte icone SVG personalizzate per import/export
- **Auto-copy**: L'export del pair viene automaticamente copiato negli appunti (quando supportato dal browser)
- **Enhanced Security**: Messaggi informativi per guidare l'utente nell'uso sicuro delle funzionalità

### 🛠 Technical Changes
- Rimosso l'uso del metodo `on` non disponibile in ShogunCore
- Definiti tipi locali per `AuthResult` per compatibilità
- Migliorata gestione degli stati nel provider
- Aggiunto reset completo degli stati quando si chiude il modal

### 🎨 UI/UX Enhancements
- Box informativi colorati per import/export
- Feedback di successo con timer automatico
- Indicatori di caricamento migliorati
- Messaggi di fallback per browser senza supporto clipboard

## Version 1.3.2

### Features
- Basic Gun pair export/import functionality
- Multi-authentication support (Password, MetaMask, WebAuthn, Nostr, OAuth)
- Dark mode support
- Responsive design

## Version 1.3.1

### Features
- Initial release
- Basic authentication flow
- Provider integration 
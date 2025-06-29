# Changelog

## Version 1.3.4 (Latest)

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
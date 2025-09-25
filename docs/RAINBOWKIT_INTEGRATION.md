# RainbowKit Integration with Shogun Button React

Questa guida spiega come integrare RainbowKit con Shogun Button React per fornire un'esperienza di connessione wallet migliorata.

## Panoramica

RainbowKit è una libreria che fornisce un'interfaccia utente elegante per la connessione di wallet Web3. L'integrazione con Shogun permette di:

1. Utilizzare RainbowKit per la connessione wallet
2. Utilizzare Shogun per l'autenticazione e la gestione degli utenti
3. Ottenere il meglio di entrambi i sistemi

## Installazione

Prima di tutto, installa le dipendenze necessarie:

```bash
npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
# oppure
yarn add @rainbow-me/rainbowkit wagmi viem @tanstack/react-query
```

## Configurazione Base

### 1. Configurazione RainbowKit

```tsx
import React from 'react';
import { 
  RainbowKitProvider, 
  getDefaultConfig 
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Configurazione RainbowKit v2
const config = getDefaultConfig({
  appName: 'My Shogun App',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, polygon, optimism, arbitrum],
  ssr: false, // Se la tua app usa SSR, imposta questo su true
});

// QueryClient per React Query (richiesto da RainbowKit v2)
const queryClient = new QueryClient();
```

### 2. Configurazione Shogun

```tsx
import { ShogunButtonProvider, shogunConnector } from 'shogun-button-react';

const { core, options } = shogunConnector({
  appName: "My Shogun App",
  showMetamask: false, // Disabilitiamo il pulsante MetaMask standard
  showWebauthn: true,
  showNostr: true,
  showOauth: true,
});
```

### 3. Integrazione Completa

```tsx
import React from 'react';
import { WagmiConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { ShogunButtonProvider, RainbowKitShogunButton } from 'shogun-button-react';
import '@rainbow-me/rainbowkit/styles.css';
import 'shogun-button-react/styles.css';

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <ShogunButtonProvider
          core={core}
          options={options}
          onLoginSuccess={(data) => {
            console.log('Login successful:', data);
          }}
          onError={(error) => {
            console.error('Error:', error);
          }}
        >
          <div>
            <h1>My App</h1>
            <RainbowKitShogunButton />
          </div>
        </ShogunButtonProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

## Utilizzo

### Componente RainbowKitShogunButton

Il componente `RainbowKitShogunButton` gestisce automaticamente la connessione wallet e l'autenticazione Shogun:

```tsx
<RainbowKitShogunButton
  mode="auto" // 'login', 'signup', o 'auto'
  connectText="Connect Wallet"
  loginText="Login with Wallet"
  connectedText="Connected"
  onSuccess={(data) => console.log('Success:', data)}
  onError={(error) => console.error('Error:', error)}
  showAddress={true}
/>
```

#### Props

| Prop | Tipo | Default | Descrizione |
|------|------|---------|-------------|
| `mode` | `'login' \| 'signup' \| 'auto'` | `'auto'` | Modalità di autenticazione |
| `connectText` | `string` | `"Connect Wallet"` | Testo quando non connesso |
| `loginText` | `string` | `"Login with Wallet"` | Testo quando connesso ma non autenticato |
| `connectedText` | `string` | `"Connected"` | Testo quando autenticato |
| `onSuccess` | `(data: any) => void` | - | Callback per successo |
| `onError` | `(error: string) => void` | - | Callback per errori |
| `className` | `string` | `"shogun-connect-button"` | Classe CSS personalizzata |
| `showAddress` | `boolean` | `true` | Mostra l'indirizzo del wallet |

### Hook useRainbowKitShogun

Per un controllo più granulare, utilizza l'hook `useRainbowKitShogun`:

```tsx
import { useRainbowKitShogun } from 'shogun-button-react';

function MyComponent() {
  const {
    address,
    isConnected,
    isLoggedIn,
    connectAndLogin,
    connectAndSignUp,
    loginWithAddress,
    signUpWithAddress,
    openConnectModal,
  } = useRainbowKitShogun();

  const handleLogin = async () => {
    const result = await connectAndLogin();
    if (result.success) {
      console.log('Login successful!');
    }
  };

  return (
    <div>
      <p>Wallet: {isConnected ? 'Connected' : 'Not Connected'}</p>
      <p>Shogun: {isLoggedIn ? 'Authenticated' : 'Not Authenticated'}</p>
      {address && <p>Address: {address}</p>}
      
      <button onClick={handleLogin}>
        Login with Shogun
      </button>
    </div>
  );
}
```

#### Hook Return Values

| Property | Tipo | Descrizione |
|----------|------|-------------|
| `address` | `string \| undefined` | Indirizzo del wallet connesso |
| `isConnected` | `boolean` | Se il wallet è connesso |
| `isLoggedIn` | `boolean` | Se l'utente è autenticato con Shogun |
| `connectAndLogin` | `() => Promise<AuthResult>` | Connette e fa login |
| `connectAndSignUp` | `() => Promise<AuthResult>` | Connette e registra |
| `loginWithAddress` | `(address: string) => Promise<AuthResult>` | Login con indirizzo specifico |
| `signUpWithAddress` | `(address: string) => Promise<AuthResult>` | Registrazione con indirizzo specifico |
| `openConnectModal` | `() => void` | Apre il modal di connessione RainbowKit |
| `isReady` | `boolean` | Se RainbowKit e Shogun sono pronti |

## Flusso di Autenticazione

1. **Connessione Wallet**: L'utente clicca sul pulsante e RainbowKit apre il modal di connessione
2. **Selezione Wallet**: L'utente seleziona il wallet preferito (MetaMask, WalletConnect, etc.)
3. **Connessione**: RainbowKit gestisce la connessione e restituisce l'indirizzo
4. **Autenticazione Shogun**: Shogun utilizza l'indirizzo per l'autenticazione
5. **Gestione Utente**: Shogun crea o recupera l'utente e gestisce la sessione

## Modalità di Funzionamento

### Modalità 'auto'
- Prova prima il login
- Se l'utente non esiste, prova la registrazione automaticamente

### Modalità 'login'
- Tenta solo il login
- Fallisce se l'utente non esiste

### Modalità 'signup'
- Tenta solo la registrazione
- Fallisce se l'utente esiste già

## Personalizzazione

### Stili CSS

Puoi personalizzare l'aspetto utilizzando le classi CSS:

```css
.rainbowkit-shogun-container {
  /* Container del componente */
}

.shogun-connect-button {
  /* Pulsante principale */
}

.shogun-connect-button.shogun-connected {
  /* Pulsante quando connesso */
}

.shogun-connect-button.shogun-loading {
  /* Pulsante durante il caricamento */
}

.shogun-error-message {
  /* Messaggi di errore */
}
```

### Configurazione Avanzata

```tsx
const { core, options } = shogunConnector({
  appName: "My App",
  appDescription: "My awesome app",
  appUrl: "https://myapp.com",
  appIcon: "https://myapp.com/icon.png",
  
  // Disabilita i metodi di autenticazione standard
  showMetamask: false,
  showWebauthn: false,
  showNostr: false,
  showOauth: false,
  
  // Configurazione Gun
  enableGunDebug: true,
  enableConnectionMonitoring: true,
});
```

## Esempi Completi

Vedi il file `examples/rainbowkit-integration.tsx` per un esempio completo di integrazione.

## Troubleshooting

### Problemi Comuni

1. **"RainbowKit not available"**
   - Assicurati che RainbowKitProvider sia configurato correttamente
   - Verifica che WagmiConfig sia presente

2. **"Web3 plugin not available"**
   - Assicurati che ShogunButtonProvider sia configurato
   - Verifica che il plugin web3 sia abilitato

3. **Connessione fallisce**
   - Verifica la configurazione delle catene
   - Controlla che i provider RPC siano accessibili

### Debug

Abilita il debug per vedere i log dettagliati:

```tsx
const { core, options } = shogunConnector({
  // ... altre opzioni
  enableGunDebug: true,
});
```

## Supporto

Per problemi o domande:
- GitHub Issues: [shogun-button-react](https://github.com/shogun/shogun-button-react/issues)
- Discord: [Shogun Community](https://discord.gg/shogun)

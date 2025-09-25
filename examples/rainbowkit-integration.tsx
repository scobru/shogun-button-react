import React from 'react';
import { 
  RainbowKitProvider, 
  getDefaultConfig 
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ShogunButtonProvider, RainbowKitShogunButton, ShogunButtonWithRainbowKit, useRainbowKitShogun } from '../src';
import '@rainbow-me/rainbowkit/styles.css';
import '../src/styles/index.css';

// Configurazione RainbowKit v2
const config = getDefaultConfig({
  appName: 'Shogun RainbowKit Integration',
  projectId: process.env.REACT_APP_WALLETCONNECT_PROJECT_ID || '',
  chains: [mainnet, polygon, optimism, arbitrum],
  ssr: false, // Se la tua app usa SSR, imposta questo su true
});

// QueryClient per React Query (richiesto da RainbowKit v2)
const queryClient = new QueryClient();

// Componente di esempio che mostra come utilizzare l'hook personalizzato
const CustomRainbowKitIntegration: React.FC = () => {
  const {
    address,
    isConnected,
    isLoggedIn,
    connectAndLogin,
    connectAndSignUp,
    loginWithAddress,
    signUpWithAddress,
  } = useRainbowKitShogun();

  const handleCustomLogin = async () => {
    const result = await connectAndLogin();
    if (result.success) {
      console.log('Login successful:', result);
    } else {
      console.error('Login failed:', result.error);
    }
  };

  const handleCustomSignup = async () => {
    const result = await connectAndSignUp();
    if (result.success) {
      console.log('Signup successful:', result);
    } else {
      console.error('Signup failed:', result.error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Custom RainbowKit + Shogun Integration</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Wallet Status:</strong> {isConnected ? 'Connected' : 'Not Connected'}</p>
        <p><strong>Shogun Status:</strong> {isLoggedIn ? 'Authenticated' : 'Not Authenticated'}</p>
        {address && <p><strong>Address:</strong> {address}</p>}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleCustomLogin} disabled={!isConnected}>
          Login with Shogun
        </button>
        <button onClick={handleCustomSignup} disabled={!isConnected}>
          Signup with Shogun
        </button>
      </div>
    </div>
  );
};

// Componente principale dell'app
const App: React.FC = () => {
  const { core, options } = shogunConnector({
    appName: "Shogun RainbowKit Demo",
    showMetamask: false, // Disabilitiamo il pulsante MetaMask standard
    showWebauthn: true,
    showNostr: true,
    showOauth: true,
  });

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
        <ShogunButtonProvider
          core={core}
          options={options}
          onLoginSuccess={(data) => {
            console.log('Shogun login successful:', data);
          }}
          onSignupSuccess={(data) => {
            console.log('Shogun signup successful:', data);
          }}
          onError={(error) => {
            console.error('Shogun error:', error);
          }}
        >
          <div style={{ padding: '20px' }}>
            <h1>Shogun + RainbowKit Integration Demo</h1>
            
            <div style={{ marginBottom: '40px' }}>
              <h2>1. ShogunButton con integrazione RainbowKit</h2>
              <p>Il ShogunButton standard che utilizza automaticamente RainbowKit quando disponibile:</p>
              
              <div style={{ marginBottom: '20px' }}>
                <ShogunButtonWithRainbowKit
                  core={core}
                  options={options}
                  onLoginSuccess={(data) => console.log('Shogun login success:', data)}
                  onError={(error) => console.error('Shogun error:', error)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h2>2. Componente RainbowKitShogunButton (alternativo)</h2>
              <p>Componente dedicato che gestisce automaticamente la connessione wallet e l'autenticazione Shogun:</p>
              
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <RainbowKitShogunButton
                  mode="auto"
                  connectText="Connect Wallet"
                  loginText="Login with Wallet"
                  connectedText="Connected"
                  onSuccess={(data) => console.log('Auto auth success:', data)}
                  onError={(error) => console.error('Auto auth error:', error)}
                />
                
                <RainbowKitShogunButton
                  mode="login"
                  connectText="Connect & Login"
                  loginText="Login"
                  connectedText="Logged In"
                  onSuccess={(data) => console.log('Login success:', data)}
                />
                
                <RainbowKitShogunButton
                  mode="signup"
                  connectText="Connect & Signup"
                  loginText="Signup"
                  connectedText="Registered"
                  onSuccess={(data) => console.log('Signup success:', data)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <h2>3. Hook personalizzato useRainbowKitShogun</h2>
              <p>Utilizza l'hook per controllare manualmente il processo di autenticazione:</p>
              
              <CustomRainbowKitIntegration />
            </div>

            <div>
              <h2>4. ShogunButton standard (per confronto)</h2>
              <p>Il pulsante Shogun standard (senza RainbowKit):</p>
              <ShogunButton />
            </div>
          </div>
        </ShogunButtonProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;

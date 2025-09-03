import { ShogunButton, ShogunButtonProvider, useShogun } from './components/ShogunButton.js';
import { ShogunConnectorOptions, ShogunConnectorResult } from './types/connector-options.js';
import { shogunConnector } from './connector.js';
import { GunAdvancedPlugin } from './plugins/GunAdvancedPlugin.js';

// Export components
export { 
  ShogunButton, 
  ShogunButtonProvider, 
  useShogun 
};

// Export connector function
export { shogunConnector };

// Export all types
export * from './types/index.js';

// Export specific connector types for backward compatibility
export { ShogunConnectorOptions, ShogunConnectorResult };
export { GunAdvancedPlugin };

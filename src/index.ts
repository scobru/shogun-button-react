import { ShogunButton, ShogunButtonProvider, useShogun } from './components/ShogunButton';
import { ShogunConnectorOptions, ShogunConnectorResult } from './interfaces/connector-options';
import { shogunConnector } from './connector';
import { GunAdvancedPlugin } from './plugins/GunAdvancedPlugin';

// Export components
export { 
  ShogunButton, 
  ShogunButtonProvider, 
  useShogun 
};

// Export connector function
export { shogunConnector };

// Export all types
export * from './interfaces/connector-options';

// Export specific connector types for backward compatibility
export { ShogunConnectorOptions, ShogunConnectorResult };
export { GunAdvancedPlugin };

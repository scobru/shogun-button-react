// Export the connector options
export * from './connector-options.js';

// Re-export any necessary types from shogun-core
// These are for convenience so consumers don't have to import directly from shogun-core
import { AuthResult, SignUpResult } from 'shogun-core';
export { AuthResult, SignUpResult };

// Export any type extensions/declarations
// Note: .d.ts files don't need .js extension in imports 
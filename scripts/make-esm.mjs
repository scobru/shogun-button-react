import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outPath = resolve(__dirname, '../dist/index.esm.js');
mkdirSync(dirname(outPath), { recursive: true });

const content = `export { ShogunButton, ShogunButtonProvider, useShogun } from './components/ShogunButton.js';\nexport { shogunConnector } from './connector.js';\nexport * from './interfaces/connector-options.js';\n`;

writeFileSync(outPath, content, 'utf8');
console.log('[make-esm] Wrote', outPath);


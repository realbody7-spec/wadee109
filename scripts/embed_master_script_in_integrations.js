import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.join(__dirname, '..', 'backend', 'data', 'Master_AppsScript.js');
const scriptCode = fs.readFileSync(scriptPath, 'utf8');

const integrationsPath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'Integrations.jsx');
let content = fs.readFileSync(integrationsPath, 'utf8');

// Replace value={`...`} in Apps Script textarea
const regex = /value=\{`function doGet\(e\)[\s\S]*?`\}/;
if (regex.test(content)) {
  content = content.replace(regex, `value={\`${scriptCode.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`}`);
  fs.writeFileSync(integrationsPath, content, 'utf8');
  console.log('✅ Successfully updated Integrations.jsx with 168-column Master Apps Script!');
} else {
  console.error('Could not find Apps Script textarea matching regex in Integrations.jsx');
}

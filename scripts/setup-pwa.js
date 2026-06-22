import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconSource = "C:\\Users\\USER\\.gemini\\antigravity\\brain\\67be2581-deb8-4987-891a-c910f4f4c442\\sop_app_icon_1782140729797.png";
const publicDir = path.join(__dirname, '..', 'frontend', 'public');

try {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('Created frontend/public directory.');
  }

  if (fs.existsSync(iconSource)) {
    fs.copyFileSync(iconSource, path.join(publicDir, 'icon-512.png'));
    fs.copyFileSync(iconSource, path.join(publicDir, 'icon-192.png'));
    console.log('Copied app icons to frontend/public.');
  } else {
    console.error('Source icon file not found at:', iconSource);
  }
} catch (err) {
  console.error('Error setting up PWA assets:', err);
}

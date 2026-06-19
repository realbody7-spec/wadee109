import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '..', 'frontend', 'dist');
const destDir = path.join(__dirname, '..', 'backend', 'public');

function copyFolderRecursiveSync(sources, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(sources);
  for (const file of files) {
    const srcFile = path.join(sources, file);
    const destFile = path.join(target, file);

    if (fs.lstatSync(srcFile).isDirectory()) {
      if (file === 'uploads') continue; // Do not touch uploads directory
      copyFolderRecursiveSync(srcFile, destFile);
    } else {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

try {
  if (fs.existsSync(srcDir)) {
    console.log(`Copying frontend build from ${srcDir} to ${destDir}...`);
    copyFolderRecursiveSync(srcDir, destDir);
    console.log('Frontend build copied successfully!');
  } else {
    console.error('Error: frontend/dist does not exist. Run build first.');
    process.exit(1);
  }
} catch (err) {
  console.error('Error copying frontend build:', err);
  process.exit(1);
}

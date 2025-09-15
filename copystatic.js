import { mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __dirname = dirname(fileURLToPath(import.meta.url));

const copyRecursive = (src, dest) => {
  if (existsSync(src)) {
    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true });
    console.log(`Copied ${src} → ${dest}`);
  } else {
    console.warn(`⚠️ Source not found: ${src}`);
  }
};

const paths = [
  ['.next/static', '.next/standalone/.next/static'],
  ['public', '.next/standalone/public'],
];

paths.forEach(([src, dest]) => copyRecursive(join(__dirname, src), join(__dirname, dest)));
// Copy the static files to the .next/standalone directory

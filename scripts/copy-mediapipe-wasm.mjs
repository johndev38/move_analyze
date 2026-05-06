// Copie les fichiers wasm de @mediapipe/tasks-vision dans public/mediapipe/wasm
// pour qu'ils soient servis en local (le CDN jsDelivr peut renvoyer des 404
// selon la version).
import { mkdirSync, copyFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
const dst = join(root, 'public', 'mediapipe', 'wasm');

if (!existsSync(src)) {
  console.warn(`[copy-mediapipe-wasm] Source absente: ${src}`);
  console.warn('[copy-mediapipe-wasm] Lancez "npm install" d\'abord.');
  process.exit(0);
}

mkdirSync(dst, { recursive: true });

const files = readdirSync(src);
let copied = 0;
for (const f of files) {
  copyFileSync(join(src, f), join(dst, f));
  copied++;
}
console.log(`[copy-mediapipe-wasm] ${copied} fichier(s) copié(s) vers ${dst}`);

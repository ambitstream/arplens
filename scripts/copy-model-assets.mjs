/**
 * Copies the Basic Pitch model and the TensorFlow.js WASM binaries
 * from node_modules into public/ so they are served from our own
 * origin — no CDN at runtime (deterministic, offline-capable, and
 * CSP-friendly). Runs on postinstall; the target directories are
 * gitignored.
 */
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const modelSource = join(root, 'node_modules', '@spotify', 'basic-pitch', 'model');
const modelTarget = join(root, 'public', 'models', 'basic-pitch');
mkdirSync(modelTarget, { recursive: true });
cpSync(modelSource, modelTarget, { recursive: true });

const wasmSource = join(root, 'node_modules', '@tensorflow', 'tfjs-backend-wasm', 'dist');
const wasmTarget = join(root, 'public', 'tfjs-wasm');
mkdirSync(wasmTarget, { recursive: true });
for (const file of readdirSync(wasmSource)) {
  if (file.endsWith('.wasm')) {
    cpSync(join(wasmSource, file), join(wasmTarget, file));
  }
}

console.log('Copied Basic Pitch model and TF.js WASM binaries into public/.');

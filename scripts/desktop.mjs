import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Keep downloaded Rust crates, bundler tools and temporary build files in the project.
const root = resolve(import.meta.dirname, '..');
const cache = resolve(root, '.cache');
const temp = resolve(cache, 'tmp');
mkdirSync(temp, { recursive: true });
const env = {
  ...process.env,
  CARGO_HOME: resolve(cache, 'cargo'),
  TEMP: temp,
  TMP: temp,
  CARGO_BUILD_JOBS: '2',
};
const args = process.argv.slice(2);
if (args[0] === 'verify') {
  env.MYLIBRARY_DATA_DIR = resolve(root, '.cache', 'verification-library');
  env.WEBVIEW2_USER_DATA_FOLDER = resolve(root, '.cache', 'webview-verification');
  args[0] = 'dev';
}
const child = spawn(
  process.execPath,
  [resolve(root, 'node_modules/@tauri-apps/cli/tauri.js'), ...args],
  { cwd: root, env, stdio: 'inherit' },
);
child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

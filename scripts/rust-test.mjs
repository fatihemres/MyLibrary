import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const temp = resolve(root, '.cache/tmp');
mkdirSync(temp, { recursive: true });
const child = spawn('cargo', ['test', '--manifest-path', 'src-tauri/Cargo.toml', '--jobs', '2'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, CARGO_HOME: resolve(root, '.cache/cargo'), TEMP: temp, TMP: temp },
});
child.on('exit', (code) => process.exit(code ?? 1));
child.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});

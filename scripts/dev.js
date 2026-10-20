// Starts the API (4000) and the React app (5173) together
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const apps = [
  { name: 'api', dir: 'server', color: '\x1b[33m' },
  { name: 'web', dir: 'client', color: '\x1b[36m' },
];

const children = apps.map(({ name, dir, color }) => {
  // shell: true lets Windows find npm.cmd
  const child = spawn('npm', ['run', 'dev'], { cwd: path.join(root, dir), shell: true, env: process.env });
  const prefix = `${color}[${name}]\x1b[0m `;
  const forward = (stream, target) =>
    stream.on('data', (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) if (line.trim()) target.write(prefix + line + '\n');
    });
  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);
  child.on('exit', (code) => {
    console.log(`${prefix}stopped (exit code ${code})`);
    shutdown();
  });
  return child;
});

let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill();
  setTimeout(() => process.exit(0), 300);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('\nGame Shop is starting. Open http://localhost:5173 in Chrome or Edge.\n');

import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { dev } from 'astro';

// Keep Astro's live reload and the contact API on a single browser origin.
// The normal dev form uses the verified email binding. Preview is explicitly opt-in.
const { values } = parseArgs({ options: {
  port: { type: 'string', default: '4321' },
  'preview-email': { type: 'boolean', default: false },
} });
const api = spawn(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js', 'dev', '--ip', '127.0.0.1', '--port', '8788',
  '--assets', 'public',
  ...(values['preview-email'] ? ['--local', '--var', 'CONTACT_MODE:preview'] : []),
], { stdio: 'inherit' });
let server;
let stopping = false;
async function stop(code) {
  if (stopping) return;
  stopping = true;
  if (api.exitCode === null) api.kill('SIGTERM');
  await server?.stop();
  process.exitCode = code;
}
api.on('error', error => { console.error(error.message); void stop(1); });
api.on('exit', (code, signal) => { if (!stopping) void stop(code ?? (signal ? 1 : 0)); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
try {
  server = await dev({ server: { host: '127.0.0.1', port: Number(values.port) } });
  if (stopping) await server.stop();
} catch (error) {
  console.error(error.message);
  await stop(1);
}

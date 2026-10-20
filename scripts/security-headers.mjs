import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
const html = await readFile(new URL('index.html', output), 'utf8');
const template = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');

// Hash the actual emitted inline scripts, including Astro's bundled main script.
// Regenerate after every build so code changes cannot leave stale CSP hashes.
const scriptHashes = new Set();
for (const [, attributes, content] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
  if (/\bsrc\s*=/i.test(attributes) || !content.trim()) continue;
  scriptHashes.add(`'sha256-${createHash('sha256').update(content).digest('base64')}'`);
}

const policy = [
  "default-src 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
  // No unsafe-inline, unsafe-eval, or broad https: script permission.
  `script-src 'self' ${[...scriptHashes].join(' ')} https://maps.googleapis.com https://maps.gstatic.com https://static.cloudflareinsights.com`,
  "script-src-attr 'none'",
  // Inline CSS is needed for responsive image styles, reveal delays, and zoom.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://*.googleapis.com https://*.gstatic.com https://*.googleusercontent.com https://*.ggpht.com https://*.google.com",
  "connect-src 'self' https://*.googleapis.com https://*.gstatic.com https://*.google.com https://cloudflareinsights.com",
  "frame-src https://*.google.com",
  "worker-src 'self' blob:",
  "require-trusted-types-for 'script'",
  'upgrade-insecure-requests',
].join('; ');

// Workers limits each _headers line to 2,000 characters.
const header = `  Content-Security-Policy: ${policy}`;
if (header.length > 2000) throw new Error('CSP exceeds the Cloudflare header-line limit');
if (!/^\/\*\s*$/m.test(template)) throw new Error('Missing global header rule');
const headers = template.replace(/^\/\*\s*$/m, `/*\n${header}`);
await writeFile(new URL('_headers', output), headers);
console.log(`Generated security headers with ${scriptHashes.size} inline-script hashes.`);

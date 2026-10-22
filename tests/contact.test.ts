import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contactEmail } from '../src/data/contact.ts';
import { handleContact, type ContactEnv, type EnquiryEmail } from '../worker/contact.ts';

const valid = {
  name: 'Test Customer', email: 'customer@example.com', company: 'Test company',
  phone: '403-555-0100', service: 'Heat pumps', message: 'Please contact me about installation.', website: '',
};

test('the server recipient and Cloudflare binding match the public contact email', async () => {
  const raw = await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
  const config = JSON.parse(raw.replace(/^\s*\/\/.*$/gm, ''));
  assert.equal(config.send_email.find((binding: { name: string }) => binding.name === 'EMAIL').destination_address, contactEmail);
});
function request(data: unknown = valid, headers: Record<string, string> = {}) {
  return new Request('https://17mechanical.ca/api/contact', {
    method: 'POST', headers: {
      Origin: 'https://17mechanical.ca', 'Content-Type': 'application/json',
      'CF-Connecting-IP': '192.0.2.1', ...headers,
    }, body: typeof data === 'string' ? data : JSON.stringify(data),
  });
}
function environment() {
  const sent: EnquiryEmail[] = [];
  const env: ContactEnv = {
    EMAIL: { async send(message) { sent.push(message); return { messageId: 'test-only' }; } },
    CONTACT_RATE_LIMIT: { async limit() { return { success: true }; } },
  };
  return { env, sent };
}

test('delivers all fields to the fixed inbox and uses visitor only as Reply-To', async () => {
  const { env, sent } = environment();
  const response = await handleContact(request({ ...valid, to: 'attacker@example.com', from: valid.email }), env);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, '17hvac@gmail.com');
  assert.equal(sent[0].from.email, 'website@17mechanical.ca');
  assert.equal(sent[0].replyTo.email, valid.email);
  for (const field of ['name', 'email', 'company', 'phone', 'service', 'message'] as const) {
    assert.ok(sent[0].text.includes(valid[field]));
  }
});

test('success waits for the email service rather than merely accepting the form', async () => {
  const { env } = environment();
  let release!: () => void;
  env.EMAIL = { send: () => new Promise(resolve => { release = () => resolve({}); }) };
  let completed = false;
  const result = handleContact(request(), env).then(response => { completed = true; return response; });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert.equal(completed, false);
  release();
  assert.equal((await (await result).json()).ok, true);
});

test('rejects invalid data, header injection, unknown services and spam without sending', async () => {
  const cases = [
    { ...valid, name: ' ' }, { ...valid, email: 'invalid' }, { ...valid, message: '' },
    { ...valid, service: 'Invented service' }, { ...valid, name: 'A\r\nBcc: person@example.com' },
    { ...valid, email: 'a@example.com\nX-Test: injected' }, { ...valid, website: 'bot.example' },
    { ...valid, message: 'x'.repeat(4001) }, { ...valid, name: 123 }, null, [], '{invalid',
  ];
  for (const data of cases) {
    const { env, sent } = environment();
    const response = await handleContact(request(data), env);
    assert.equal(response.status, 400);
    assert.equal(sent.length, 0);
  }
});

test('Unicode and multiline project details survive delivery', async () => {
  const { env, sent } = environment();
  const message = 'Потрібен тепловий насос.\nSecond line — café.';
  assert.equal((await handleContact(request({ ...valid, name: 'Руслан', message }), env)).status, 200);
  assert.ok(sent[0].text.includes(message));
});

test('rejects oversized bodies even without Content-Length', async () => {
  const { env, sent } = environment();
  assert.equal((await handleContact(request({ ...valid, message: 'x'.repeat(17000) }), env)).status, 413);
  assert.equal(sent.length, 0);
});

test('rejects foreign origins, unsupported content types and GET', async () => {
  const { env, sent } = environment();
  assert.equal((await handleContact(request(valid, { Origin: 'https://other.example' }), env)).status, 403);
  assert.equal((await handleContact(request(valid, { 'Content-Type': 'text/plain' }), env)).status, 415);
  assert.equal((await handleContact(new Request('https://17mechanical.ca/api/contact'), env)).status, 405);
  assert.equal(sent.length, 0);
});

test('rate limiting blocks delivery with retry information', async () => {
  const { env, sent } = environment();
  env.CONTACT_RATE_LIMIT = { async limit() { return { success: false }; } };
  const response = await handleContact(request(), env);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '60');
  assert.equal(sent.length, 0);
});

test('provider failure and missing bindings never report success or expose provider errors', async () => {
  const { env } = environment();
  env.EMAIL = { async send() { throw Object.assign(new Error('Private provider diagnostic'), { code: 'E_SENDER_NOT_VERIFIED' }); } };
  for (const config of [env, {}, { EMAIL: env.EMAIL }]) {
    const response = await handleContact(request(), config);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.ok(!body.message.includes('Private'));
  }
});

test('local simulation explicitly reports that no email was sent', async () => {
  const { env, sent } = environment();
  env.CONTACT_MODE = 'preview';
  const response = await handleContact(request(), env);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.ok, false);
  assert.equal(body.preview, true);
  assert.match(body.message, /no email was sent/);
  assert.equal(sent.length, 0);
});

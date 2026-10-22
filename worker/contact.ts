import { contactEmail } from '../src/data/contact.ts';

export const CONTACT_RECIPIENT = contactEmail;
export const CONTACT_SENDER = 'website@17mechanical.ca';
export const enquiryServices = [
  'Heating', 'Ventilation & air quality', 'Air conditioning', 'Commercial refrigeration',
  'Heat pumps', 'Preventative maintenance', 'New installation / other',
] as const;

export interface EnquiryEmail {
  to: string;
  from: { email: string; name: string };
  replyTo: { email: string; name: string };
  subject: string;
  text: string;
}

export interface ContactEnv {
  EMAIL?: { send(message: EnquiryEmail): Promise<unknown> };
  CONTACT_RATE_LIMIT?: { limit(options: { key: string }): Promise<{ success: boolean }> };
  // Set only by the local dev command. Local simulation must never claim delivery.
  CONTACT_MODE?: string;
}

const fallback = `Your request could not be sent. Please try again or email ${contactEmail} directly.`;
const maxBytes = 16_384;

function json(status: number, body: Record<string, unknown>, extra: Record<string, string> = {}) {
  return Response.json(body, { status, headers: {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
    ...extra,
  } });
}

export async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return json(405, { ok: false, message: 'Please submit the enquiry form.' }, { Allow: 'POST' });
  }
  // Browsers must submit from this site. Do not enable a public CORS mail relay.
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return json(403, { ok: false, message: 'Please submit your request from this website.' });
  }
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    return json(415, { ok: false, message: 'Unsupported form submission.' });
  }
  if (Number(request.headers.get('Content-Length')) > maxBytes) {
    return json(413, { ok: false, message: 'Your request is too long. Please shorten the project details.' });
  }

  let data: Record<string, unknown>;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error('Missing body');
    let bytes = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return json(413, { ok: false, message: 'Your request is too long. Please shorten the project details.' });
      }
      chunks.push(value);
    }
    const body = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
    const parsed: unknown = JSON.parse(new TextDecoder().decode(body));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid body');
    data = parsed as Record<string, unknown>;
  } catch {
    return json(400, { ok: false, message: 'Please check your form and try again.' });
  }

  if (data.website) return json(400, { ok: false, message: 'Please check your form and try again.' });
  const limits = { name: 100, email: 254, company: 120, phone: 35, service: 80, message: 4000 };
  const values: Record<string, string> = {};
  for (const [key, limit] of Object.entries(limits)) {
    if (data[key] != null && typeof data[key] !== 'string') {
      return json(400, { ok: false, message: 'Please check your form and try again.' });
    }
    const value = ((data[key] as string | undefined) || '').trim();
    if (value.length > limit || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)
      || (key !== 'message' && /[\r\n]/.test(value))) {
      return json(400, { ok: false, message: 'Please check your form and try again.' });
    }
    values[key] = value;
  }
  if (!values.name || !values.message || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(values.email)
    || !enquiryServices.some(service => service === values.service)) {
    return json(400, { ok: false, message: 'Please enter your name, a valid email, service and project details.' });
  }

  try {
    if (env.CONTACT_MODE !== 'preview') {
      if (!env.EMAIL || !env.CONTACT_RATE_LIMIT) return json(503, { ok: false, message: fallback });
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return json(503, { ok: false, message: fallback });
      const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: ip });
      if (!success) return json(429, {
        ok: false, message: 'Too many requests. Please wait a minute and try again.',
      }, { 'Retry-After': '60' });
    }

    const email: EnquiryEmail = {
      to: CONTACT_RECIPIENT,
      from: { email: CONTACT_SENDER, name: '17 Mechanical website' },
      replyTo: { email: values.email, name: values.name },
      subject: `Website enquiry: ${values.service}`,
      text: [
        'New enquiry from 17mechanical.ca', '',
        `Name: ${values.name}`, `Email: ${values.email}`,
        `Company: ${values.company || 'Not provided'}`, `Phone: ${values.phone || 'Not provided'}`,
        `Service: ${values.service}`, '', 'Project details:', values.message,
      ].join('\n'),
    };
    if (env.CONTACT_MODE === 'preview') {
      // Never call a mail binding in preview, even if it was configured remotely.
      return json(200, { ok: false, preview: true, message: 'Local preview only — no email was sent.' });
    }
    await env.EMAIL!.send(email);
    return json(200, { ok: true, message: 'Thank you! Your enquiry has been sent. We will get back to you soon.' });
  } catch (error) {
    // Never log customer names, addresses, project details or provider error messages.
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNAVAILABLE';
    console.error('Contact email delivery failed', /^[A-Z_]+$/.test(code) ? code : 'UNAVAILABLE');
    return json(503, { ok: false, message: fallback });
  }
}

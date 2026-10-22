import { handleContact, type ContactEnv } from './contact';

export default {
  async fetch(request: Request, env: ContactEnv): Promise<Response> {
    if (new URL(request.url).pathname === '/api/contact') return handleContact(request, env);
    return new Response('Not found', { status: 404 });
  },
};

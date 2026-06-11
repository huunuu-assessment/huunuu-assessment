import { getStore } from '@netlify/blobs';

const ADMIN_PASS = 'ADMIN_PASSWORD140890';

export default async (req) => {
  const store = getStore('users');
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') return new Response('', { headers: cors });

  try {
    // GET a single user record
    if (action === 'get' && req.method === 'GET') {
      const email = url.searchParams.get('email')?.toLowerCase();
      if (!email) return new Response(JSON.stringify({ error: 'No email' }), { status: 400, headers: cors });
      const raw = await store.get(email);
      if (!raw) return new Response(JSON.stringify({ exists: false }), { headers: cors });
      return new Response(JSON.stringify({ exists: true, data: JSON.parse(raw) }), { headers: cors });
    }

    // POST to save a user record (admin or system)
    if (action === 'set' && req.method === 'POST') {
      const body = await req.json();
      const { email, data, adminPass } = body;
      if (!email) return new Response(JSON.stringify({ error: 'No email' }), { status: 400, headers: cors });
      // Writes from admin panel require password; writes from assessment logic do not need it
      if (adminPass && adminPass !== ADMIN_PASS) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      }
      await store.set(email.toLowerCase(), JSON.stringify(data));
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }

    // POST to add a new approved email (admin only)
    if (action === 'add' && req.method === 'POST') {
      const body = await req.json();
      const { email, adminPass } = body;
      if (adminPass !== ADMIN_PASS) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const existing = await store.get(email.toLowerCase());
      if (existing) return new Response(JSON.stringify({ error: 'Already exists' }), { headers: cors });
      await store.set(email.toLowerCase(), JSON.stringify({ attempts: 0 }));
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }

    // POST to delete a user (admin only)
    if (action === 'delete' && req.method === 'POST') {
      const body = await req.json();
      const { email, adminPass } = body;
      if (adminPass !== ADMIN_PASS) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      await store.delete(email.toLowerCase());
      return new Response(JSON.stringify({ ok: true }), { headers: cors });
    }

    // GET all users (admin only)
    if (action === 'list' && req.method === 'GET') {
      const adminPass = url.searchParams.get('adminPass');
      if (adminPass !== ADMIN_PASS) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: cors });
      const { blobs } = await store.list();
      const users = {};
      await Promise.all(blobs.map(async (b) => {
        const raw = await store.get(b.key);
        if (raw) users[b.key] = JSON.parse(raw);
      }));
      return new Response(JSON.stringify(users), { headers: cors });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: cors });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cors });
  }
};

export const config = { path: '/api/store' };

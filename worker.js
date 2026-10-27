// Shared palette belt: /api/palettes is backed by one SQLite Durable Object, everything else is a static asset.
import { DurableObject } from 'cloudflare:workers';

const HEX = /^#[0-9A-F]{6}$/;
const MAX = 300;

export class Paletas extends DurableObject {
  async list() {
    const m = await this.ctx.storage.list({ prefix: 'p:' });
    const order = (await this.ctx.storage.get('order')) || [];
    const rank = (p) => { const i = order.indexOf(p.id); return i < 0 ? order.length : i; };
    return Array.from(m.values()).sort((a, b) => rank(a) - rank(b));
  }
  async setOrder(ids) {
    await this.ctx.storage.put('order', ids);
  }
  async put(p) {
    const n = (await this.ctx.storage.list({ prefix: 'p:' })).size;
    if (n >= MAX && !(await this.ctx.storage.get('p:' + p.id))) return false;
    await this.ctx.storage.put('p:' + p.id, p);
    return true;
  }
  async remove(id) {
    return this.ctx.storage.delete('p:' + id);
  }
}

function clean(body, id) {
  if (!body || typeof body !== 'object' || !body.c || typeof body.c !== 'object') return null;
  const hexes = (o) => {
    const out = {};
    for (const [k, v] of Object.entries(o || {}).slice(0, 40)) {
      const h = String(v).toUpperCase();
      if (/^[a-zA-Z0-9]{1,20}$/.test(k) && HEX.test(h)) out[k] = h;
    }
    return out;
  };
  const c = hexes(body.c);
  if (Object.keys(c).length < 4) return null;
  return {
    id,
    name: String(body.name || 'Sem nome').slice(0, 40),
    by: String(body.by || '').slice(0, 30),
    favorite: body.favorite === true,
    c,
    o: hexes(body.o),
    s: hexes(body.s),
    d: hexes(body.d),
    at: Date.now()
  };
}

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/palettes')) return env.ASSETS.fetch(request);

    const store = env.PALETAS.get(env.PALETAS.idFromName('esteira'));
    if (url.pathname === '/api/palettes/order') {
      if (request.method !== 'PUT') return json({ error: 'método' }, 405);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'json' }, 400); }
      const ids = (Array.isArray(body && body.ids) ? body.ids : []).filter((x) => typeof x === 'string' && /^[a-z0-9]{4,32}$/.test(x)).slice(0, MAX);
      await store.setOrder(ids);
      return json({ ok: true });
    }
    const id = decodeURIComponent(url.pathname.slice('/api/palettes'.length).replace(/^\//, ''));
    if (id && !/^[a-z0-9]{4,32}$/.test(id)) return json({ error: 'id' }, 400);

    if (request.method === 'GET' && !id) return json(await store.list());
    if ((request.method === 'POST' && !id) || (request.method === 'PUT' && id)) {
      if (Number(request.headers.get('content-length') || 0) > 8000) return json({ error: 'grande' }, 413);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'json' }, 400); }
      const p = clean(body, id || 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
      if (!p) return json({ error: 'paleta' }, 400);
      if (!(await store.put(p))) return json({ error: 'cheia' }, 409);
      return json(p, id ? 200 : 201);
    }
    if (request.method === 'DELETE' && id) return json({ ok: await store.remove(id) });
    return json({ error: 'método' }, 405);
  }
};

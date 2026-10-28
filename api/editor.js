import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { parse, stringify } from 'yaml';

const origin = 'https://opscards.vercel.app';
const repo = 'Seranov67/project';
const ownerId = 65553795;
const cookieName = '__Host-opscards_session';
const stateName = '__Host-opscards_oauth';
const options = 'Path=/; HttpOnly; Secure; SameSite=Lax';
const headers = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'OpsCards-Editor' };

function cookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((c) => c.trim().split(/=(.*)/s).slice(0, 2)).filter(([k, v]) => k && v));
}
function key() {
  const secret = process.env.EDITOR_SESSION_SECRET || '';
  if (Buffer.byteLength(secret) < 32) throw new Error('EDITOR_SESSION_SECRET must be at least 32 bytes');
  return createHash('sha256').update(secret).digest();
}
function seal(value) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url');
}
function unseal(value) {
  try {
    const data = Buffer.from(value, 'base64url');
    const cipher = createDecipheriv('aes-256-gcm', key(), data.subarray(0, 12));
    cipher.setAuthTag(data.subarray(12, 28));
    return JSON.parse(Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString());
  } catch { return null; }
}
function send(res, status, body) { res.status(status).json(body); }
async function github(path, token, init = {}) {
  return fetch(`https://api.github.com${path}`, { ...init, headers: { ...headers, Authorization: `Bearer ${token}`, ...init.headers } });
}
function session(req) {
  const data = unseal(cookies(req)[cookieName] || '');
  return data?.token && data.id === ownerId && data.exp > Date.now() ? data : null;
}
function redirect(res, location) { res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' }); res.end(); }
function validOrigin(req) { return req.headers.origin === origin; }
function parseCard(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error('Не знайдено заголовок картки.');
  const data = parse(match[1]);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Некоректний заголовок картки.');
  return { data, body: match[2] };
}
function validate(data, body) {
  const categories = ['linux', 'services', 'containers', 'network', 'git', 'operations', 'windows'];
  if (typeof data.title !== 'string' || !data.title.trim() || typeof data.description !== 'string' || !data.description.trim()) throw new Error('Вкажіть назву та опис.');
  if (!categories.includes(data.category) || !Array.isArray(data.platforms) || !data.platforms.length || data.platforms.some((p) => !['linux', 'windows', 'macos'].includes(p))) throw new Error('Вкажіть категорію та платформу.');
  if (data.quickCmd !== undefined && typeof data.quickCmd !== 'string') throw new Error('Команда має бути текстом.');
  const text = stringify(data) + body;
  const privateData = [/\b(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/i, /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.local\b/i, /\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i, /\b(?:--pass(?:word)?|ansible_(?:ssh_)?pass(?:word)?)\s*(?:=|\s+)\s*\S+/i];
  if (privateData.some((pattern) => pattern.test(text))) throw new Error('Текст містить можливу внутрішню адресу, MAC або пароль.');
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    const action = String(req.query.action || '');
    if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET || !process.env.EDITOR_SESSION_SECRET) return send(res, 503, { error: 'Редактор ще не налаштований власником сайту.' });
    if (action === 'login' && req.method === 'GET') {
      const state = randomBytes(32).toString('base64url');
      const verifier = randomBytes(32).toString('base64url');
      const challenge = createHash('sha256').update(verifier).digest('base64url');
      res.setHeader('Set-Cookie', `${stateName}=${seal({ state, verifier, exp: Date.now() + 600000 })}; ${options}; Max-Age=600`);
      const url = new URL('https://github.com/login/oauth/authorize');
      for (const [k, v] of Object.entries({ client_id: process.env.GITHUB_CLIENT_ID, redirect_uri: `${origin}/api/editor?action=callback`, state, code_challenge: challenge, code_challenge_method: 'S256' })) url.searchParams.set(k, v);
      return redirect(res, url.toString());
    }
    if (action === 'callback' && req.method === 'GET') {
      const saved = unseal(cookies(req)[stateName] || '');
      res.setHeader('Set-Cookie', `${stateName}=; ${options}; Max-Age=0`);
      const received = String(req.query.state || '');
      if (!saved?.state || saved.exp < Date.now() || received.length !== saved.state.length || !timingSafeEqual(Buffer.from(received), Buffer.from(saved.state)) || typeof req.query.code !== 'string') return redirect(res, '/admin?error=login');
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code: req.query.code, redirect_uri: `${origin}/api/editor?action=callback`, code_verifier: saved.verifier }) });
      const token = (await tokenResponse.json()).access_token;
      if (!token) return redirect(res, '/admin?error=login');
      const userResponse = await github('/user', token);
      const user = await userResponse.json();
      if (!userResponse.ok || user.id !== ownerId) return redirect(res, '/admin?error=access');
      res.setHeader('Set-Cookie', [`${stateName}=; ${options}; Max-Age=0`, `${cookieName}=${seal({ token, id: user.id, exp: Date.now() + 3600000 })}; ${options}; Max-Age=3600`]);
      return redirect(res, '/admin');
    }
    const auth = session(req);
    if (!auth) return send(res, 401, { error: 'Увійдіть через GitHub.' });
    if (req.method !== 'GET' && !validOrigin(req)) return send(res, 403, { error: 'Недопустиме джерело запиту.' });
    if (action === 'logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', `${cookieName}=; ${options}; Max-Age=0`);
      return send(res, 200, { ok: true });
    }
    if (action === 'session' && req.method === 'GET') return send(res, 200, { login: 'Seranov67' });
    const slug = String(req.query.slug || '');
    const base = `/repos/${repo}/contents/src/content/cheatsheets`;
    if (action === 'list' && req.method === 'GET') {
      const response = await github(`${base}?ref=main`, auth.token);
      if (!response.ok) return send(res, 502, { error: 'GitHub не надав доступ до карток.' });
      const files = await response.json();
      return send(res, 200, { cards: files.filter((f) => f.type === 'file' && /^[a-z0-9-]+\.md$/.test(f.name)).map((f) => ({ slug: f.name.slice(0, -3) })) });
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return send(res, 400, { error: 'Некоректна адреса картки.' });
    if (action === 'card' && req.method === 'GET') {
      const response = await github(`${base}/${slug}.md?ref=main`, auth.token);
      if (!response.ok) return send(res, response.status === 404 ? 404 : 502, { error: 'Не вдалося відкрити картку.' });
      const file = await response.json();
      const { data, body } = parseCard(Buffer.from(file.content, 'base64').toString('utf8'));
      return send(res, 200, { data, body, sha: file.sha });
    }
    if (action === 'card' && req.method === 'POST') {
      const { title, description, category, platforms, quickCmd, body, sha, create } = req.body || {};
      if (typeof body !== 'string' || body.length > 50000 || typeof title !== 'string' || typeof description !== 'string' || typeof quickCmd !== 'string' || title.length > 200 || description.length > 1000 || quickCmd.length > 2000) return send(res, 400, { error: 'Перевірте довжину й формат полів.' });
      const existing = await github(`${base}/${slug}.md?ref=main`, auth.token);
      let data = {};
      if (create === true) {
        if (existing.ok) return send(res, 409, { error: 'Картка з такою адресою вже існує.' });
        if (existing.status !== 404) return send(res, 502, { error: 'Не вдалося перевірити адресу в GitHub.' });
      } else {
        if (!existing.ok) return send(res, 404, { error: 'Картку не знайдено.' });
        const file = await existing.json();
        if (!sha || sha !== file.sha) return send(res, 409, { error: 'Картка змінилася. Відкрийте її знову, щоб не перезаписати зміни.' });
        data = parseCard(Buffer.from(file.content, 'base64').toString('utf8')).data;
      }
      Object.assign(data, { title: title.trim(), description: description.trim(), category, platforms });
      if (quickCmd.trim()) data.quickCmd = quickCmd.trim(); else delete data.quickCmd;
      try { validate(data, body); } catch (error) { return send(res, 400, { error: error.message }); }
      const content = `---\n${stringify(data)}---\n${body}`;
      const payload = { message: `${create ? 'docs: add' : 'docs: update'} ${slug} via OpsCards`, content: Buffer.from(content).toString('base64'), branch: 'main', ...(create ? {} : { sha }) };
      const response = await github(`${base}/${slug}.md`, auth.token, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) return send(res, response.status === 409 || response.status === 422 ? 409 : 502, { error: 'GitHub не зберіг картку. Перевірте доступ застосунку або повторіть спробу.' });
      return send(res, 200, { ok: true });
    }
    return send(res, 404, { error: 'Запит не знайдено.' });
  } catch (error) {
    console.error('Editor error:', error.message);
    return send(res, 500, { error: 'Не вдалося виконати запит. Перевірте налаштування редактора.' });
  }
}

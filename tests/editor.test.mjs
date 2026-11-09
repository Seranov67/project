import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/editor.js';

process.env.GITHUB_CLIENT_ID = 'test-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.EDITOR_SESSION_SECRET = 'x'.repeat(40);
const originalFetch = globalThis.fetch;
after(() => { globalThis.fetch = originalFetch; });

function response() {
  return { headers: {}, statusCode: 200, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; }, writeHead(code, headers) { this.statusCode = code; Object.assign(this.headers, headers); }, end() {} };
}
async function call(action, method = 'GET', cookie = '', extra = {}) {
  const res = response();
  await handler({ query: { action, ...extra.query }, method, headers: { cookie, ...extra.headers }, body: extra.body }, res);
  return res;
}
function cookieOf(header, name) {
  const values = Array.isArray(header) ? header : [header];
  return values.find((value) => value.startsWith(`${name}=`))?.split(';')[0];
}

test('authentication rejects invalid state, wrong user, cross-origin writes and stale edits', async () => {
  let login = await call('login');
  assert.equal(login.statusCode, 302);
  const state = new URL(login.headers.Location).searchParams.get('state');
  const oauthCookie = cookieOf(login.headers['Set-Cookie'], '__Host-opscards_oauth');
  let callback = await call('callback', 'GET', oauthCookie, { query: { state: 'invalid', code: 'code' } });
  assert.equal(callback.headers.Location, '/admin?error=login');
  globalThis.fetch = async (url) => url === 'https://github.com/login/oauth/access_token'
    ? new Response(JSON.stringify({ access_token: 'token' }), { status: 200 })
    : new Response(JSON.stringify({ id: 1 }), { status: 200 });
  callback = await call('callback', 'GET', oauthCookie, { query: { state, code: 'code' } });
  assert.equal(callback.headers.Location, '/admin?error=access');
  login = await call('login');
  const state2 = new URL(login.headers.Location).searchParams.get('state');
  globalThis.fetch = async (url) => url === 'https://github.com/login/oauth/access_token'
    ? new Response(JSON.stringify({ access_token: 'token' }), { status: 200 })
    : new Response(JSON.stringify({ id: 65553795 }), { status: 200 });
  callback = await call('callback', 'GET', cookieOf(login.headers['Set-Cookie'], '__Host-opscards_oauth'), { query: { state: state2, code: 'code' } });
  const cookie = cookieOf(callback.headers['Set-Cookie'], '__Host-opscards_session');
  assert.ok(cookie && !cookie.includes('token'));
  assert.equal((await call('session', 'GET', cookie)).body.login, 'Seranov67');
  assert.equal((await call('logout', 'POST', cookie, { headers: { origin: 'https://evil.example' } })).statusCode, 403);
  globalThis.fetch = async () => new Response(JSON.stringify({ sha: 'new-sha', content: Buffer.from('---\ntitle: Old\ndescription: Old\ncategory: linux\nplatforms: [linux]\n---\n').toString('base64') }), { status: 200 });
  const stale = await call('card', 'POST', cookie, { query: { slug: 'test' }, headers: { origin: 'https://opscards.vercel.app' }, body: { title: 'New', description: 'Description', category: 'linux', platforms: ['linux'], quickCmd: 'pwd', body: '', sha: 'old-sha' } });
  assert.equal(stale.statusCode, 409);
  let saved;
  globalThis.fetch = async (_url, init = {}) => {
    if (init.method === 'PUT') {
      saved = JSON.parse(init.body);
      return new Response(JSON.stringify({ content: { sha: 'saved-sha' }, commit: { sha: 'commit-sha' } }), { status: 200 });
    }
    return new Response(JSON.stringify({ sha: 'new-sha', content: Buffer.from('---\ntitle: Old\ndescription: Old\ncategory: linux\nplatforms: [linux]\ntags: [ssh]\nsources:\n  - label: Docs\n    url: https://example.com\n---\nOld body').toString('base64') }), { status: 200 });
  };
  const updated = await call('card', 'POST', cookie, { query: { slug: 'test' }, headers: { origin: 'https://opscards.vercel.app' }, body: { title: 'New', description: 'Description', category: 'linux', platforms: ['linux'], quickCmd: 'pwd', body: 'New body', sha: 'new-sha' } });
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.body.sha, 'saved-sha');
  assert.equal(updated.body.commit, 'commit-sha');
  const savedContent = Buffer.from(saved.content, 'base64').toString();
  assert.match(savedContent, /tags:\s*\n\s*- ssh/);
  assert.match(savedContent, /https:\/\/example.com/);
  assert.match(savedContent, /New body/);
  assert.equal(saved.sha, 'new-sha');
  assert.equal((await call('session')).statusCode, 401);
});

test('notebook writes reuse owner login, protect stale revisions and persist symptoms', async () => {
  const login = await call('login', 'GET', '', { query: { next: 'notebook' } });
  const state = new URL(login.headers.Location).searchParams.get('state');
  globalThis.fetch = async (url) => url === 'https://github.com/login/oauth/access_token'
    ? new Response(JSON.stringify({ access_token: 'token' }))
    : new Response(JSON.stringify({ id: 65553795 }));
  const callback = await call('callback', 'GET', cookieOf(login.headers['Set-Cookie'], '__Host-opscards_oauth'), { query: { state, code: 'code' } });
  assert.equal(callback.headers.Location, '/');
  const cookie = cookieOf(callback.headers['Set-Cookie'], '__Host-opscards_session');
  const note = {
    id: 'linux-dns-wireguard--0', title: 'DNS', book: 'network', command: 'resolvectl status',
    description: 'DNS check', originId: 'linux-dns-wireguard', originTitle: 'DNS',
    platforms: ['linux'], lang: 'bash', tags: ['dns'], sources: [], symptoms: ['домен не відкривається'],
  };
  const options = { query: { slug: note.id }, headers: { origin: 'https://opscards.vercel.app' } };
  const post = (body, overrides = {}) => call('notebook-note', 'POST', cookie, { ...options, body, ...overrides });
  assert.equal((await call('notebook-note', 'POST', '', { ...options, body: { note, revision: '' } })).statusCode, 401);
  assert.equal((await post({ note, revision: '' }, { headers: { origin: 'https://evil.example' } })).statusCode, 403);
  assert.equal((await post({ note: { ...note, symptoms: ['10.123.23.10'] }, revision: '' })).statusCode, 400);
  assert.equal((await post({ note: { ...note, symptoms: ['a\nb'] }, revision: '' })).statusCode, 400);
  let currentRevision = '';
  let written;
  globalThis.fetch = async (url, init = {}) => {
    assert.match(url, /\/src\/data\/notebook-notes\/linux-dns-wireguard--0\.json/);
    if (init.method === 'PUT') {
      written = JSON.parse(init.body);
      return new Response('{}', { status: 200 });
    }
    return currentRevision ? new Response(JSON.stringify({ sha: currentRevision })) : new Response('{}', { status: 404 });
  };
  const saved = await post({ note, revision: '' });
  assert.equal(saved.statusCode, 200);
  assert.match(saved.body.note.revision, /^[a-f0-9]{40}$/);
  assert.deepEqual(JSON.parse(Buffer.from(written.content, 'base64').toString()), note);
  assert.equal(written.branch, 'main');
  assert.ok(!Object.hasOwn(written, 'sha'));
  currentRevision = saved.body.note.revision;
  assert.equal((await post({ note, revision: '' })).statusCode, 409);
  assert.equal((await post({ note: { ...note, title: 'DNS 2' }, revision: currentRevision })).statusCode, 200);
  assert.equal(written.sha, currentRevision);
  globalThis.fetch = async (_url, init = {}) => init.method === 'PUT'
    ? new Response('{}', { status: 422 })
    : new Response(JSON.stringify({ sha: currentRevision }));
  assert.equal((await post({ note, revision: currentRevision })).statusCode, 409);
});

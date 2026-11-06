import { loadCards } from './card-search.js';
const $ = (selector) => document.querySelector(selector);
const login = $('#editor-login'), app = $('#editor-app'), message = $('#editor-message'), logout = $('#editor-logout');
const select = $('#editor-select'), form = $('#editor-form'), formTitle = $('#editor-form-title');
const draftNotice = $('#editor-draft'), dirtyLabel = $('#editor-dirty');
let sha = '', creating = true, dirty = false, loading = 0, saving = false, slugManual = false;
let currentSlug = '', pendingPublication = null, pollTimer, polls = 0;
let draftTimer;
const field = (name) => form.elements.namedItem(name);
const storageGet = (key) => { try { return sessionStorage.getItem(key); } catch { return null; } };
const storageSet = (key, value) => { try { sessionStorage.setItem(key, value); } catch {} };
const storageRemove = (key) => { try { sessionStorage.removeItem(key); } catch {} };
const draftKey = () => `opscards-draft:${currentSlug || 'new'}`;
const params = new URLSearchParams(location.search);
if (params.has('card') || params.has('new')) storageSet('opscards-editor-target', params.toString());

function values() {
  return { title: field('title').value, description: field('description').value, category: field('category').value,
    quickCmd: field('quickCmd').value, body: field('body').value, tags: field('tags').value,
    platforms: Array.from(form.querySelectorAll('[name=platform]:checked')).map((checkbox) => checkbox.value), slug: field('slug').value, sha };
}
function applyValues(data) {
  for (const name of ['title','description','category','quickCmd','body','slug']) field(name).value = data[name] ?? '';
  field('tags').value = Array.isArray(data.tags) ? data.tags.join(', ') : data.tags ?? '';
  form.querySelectorAll('[name=platform]').forEach((checkbox) => { checkbox.checked = data.platforms?.includes(checkbox.value) ?? false; });
}
function persistDraft() { if (dirty) storageSet(draftKey(), JSON.stringify(values())); }
function markDirty() { dirty = true; dirtyLabel.textContent = 'Є незбережені зміни · чернетка в цій вкладці'; clearTimeout(draftTimer); draftTimer = setTimeout(persistDraft, 250); }
function canLeave() { if (dirty) persistDraft(); return !dirty || confirm('Є незбережені зміни. Перейти до іншого запису? Чернетка залишиться в цій вкладці.'); }
function syncDraftNotice() { draftNotice.hidden = !storageGet(draftKey()); }
async function api(action, options = {}) {
  const response = await fetch(`/api/editor?${action}`, { ...options, headers: { 'Content-Type':'application/json' }, cache:'no-store' });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) { persistDraft(); login.hidden = false; }
    throw new Error(result.error || 'Не вдалося виконати запит.');
  }
  return result;
}
async function refreshList() {
  const [result, cards] = await Promise.all([api('action=list'), loadCards().catch(() => [])]);
  const names = new Map(cards.map((card) => [card.id, card.title]));
  select.replaceChildren(new Option('Оберіть картку', ''), ...result.cards.map((card) => new Option(names.get(card.slug) || card.slug, card.slug)));
}
function resetPublication() { clearTimeout(pollTimer); pendingPublication = null; $('#editor-publication').hidden = true; }
async function load(slug, guard = true) {
  if (guard && !canLeave()) { select.value = currentSlug; return; }
  const attempt = ++loading;
  if (!slug) { form.hidden = true; return; }
  resetPublication(); form.inert = true; message.textContent = 'Відкриваємо картку…';
  try {
    const result = await api(`action=card&slug=${encodeURIComponent(slug)}`);
    if (attempt !== loading) return;
    form.reset(); creating = false; currentSlug = slug; sha = result.sha;
    applyValues({ ...result.data, body: result.body, slug });
    field('slug').readOnly = true; formTitle.textContent = 'Редагувати картку'; form.hidden = false;
    dirty = false; dirtyLabel.textContent = 'Змін немає'; select.value = slug; message.textContent = '';
    storageSet('opscards-editor-target', `card=${encodeURIComponent(slug)}`); syncDraftNotice();
  } catch (error) { if (attempt === loading) message.textContent = error.message; }
  finally { if (attempt === loading) form.inert = false; }
}
function create(guard = true) {
  if (guard && !canLeave()) return;
  ++loading; resetPublication(); form.inert = false; form.reset(); creating = true; currentSlug = ''; sha = ''; slugManual = false; dirty = false;
  applyValues({ category:'linux', platforms:['linux'] }); field('slug').readOnly = false;
  select.value = ''; formTitle.textContent = 'Нова картка'; form.hidden = false; message.textContent = ''; dirtyLabel.textContent = 'Нова картка';
  storageSet('opscards-editor-target', 'new=1'); syncDraftNotice(); field('title').focus();
}
const letters = { а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ye',ж:'zh',з:'z',и:'y',і:'i',ї:'yi',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ь:'',ю:'yu',я:'ya' };
function slugify(text) { return Array.from(text.toLocaleLowerCase('uk')).map((letter) => letters[letter] ?? letter).join('').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,80).replace(/-$/,''); }
field('title').addEventListener('input', () => { if (creating && !slugManual) field('slug').value = slugify(field('title').value); });
field('slug').addEventListener('input', () => { slugManual = true; });
form.addEventListener('input', markDirty);
window.addEventListener('beforeunload', (event) => { if (!dirty) return; persistDraft(); event.preventDefault(); });
$('#editor-new').addEventListener('click', () => create());
select.addEventListener('change', () => load(select.value));
$('#editor-restore').addEventListener('click', () => {
  try { const saved = JSON.parse(storageGet(draftKey())); if (!saved) return;
    applyValues(saved); if (saved.sha) sha = saved.sha; markDirty(); draftNotice.hidden = true;
    message.textContent = 'Чернетку відновлено. Перевірте текст перед збереженням.';
  } catch { message.textContent = 'Не вдалося прочитати чернетку.'; }
});
$('#editor-discard').addEventListener('click', () => { storageRemove(draftKey()); draftNotice.hidden = true; });
async function checkPublication() {
  if (!pendingPublication) return;
  const expected = pendingPublication;
  polls++;
  try {
    const response = await fetch(`/search-index.json?publication=${expected.sha}`, { cache:'no-store' });
    if (!response.ok) throw new Error('Index unavailable');
    const index = await response.json();
    if (pendingPublication !== expected) return;
    const published = index.cards.some((card) => card.id === expected.slug && card.contentSha === expected.sha);
    if (published) {
      $('#editor-publication-message').textContent = 'Опубліковано: зміни вже є у шпаргалці.';
      $('#editor-check-publication').hidden = true; $('#editor-published-link').hidden = false;
      $('#editor-published-link').href = `/cards/${expected.slug}`; pendingPublication = null; return;
    }
  } catch { /* Keep saved content and allow the owner to retry publication checks. */ }
  if (pendingPublication !== expected) return;
  if (polls < 12) pollTimer = setTimeout(checkPublication, 10000);
  else $('#editor-publication-message').textContent = 'Збережено. Публікація ще не підтверджена; перевірте знову трохи пізніше.';
}
$('#editor-check-publication').addEventListener('click', () => { clearTimeout(pollTimer); polls = 0; checkPublication(); });
form.addEventListener('submit', async (event) => {
  event.preventDefault(); if (saving) return;
  const data = values();
  if (!data.platforms.length) { message.textContent = 'Оберіть хоча б одну платформу.'; return; }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) { $('.editor-advanced').open = true; message.textContent = 'Уточніть адресу картки латинськими літерами.'; field('slug').focus(); return; }
  saving = true; persistDraft(); form.inert = true; select.disabled = true; $('#editor-new').disabled = true; message.textContent = 'Зберігаємо картку…';
  try {
    const result = await api(`action=card&slug=${encodeURIComponent(data.slug)}`, { method:'POST', body:JSON.stringify({ ...data, create:creating }) });
    clearTimeout(draftTimer); storageRemove(draftKey()); dirty = false; currentSlug = data.slug; creating = false; sha = result.sha || (await api(`action=card&slug=${encodeURIComponent(data.slug)}`)).sha;
    field('slug').readOnly = true; formTitle.textContent = 'Редагувати картку'; draftNotice.hidden = true; dirtyLabel.textContent = 'Збережено'; message.textContent = 'Картку збережено. Очікуємо оновлення сайту.';
    storageSet('opscards-editor-target', `card=${encodeURIComponent(data.slug)}`);
    if (![...select.options].some((option) => option.value === data.slug)) select.add(new Option(data.title,data.slug));
    select.value = data.slug; select.selectedOptions[0].textContent = data.title;
    resetPublication(); pendingPublication = { slug:data.slug, sha }; polls = 0;
    $('#editor-publication').hidden = false; $('#editor-check-publication').hidden = false; $('#editor-published-link').hidden = true;
    $('#editor-publication-message').textContent = 'Збережено в GitHub. Vercel готує нову версію сайту.'; checkPublication();
  } catch (error) { message.textContent = error.message; }
  finally { saving = false; form.inert = false; select.disabled = false; $('#editor-new').disabled = false; }
});
logout.addEventListener('click', async () => { if (!canLeave()) return; try { await api('action=logout',{method:'POST'}); dirty = false; location.reload(); } catch(error) { message.textContent=error.message; } });
const error = params.get('error');
try {
  await api('action=session'); await refreshList(); app.hidden = false; logout.hidden = false; message.textContent = '';
  const target = new URLSearchParams(storageGet('opscards-editor-target') || '');
  if (target.has('new')) create(false); else if (target.get('card')) await load(target.get('card'),false);
} catch(error) { login.hidden = false; message.textContent = error.message === 'Увійдіть через GitHub.' ? '' : error.message; }
if (error) message.textContent = error === 'access' ? 'Доступ дозволено лише власнику OpsCards.' : 'Не вдалося увійти через GitHub. Спробуйте ще раз.';

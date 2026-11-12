// Shoppagina: filteren, sorteren en zoeken. De filterstatus staat in de URL,
// zodat een gefilterde pagina te delen en te bookmarken is.
import { initUI, observeReveal } from './ui.js';
import { CATEGORIES } from './config.js';
import { loadProducts, renderGrid, categoryName, colorHex, sortSizes, escapeHtml } from './products.js';

const LIST_KEYS = ['cat', 'maat', 'kleur', 'label'];
const LABELS = [
  { id: 'nieuw', naam: 'Nieuw' },
  { id: 'sale', naam: 'Sale' },
];
const SORTS = ['aanbevolen', 'nieuwste', 'prijs-op', 'prijs-af', 'naam'];

const form = document.querySelector('[data-filters]');
const results = document.querySelector('[data-results]');
const countEl = document.querySelector('[data-result-count]');
const activeEl = document.querySelector('[data-active-filters]');
const titleEl = document.querySelector('[data-shop-title]');
const toggle = document.querySelector('[data-filters-toggle]');
const toggleCount = document.querySelector('[data-filter-count]');
const sortSelect = document.getElementById('sort');

let products = [];

/* ---------- URL <-> state ---------- */

export function stateFromUrl(search = location.search) {
  const params = new URLSearchParams(search);
  const list = (key) => (params.get(key) || '').split(',').map((v) => v.trim()).filter(Boolean);
  const num = (key) => {
    const value = params.get(key);
    return value !== null && value !== '' && !Number.isNaN(Number(value)) ? Number(value) : null;
  };
  const sort = params.get('sort');
  return {
    q: params.get('q') || '',
    cat: list('cat'),
    maat: list('maat'),
    kleur: list('kleur'),
    label: list('label'),
    min: num('min'),
    max: num('max'),
    sort: SORTS.includes(sort) ? sort : 'aanbevolen',
  };
}

export function stateToSearch(state) {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  LIST_KEYS.forEach((key) => state[key].length && params.set(key, state[key].join(',')));
  if (state.min !== null) params.set('min', state.min);
  if (state.max !== null) params.set('max', state.max);
  if (state.sort !== 'aanbevolen') params.set('sort', state.sort);
  const str = params.toString().replace(/%2C/g, ','); // komma's leesbaar houden
  return str ? `?${str}` : '';
}

function stateFromForm() {
  const data = new FormData(form);
  const num = (key) => {
    const value = data.get(key);
    return value === '' || value === null || Number.isNaN(Number(value)) ? null : Math.max(0, Number(value));
  };
  return {
    q: (data.get('q') || '').trim(),
    cat: data.getAll('cat'),
    maat: data.getAll('maat'),
    kleur: data.getAll('kleur'),
    label: data.getAll('label'),
    min: num('min'),
    max: num('max'),
    sort: sortSelect.value,
  };
}

function syncForm(state) {
  form.q.value = state.q;
  form.min.value = state.min ?? '';
  form.max.value = state.max ?? '';
  sortSelect.value = state.sort;
  LIST_KEYS.forEach((key) => {
    form.querySelectorAll(`input[name="${key}"]`).forEach((input) => {
      input.checked = state[key].includes(input.value);
    });
  });
}

/* ---------- Filteren & sorteren ---------- */

const normalize = (str) => str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function applyFilters(list, state) {
  const terms = normalize(state.q).split(/\s+/).filter(Boolean);
  const filtered = list.filter((p) => {
    if (state.cat.length && !state.cat.includes(p.categorie)) return false;
    if (state.maat.length && !p.maten.some((m) => state.maat.includes(m))) return false;
    if (state.kleur.length && !p.kleuren.some((k) => state.kleur.includes(k))) return false;
    if (state.label.length && !state.label.includes(p.label)) return false;
    if (state.min !== null && p.prijs < state.min) return false;
    if (state.max !== null && p.prijs > state.max) return false;
    if (terms.length) {
      const haystack = normalize([p.naam, p.beschrijving, categoryName(p.categorie), ...p.kleuren].join(' '));
      if (!terms.every((t) => haystack.includes(t))) return false;
    }
    return true;
  });

  const sorters = {
    nieuwste: (a, b) => b.toegevoegd.localeCompare(a.toegevoegd),
    'prijs-op': (a, b) => a.prijs - b.prijs,
    'prijs-af': (a, b) => b.prijs - a.prijs,
    naam: (a, b) => a.naam.localeCompare(b.naam, 'nl'),
  };
  return sorters[state.sort] ? filtered.sort(sorters[state.sort]) : filtered;
}

/* ---------- Weergave ---------- */

function buildOptions() {
  const count = (fn) => products.filter(fn).length;
  const sizes = sortSizes([...new Set(products.flatMap((p) => p.maten))]);
  const colors = [...new Set(products.flatMap((p) => p.kleuren))];

  form.querySelector('[data-options="cat"]').innerHTML = CATEGORIES.map(
    (c) => `<label class="check"><input type="checkbox" name="cat" value="${c.id}"> ${escapeHtml(c.naam)}
      <span class="check__count" aria-hidden="true">${count((p) => p.categorie === c.id)}</span></label>`,
  ).join('');

  form.querySelector('[data-options="maat"]').innerHTML = sizes
    .map((m) => `<label class="chip"><input type="checkbox" name="maat" value="${escapeHtml(m)}"><span>${escapeHtml(m)}</span></label>`)
    .join('');

  form.querySelector('[data-options="kleur"]').innerHTML = colors
    .map(
      (k) => `<label class="chip"><input type="checkbox" name="kleur" value="${escapeHtml(k)}">
        <span><i class="swatch" style="--swatch:${colorHex(k)}" aria-hidden="true"></i>${escapeHtml(k)}</span></label>`,
    )
    .join('');

  form.querySelector('[data-options="label"]').innerHTML = LABELS.map(
    (l) => `<label class="check"><input type="checkbox" name="label" value="${l.id}"> ${l.naam}
      <span class="check__count" aria-hidden="true">${count((p) => p.label === l.id)}</span></label>`,
  ).join('');

  const prices = products.map((p) => p.prijs);
  form.min.placeholder = Math.floor(Math.min(...prices));
  form.max.placeholder = Math.ceil(Math.max(...prices));
}

function pageTitle(state) {
  if (state.q) return `Zoekresultaten voor “${state.q}”`;
  if (state.cat.length) {
    const names = state.cat.map(categoryName);
    return names.length > 1 ? `${names.slice(0, -1).join(', ')} en ${names.at(-1)}` : names[0];
  }
  if (state.label.length === 1 && !state.cat.length) return state.label[0] === 'sale' ? 'Sale' : 'Nieuw binnen';
  return 'Alles';
}

function renderActive(state) {
  const pills = [];
  const pill = (key, value, text) =>
    pills.push(`<button type="button" class="pill" data-remove-key="${key}" data-remove-value="${escapeHtml(value)}">
      ${escapeHtml(text)}<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.4"/></svg>
      <span class="visually-hidden">filter verwijderen</span></button>`);
  if (state.q) pill('q', '', `Zoek: ${state.q}`);
  state.cat.forEach((v) => pill('cat', v, categoryName(v)));
  state.maat.forEach((v) => pill('maat', v, `Maat ${v}`));
  state.kleur.forEach((v) => pill('kleur', v, v));
  state.label.forEach((v) => pill('label', v, v === 'sale' ? 'Sale' : 'Nieuw'));
  if (state.min !== null) pill('min', '', `Vanaf €${state.min}`);
  if (state.max !== null) pill('max', '', `Tot €${state.max}`);
  if (pills.length > 1) pills.push('<button type="button" class="link-btn" data-remove-key="all">Alles wissen</button>');
  activeEl.innerHTML = pills.join('');

  const n = LIST_KEYS.reduce((sum, k) => sum + state[k].length, 0) + (state.min !== null) + (state.max !== null) + (state.q ? 1 : 0);
  toggleCount.textContent = n ? `(${n})` : '';
}

function render(state) {
  const list = applyFilters(products, state);
  if (list.length) {
    renderGrid(results, list);
    results.querySelectorAll('li').forEach((li) => li.classList.add('reveal'));
  } else {
    results.innerHTML = `<li class="empty-state" style="grid-column:1/-1">
      <p><strong>Geen producten gevonden.</strong></p>
      <p class="muted">Probeer minder filters of een andere zoekterm.</p>
      <button type="button" class="btn btn--outline" data-remove-key="all">Filters wissen</button></li>`;
  }
  results.removeAttribute('aria-busy');
  countEl.textContent = `${list.length} ${list.length === 1 ? 'product' : 'producten'}`;
  const title = pageTitle(state);
  titleEl.textContent = title;
  document.title = `${title} — STIL`;
  renderActive(state);
  observeReveal(results);
}

/* ---------- Events ---------- */

function update({ push = true } = {}) {
  const state = stateFromForm();
  const url = `${location.pathname}${stateToSearch(state)}`;
  if (url !== `${location.pathname}${location.search}`) {
    history[push ? 'pushState' : 'replaceState'](null, '', url);
  }
  render(state);
}

let searchTimer;
function bindEvents() {
  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('change', (event) => {
    if (event.target.name === 'q') return; // zoeken loopt via 'input'
    update();
  });
  form.addEventListener('input', (event) => {
    if (!['q', 'min', 'max'].includes(event.target.name)) return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => update({ push: false }), 250);
  });
  form.addEventListener('reset', () => {
    // Na de reset de waarden expliciet legen (ook die uit de URL kwamen).
    setTimeout(() => {
      syncForm(stateFromUrl(''));
      update();
    });
  });

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-remove-key]');
    if (!btn) return;
    const { removeKey: key, removeValue: value } = btn.dataset;
    const state = stateFromForm();
    if (key === 'all') syncForm(stateFromUrl(`?sort=${state.sort}`));
    else if (LIST_KEYS.includes(key)) syncForm({ ...state, [key]: state[key].filter((v) => v !== value) });
    else syncForm({ ...state, [key]: key === 'q' ? '' : null });
    update();
    (activeEl.querySelector('.pill') || sortSelect).focus();
  });

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    form.classList.toggle('is-open', open);
    if (open) form.querySelector('input')?.focus();
  });

  window.addEventListener('popstate', () => {
    const state = stateFromUrl();
    syncForm(state);
    render(state);
  });
}

/* ---------- Start ---------- */

initUI();
loadProducts()
  .then((data) => {
    products = data;
    buildOptions();
    const state = stateFromUrl();
    syncForm(state);
    render(state);
    bindEvents();
  })
  .catch(() => {
    results.removeAttribute('aria-busy');
    results.innerHTML = '<li class="empty-state" style="grid-column:1/-1">Producten konden niet worden geladen. Probeer het later opnieuw.</li>';
  });

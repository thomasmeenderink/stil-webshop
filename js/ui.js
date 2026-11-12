// Gedeelde UI: header, footer, winkelmand-drawer, meldingen en scroll-animaties.
import { BRAND, CATEGORIES, FREE_SHIPPING_THRESHOLD, MAX_QUANTITY } from './config.js';
import { getItems, getCount, getTotals, setQuantity, removeItem, onCartChange, lineKey } from './cart.js';
import { formatPrice, escapeHtml } from './products.js';

const icons = {
  menu: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  close: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  bag: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M5 8h14l-1 13H6L5 8z M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
};

function headerHtml() {
  const links = [
    { href: 'shop.html', label: 'Alles' },
    ...CATEGORIES.map((c) => ({ href: `shop.html?cat=${c.id}`, label: c.naam })),
    { href: 'shop.html?label=sale', label: 'Sale' },
  ];
  return `
    <div class="container header__inner">
      <button class="icon-btn nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        ${icons.menu}<span class="visually-hidden">Menu</span>
      </button>
      <a class="logo" href="index.html" aria-label="${BRAND}, naar de homepage">${BRAND}</a>
      <nav class="site-nav" id="site-nav" aria-label="Hoofdmenu">
        <ul>${links.map((l) => `<li><a href="${l.href}">${escapeHtml(l.label)}</a></li>`).join('')}</ul>
      </nav>
      <button class="cart-btn" type="button" data-cart-open aria-haspopup="dialog">
        ${icons.bag}<span class="cart-btn__label">Mand</span>
        <span class="cart-count" data-cart-count aria-hidden="true">0</span>
      </button>
    </div>`;
}

function footerHtml() {
  return `
    <div class="container footer__inner">
      <div class="footer__brand">
        <p class="logo logo--footer">${BRAND}</p>
        <p>Minder, maar beter. Basics die stil blijven, zodat jij dat niet hoeft.</p>
      </div>
      <nav aria-label="Footer">
        <h2 class="footer__heading">Shop</h2>
        <ul>${CATEGORIES.map((c) => `<li><a href="shop.html?cat=${c.id}">${escapeHtml(c.naam)}</a></li>`).join('')}</ul>
      </nav>
      <div>
        <h2 class="footer__heading">Service</h2>
        <ul>
          <li>Gratis verzending vanaf ${formatPrice(FREE_SHIPPING_THRESHOLD)}</li>
          <li>30 dagen bedenktijd</li>
          <li><a href="cart.html">Winkelmand</a></li>
        </ul>
      </div>
    </div>
    <div class="container footer__bottom">
      <p>&copy; ${new Date().getFullYear()} ${BRAND}. Fictief merk, gemaakt als demo-webshop.</p>
    </div>`;
}

function drawerHtml() {
  return `
    <dialog class="drawer" id="cart-drawer" aria-labelledby="drawer-title">
      <div class="drawer__panel">
        <div class="drawer__header">
          <h2 id="drawer-title" class="drawer__title" tabindex="-1">Winkelmand</h2>
          <button class="icon-btn" type="button" data-cart-close>${icons.close}<span class="visually-hidden">Winkelmand sluiten</span></button>
        </div>
        <div class="drawer__body" data-drawer-lines></div>
        <div class="drawer__footer" data-drawer-summary></div>
      </div>
    </dialog>`;
}

/* ---------- Winkelmandregels (drawer + cart-pagina) ---------- */

export function cartLinesHtml(items) {
  if (!items.length) {
    return `<div class="cart-empty"><p>Je winkelmand is nog leeg.</p><a class="btn btn--outline" href="shop.html">Bekijk de collectie</a></div>`;
  }
  return `<ul class="cart-lines">${items
    .map((item) => {
      const key = escapeHtml(lineKey(item));
      const name = escapeHtml(item.naam);
      const desc = `${name}, ${escapeHtml(item.kleur.toLowerCase())}, maat ${escapeHtml(item.maat)}`;
      const url = `product.html?id=${encodeURIComponent(item.id)}`;
      return `
      <li class="cart-line" data-key="${key}">
        <a class="cart-line__media" href="${url}" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(item.afbeelding)}" alt="" width="80" height="100"></a>
        <div class="cart-line__info">
          <h3 class="cart-line__title"><a href="${url}">${name}</a></h3>
          <p class="cart-line__meta">${escapeHtml(item.kleur)} · Maat ${escapeHtml(item.maat)}</p>
          <div class="qty qty--sm">
            <button type="button" class="qty__btn" data-action="dec" aria-label="Eén minder: ${desc}" ${item.aantal <= 1 ? 'disabled' : ''}>−</button>
            <input class="qty__input" type="number" inputmode="numeric" min="1" max="${MAX_QUANTITY}" value="${item.aantal}" data-action="set" aria-label="Aantal: ${desc}">
            <button type="button" class="qty__btn" data-action="inc" aria-label="Eén meer: ${desc}" ${item.aantal >= MAX_QUANTITY ? 'disabled' : ''}>+</button>
          </div>
        </div>
        <div class="cart-line__side">
          <p class="cart-line__price">${formatPrice(item.prijs * item.aantal)}</p>
          <button type="button" class="link-btn" data-action="remove">Verwijder<span class="visually-hidden">: ${desc}</span></button>
        </div>
      </li>`;
    })
    .join('')}</ul>`;
}

export function summaryHtml(totals, { showCheckout = true, showProgress = true } = {}) {
  const pct = Math.min(100, Math.round(((FREE_SHIPPING_THRESHOLD - totals.remainingForFreeShipping) / FREE_SHIPPING_THRESHOLD) * 100));
  const shippingMsg =
    totals.remainingForFreeShipping > 0
      ? `Nog <strong>${formatPrice(totals.remainingForFreeShipping)}</strong> tot gratis verzending.`
      : 'Je bestelling wordt <strong>gratis</strong> verzonden.';
  return `
    ${showProgress ? `<div class="shipping-progress">
      <p>${shippingMsg}</p>
      <div class="progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
    </div>` : ''}
    <dl class="totals">
      <div><dt>Subtotaal</dt><dd>${formatPrice(totals.subtotal)}</dd></div>
      <div><dt>Verzending</dt><dd>${totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}</dd></div>
      <div class="totals__total"><dt>Totaal <span class="muted">(incl. btw)</span></dt><dd>${formatPrice(totals.total)}</dd></div>
    </dl>
    ${showCheckout ? `<div class="stack-sm"><a class="btn btn--block" href="checkout.html">Afrekenen</a><a class="btn btn--outline btn--block" href="cart.html">Bekijk winkelmand</a></div>` : ''}`;
}

export function orderLinesHtml(items) {
  return items
    .map(
      (i) => `<li class="order-line">
        <div class="order-line__thumb"><img src="${escapeHtml(i.afbeelding)}" alt="" width="56" height="70"><span class="order-line__qty" aria-hidden="true">${i.aantal}</span></div>
        <div><p>${escapeHtml(i.naam)}</p><p class="muted">${escapeHtml(i.kleur)} · Maat ${escapeHtml(i.maat)} <span class="visually-hidden">· Aantal ${i.aantal}</span></p></div>
        <p>${formatPrice(i.prijs * i.aantal)}</p>
      </li>`,
    )
    .join('');
}

// Rendert regels in een container en houdt de toetsenbordfocus op dezelfde knop na een update.
export function renderCartLines(container, items) {
  const active = document.activeElement;
  let restore = null;
  if (active && container.contains(active)) {
    const line = active.closest('[data-key]');
    restore = { key: line?.dataset.key, action: active.dataset.action, index: [...container.querySelectorAll('[data-key]')].indexOf(line) };
  }
  container.innerHTML = cartLinesHtml(items);
  if (!restore) return;
  const line = container.querySelector(`[data-key="${CSS.escape(restore.key ?? '')}"]`);
  let target = line?.querySelector(`[data-action="${restore.action}"]`);
  if (target?.disabled) target = line.querySelector('[data-action="set"]');
  if (!target) {
    // Regel verwijderd: focus op de volgende regel of op de lege-staat-link.
    const lines = container.querySelectorAll('[data-key]');
    target = lines[Math.min(restore.index, lines.length - 1)]?.querySelector('[data-action="remove"]') || container.querySelector('a, button');
  }
  target?.focus();
}

export function bindCartLines(container) {
  container.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;
    const line = btn.closest('[data-key]');
    const key = line.dataset.key;
    const current = Number(line.querySelector('[data-action="set"]').value);
    if (btn.dataset.action === 'inc') setQuantity(key, current + 1);
    if (btn.dataset.action === 'dec') setQuantity(key, current - 1);
    if (btn.dataset.action === 'remove') {
      const name = line.querySelector('.cart-line__title').textContent;
      removeItem(key);
      announce(`${name} is verwijderd uit je winkelmand.`);
    }
  });
  container.addEventListener('change', (event) => {
    const input = event.target.closest('input[data-action="set"]');
    if (input) setQuantity(input.closest('[data-key]').dataset.key, input.value);
  });
}

/* ---------- Drawer ---------- */

let drawer;
let lastTrigger = null;

export function openCartDrawer(trigger = document.activeElement) {
  if (!drawer || drawer.open) return;
  lastTrigger = trigger;
  drawer.showModal();
  document.documentElement.classList.add('no-scroll');
  requestAnimationFrame(() => drawer.classList.add('is-open'));
  drawer.querySelector('.drawer__title').focus();
}

export function closeCartDrawer() {
  if (!drawer?.open) return;
  drawer.classList.remove('is-open');
  const finish = () => {
    drawer.close();
    document.documentElement.classList.remove('no-scroll');
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else setTimeout(finish, 280);
}

function setupDrawer() {
  document.body.insertAdjacentHTML('beforeend', drawerHtml());
  drawer = document.getElementById('cart-drawer');
  bindCartLines(drawer.querySelector('[data-drawer-lines]'));
  drawer.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeCartDrawer();
  });
  drawer.addEventListener('click', (event) => {
    if (event.target === drawer || event.target.closest('[data-cart-close]')) closeCartDrawer();
  });
  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-cart-open]');
    if (opener) openCartDrawer(opener);
  });
}

function renderDrawer(items) {
  if (!drawer) return;
  renderCartLines(drawer.querySelector('[data-drawer-lines]'), items);
  drawer.querySelector('[data-drawer-summary]').innerHTML = items.length ? summaryHtml(getTotals(items)) : '';
}

function updateCount() {
  const count = getCount();
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = count;
    el.classList.toggle('is-empty', count === 0);
  });
  document.querySelectorAll('[data-cart-open]').forEach((btn) => {
    btn.setAttribute('aria-label', `Winkelmand openen, ${count} ${count === 1 ? 'artikel' : 'artikelen'}`);
  });
}

/* ---------- Navigatie ---------- */

function setupNav(header) {
  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.site-nav');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  header.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Markeer de huidige pagina.
  const here = new URL(location.href);
  const page = here.pathname.split('/').pop() || 'index.html';
  nav.querySelectorAll('a').forEach((a) => {
    const target = new URL(a.href);
    const samePage = (target.pathname.split('/').pop() || 'index.html') === page;
    const sameQuery =
      (target.searchParams.get('cat') ?? '') === (here.searchParams.get('cat') ?? '') &&
      (target.searchParams.get('label') ?? '') === (here.searchParams.get('label') ?? '');
    if (samePage && sameQuery) a.setAttribute('aria-current', 'page');
  });

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- Meldingen ---------- */

let toastTimer;
export function announce(message, { visible = false } = {}) {
  const region = document.querySelector('[data-live]');
  region.textContent = '';
  // Kleine vertraging zodat screenreaders een herhaalde melding ook voorlezen.
  setTimeout(() => (region.textContent = message), 50);
  if (visible) {
    const toast = document.querySelector('[data-toast]');
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }
}

/* ---------- Scroll-animaties ---------- */

export function observeReveal(root = document) {
  const els = root.querySelectorAll('.reveal:not(.is-visible)');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -40px 0px' },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Init ---------- */

export function initUI() {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  if (header) {
    header.innerHTML = headerHtml();
    setupNav(header);
  }
  if (footer) footer.innerHTML = footerHtml();

  document.body.insertAdjacentHTML(
    'beforeend',
    '<div class="visually-hidden" aria-live="polite" data-live></div><div class="toast" data-toast aria-hidden="true"></div>',
  );

  setupDrawer();
  renderDrawer(getItems());
  updateCount();
  onCartChange((items) => {
    renderDrawer(items);
    updateCount();
  });

  observeReveal();
}

// Productpagina: maat en kleur kiezen, aantal en toevoegen aan de winkelmand.
import { initUI, openCartDrawer, announce, observeReveal } from '../ui.js';
import { addItem } from '../cart.js';
import { MAX_QUANTITY, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } from '../config.js';
import {
  loadProducts, renderGrid, priceHtml, badgeHtml, categoryName, colorHex, sortSizes, escapeHtml, formatPrice,
} from '../products.js';

initUI();

const root = document.querySelector('[data-product]');
const breadcrumbs = document.querySelector('[data-breadcrumbs]');
const id = new URLSearchParams(location.search).get('id');

function notFound() {
  document.title = 'Product niet gevonden — STIL';
  root.innerHTML = `
    <div class="empty-state">
      <h1 class="page-title">Product niet gevonden</h1>
      <p class="muted">Dit product bestaat niet (meer). Misschien vind je iets anders in de collectie.</p>
      <a class="btn" href="shop.html">Naar de shop</a>
    </div>`;
}

function optionGroup(name, label, values, renderValue) {
  const single = values.length === 1;
  return `
    <fieldset class="option-group" data-group="${name}">
      <legend>${label}: <span class="muted" data-selected="${name}">${single ? escapeHtml(values[0]) : `kies een ${label.toLowerCase()}`}</span></legend>
      <div class="chip-list">
        ${values
          .map(
            (v) => `<label class="chip ${name === 'maat' ? 'chip--size' : ''}">
              <input type="radio" name="${name}" value="${escapeHtml(v)}" ${single ? 'checked' : ''} aria-describedby="${name}-error">
              <span>${renderValue(v)}</span></label>`,
          )
          .join('')}
      </div>
      <p class="field__error" id="${name}-error" aria-live="polite"></p>
    </fieldset>`;
}

function render(product) {
  document.title = `${product.naam} — STIL`;
  document.querySelector('meta[name="description"]').content = product.beschrijving;
  breadcrumbs.insertAdjacentHTML(
    'beforeend',
    `<li><a href="shop.html?cat=${product.categorie}">${escapeHtml(categoryName(product.categorie))}</a></li>
     <li><span aria-current="page">${escapeHtml(product.naam)}</span></li>`,
  );

  const sizes = sortSizes(product.maten);
  root.innerHTML = `
    <article class="product">
      <div class="product__media">
        <img src="${escapeHtml(product.afbeelding)}" alt="${escapeHtml(product.naam)} in ${escapeHtml(product.kleuren[0].toLowerCase())}, vooraanzicht" width="400" height="500">
        ${badgeHtml(product)}
      </div>
      <div class="product__info">
        <p class="eyebrow">${escapeHtml(categoryName(product.categorie))}</p>
        <h1 class="product__title">${escapeHtml(product.naam)}</h1>
        <p class="product__price">${priceHtml(product)}</p>
        <p class="product__desc">${escapeHtml(product.beschrijving)}</p>

        <form class="product__form" novalidate data-add-form>
          ${optionGroup('kleur', 'Kleur', product.kleuren, (k) => `<i class="swatch" style="--swatch:${colorHex(k)}" aria-hidden="true"></i>${escapeHtml(k)}`)}
          ${optionGroup('maat', 'Maat', sizes, escapeHtml)}
          <label class="label" for="aantal">Aantal</label>
          <div class="add-row">
            <div class="qty">
              <button type="button" class="qty__btn" data-step="-1" aria-label="Eén minder">−</button>
              <input class="qty__input" type="number" id="aantal" name="aantal" value="1" min="1" max="${MAX_QUANTITY}" inputmode="numeric">
              <button type="button" class="qty__btn" data-step="1" aria-label="Eén meer">+</button>
            </div>
            <button class="btn" type="submit">In winkelmand</button>
          </div>
        </form>

        <div class="product__meta">
          <details>
            <summary>Materiaal &amp; verzorging</summary>
            <p>Wassen op 30 °C binnenstebuiten, niet in de droger. Strijken op lage temperatuur. Zo blijft de stof jaren mooi.</p>
          </details>
          <details>
            <summary>Verzending &amp; retour</summary>
            <p>Gratis verzending vanaf ${formatPrice(FREE_SHIPPING_THRESHOLD)}, anders ${formatPrice(SHIPPING_COST)}. Voor 22:00 besteld, morgen in huis. 30 dagen gratis retourneren.</p>
          </details>
        </div>
      </div>
    </article>`;
  root.removeAttribute('aria-busy');
  bindForm(product);
}

function bindForm(product) {
  const form = root.querySelector('[data-add-form]');
  const qty = form.aantal;
  const syncSteppers = () => {
    form.querySelector('[data-step="-1"]').disabled = Number(qty.value) <= 1;
    form.querySelector('[data-step="1"]').disabled = Number(qty.value) >= MAX_QUANTITY;
  };
  const clampQty = () => {
    qty.value = Math.max(1, Math.min(MAX_QUANTITY, Math.round(Number(qty.value)) || 1));
    syncSteppers();
  };
  syncSteppers();

  form.addEventListener('click', (event) => {
    const step = event.target.closest('[data-step]');
    if (!step) return;
    qty.value = Number(qty.value) + Number(step.dataset.step);
    clampQty();
  });
  qty.addEventListener('change', clampQty);

  form.addEventListener('change', (event) => {
    const { name, value } = event.target;
    if (name !== 'kleur' && name !== 'maat') return;
    form.querySelector(`[data-selected="${name}"]`).textContent = value;
    setError(form, name, '');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const kleur = form.querySelector('input[name="kleur"]:checked')?.value;
    const maat = form.querySelector('input[name="maat"]:checked')?.value;
    const missing = [];
    if (!kleur) missing.push(['kleur', 'Kies eerst een kleur.']);
    if (!maat) missing.push(['maat', 'Kies eerst een maat.']);
    missing.forEach(([name, msg]) => setError(form, name, msg));
    if (missing.length) {
      form.querySelector(`input[name="${missing[0][0]}"]`).focus();
      return;
    }
    clampQty();
    addItem(product, { kleur, maat, aantal: Number(qty.value) });
    announce(`${product.naam} (${kleur}, maat ${maat}) is toegevoegd aan je winkelmand.`);
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.classList.remove('bump');
      void el.offsetWidth; // animatie opnieuw starten
      el.classList.add('bump');
    });
    openCartDrawer(form.querySelector('[type="submit"]'));
  });
}

function setError(form, name, message) {
  const group = form.querySelector(`[data-group="${name}"]`);
  group.querySelector('.field__error').textContent = message;
  if (message) group.setAttribute('data-invalid', '');
  else group.removeAttribute('data-invalid');
  group.querySelectorAll('input').forEach((input) => input.setAttribute('aria-invalid', String(Boolean(message))));
}

function renderRelated(product, products) {
  const others = products.filter((p) => p.id !== product.id);
  const related = [
    ...others.filter((p) => p.categorie === product.categorie),
    ...others.filter((p) => p.categorie !== product.categorie).sort((a, b) => b.toegevoegd.localeCompare(a.toegevoegd)),
  ].slice(0, 4);
  renderGrid(document.querySelector('[data-related]'), related);
  document.querySelector('[data-related-section]').hidden = false;
  observeReveal();
}

loadProducts()
  .then((products) => {
    const product = products.find((p) => p.id === id);
    if (!product) return notFound();
    render(product);
    renderRelated(product, products);
  })
  .catch(() => {
    root.removeAttribute('aria-busy');
    root.innerHTML = '<p class="empty-state">Het product kon niet worden geladen. Probeer het later opnieuw.</p>';
  });

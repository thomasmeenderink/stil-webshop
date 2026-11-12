// Productdata laden en weergeven.
import { PRODUCTS_URL, CATEGORIES, COLORS, CURRENCY, LOCALE, SIZE_ORDER } from './config.js';

let productsPromise;

export function loadProducts() {
  if (!productsPromise) {
    productsPromise = fetch(PRODUCTS_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Kon producten niet laden (${res.status})`);
        return res.json();
      })
      .catch((err) => {
        productsPromise = undefined; // volgende poging opnieuw proberen
        throw err;
      });
  }
  return productsPromise;
}

export async function getProduct(id) {
  const products = await loadProducts();
  return products.find((p) => p.id === id) || null;
}

const priceFormatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });
export const formatPrice = (value) => priceFormatter.format(value);

export const categoryName = (id) => CATEGORIES.find((c) => c.id === id)?.naam ?? id;
export const colorHex = (name) => COLORS[name] ?? '#cccccc';

export const sortSizes = (sizes) =>
  [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

export function priceHtml(product) {
  const now = `<span class="price__now">${formatPrice(product.prijs)}</span>`;
  if (product.label === 'sale' && product.oudePrijs) {
    return `<span class="price price--sale"><span class="visually-hidden">Nu </span>${now}
      <s class="price__old"><span class="visually-hidden">was </span>${formatPrice(product.oudePrijs)}</s></span>`;
  }
  return `<span class="price">${now}</span>`;
}

export function badgeHtml(product) {
  if (product.label === 'nieuw') return '<span class="badge">Nieuw</span>';
  if (product.label === 'sale') return '<span class="badge badge--accent">Sale</span>';
  return '';
}

export function productCardHtml(product) {
  const url = `product.html?id=${encodeURIComponent(product.id)}`;
  const swatches = product.kleuren
    .map((k) => `<span class="swatch swatch--sm" style="--swatch:${colorHex(k)}" title="${escapeHtml(k)}"></span>`)
    .join('');
  return `
    <article class="card">
      <a class="card__link" href="${url}">
        <div class="card__media">
          <img src="${escapeHtml(product.afbeelding)}" alt="${escapeHtml(product.naam)} in ${escapeHtml(product.kleuren[0].toLowerCase())}" loading="lazy" width="400" height="500">
          ${badgeHtml(product)}
        </div>
        <div class="card__body">
          <h3 class="card__title">${escapeHtml(product.naam)}</h3>
          ${priceHtml(product)}
        </div>
      </a>
      <p class="card__swatches"><span class="visually-hidden">Kleuren: ${escapeHtml(product.kleuren.join(', '))}</span><span aria-hidden="true">${swatches}</span></p>
    </article>`;
}

export function renderGrid(container, products) {
  container.innerHTML = products.map((p) => `<li>${productCardHtml(p)}</li>`).join('');
}

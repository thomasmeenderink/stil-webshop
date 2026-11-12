// Homepagina: nieuwe en uitgelichte producten.
import { initUI, observeReveal } from '../ui.js';
import { loadProducts, renderGrid } from '../products.js';

initUI();

const newList = document.querySelector('[data-new-products]');
const featuredList = document.querySelector('[data-featured-products]');

// Eén product per categorie, de recentste eerst, zonder producten die al bij "Nieuw" staan.
function pickFeatured(products, exclude) {
  const seen = new Set();
  return [...products]
    .filter((p) => !exclude.has(p.id))
    .sort((a, b) => b.toegevoegd.localeCompare(a.toegevoegd))
    .filter((p) => !seen.has(p.categorie) && seen.add(p.categorie))
    .slice(0, 4);
}

loadProducts()
  .then((products) => {
    const fresh = products
      .filter((p) => p.label === 'nieuw')
      .sort((a, b) => b.toegevoegd.localeCompare(a.toegevoegd))
      .slice(0, 4);
    renderGrid(newList, fresh);
    renderGrid(featuredList, pickFeatured(products, new Set(fresh.map((p) => p.id))));
  })
  .catch(() => {
    const msg = '<li class="empty-state" style="grid-column:1/-1">Producten konden niet worden geladen. Probeer het later opnieuw.</li>';
    newList.innerHTML = msg;
    featuredList.innerHTML = msg;
  })
  .finally(() => {
    newList.removeAttribute('aria-busy');
    featuredList.removeAttribute('aria-busy');
    observeReveal();
  });

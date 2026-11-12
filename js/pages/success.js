// Bevestigingspagina: toont de laatste bestelling en leegt de winkelmand.
import { initUI, orderLinesHtml, summaryHtml } from '../ui.js';
import { clearCart } from '../cart.js';
import { STORAGE_KEYS } from '../config.js';
import { escapeHtml } from '../products.js';

initUI();
clearCart();

const params = new URLSearchParams(location.search);
document.querySelector('[data-demo-notice]').hidden = params.get('demo') !== '1';

let order = null;
try {
  order = JSON.parse(localStorage.getItem(STORAGE_KEYS.lastOrder) || 'null');
} catch {
  order = null;
}

if (order?.items?.length) {
  document.querySelector('[data-order-intro]').innerHTML =
    `Ordernummer <strong>${escapeHtml(order.id)}</strong>. We sturen een bevestiging naar <strong>${escapeHtml(order.klant.email)}</strong>.`;
  document.querySelector('[data-order-details]').innerHTML = `
    <ul class="order-lines" aria-label="Bestelde artikelen">${orderLinesHtml(order.items)}</ul>
    <div style="text-align:left">${summaryHtml(order.totals, { showCheckout: false, showProgress: false })}</div>
    <p class="muted" style="text-align:left">Bezorgadres: ${escapeHtml(order.klant.naam)}, ${escapeHtml(order.klant.adres)}</p>`;
}

// Aparte winkelmandpagina; gebruikt dezelfde regels en totalen als de drawer.
import { initUI, renderCartLines, bindCartLines, summaryHtml } from '../ui.js';
import { getItems, getTotals, getCount, onCartChange } from '../cart.js';

initUI();

const lines = document.querySelector('[data-cart-lines]');
const summary = document.querySelector('[data-cart-summary]');
const summaryBox = document.querySelector('[data-summary-box]');
const subtitle = document.querySelector('[data-cart-subtitle]');

function render(items) {
  renderCartLines(lines, items);
  summaryBox.hidden = items.length === 0;
  summary.innerHTML = summaryHtml(getTotals(items), { showCheckout: false }) +
    '<a class="btn btn--block" href="checkout.html">Verder naar afrekenen</a>' +
    '<p class="secure-note">Veilig betalen via Stripe</p>';
  const count = getCount();
  subtitle.textContent = count ? `${count} ${count === 1 ? 'artikel' : 'artikelen'}` : '';
}

bindCartLines(lines);
render(getItems());
onCartChange(render);

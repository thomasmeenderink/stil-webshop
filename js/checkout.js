// Checkout: formuliervalidatie, orderoverzicht en doorsturen naar een Stripe Payment Link.
import { initUI, summaryHtml, orderLinesHtml } from './ui.js';
import { getItems, getTotals, onCartChange } from './cart.js';
import { STRIPE_PAYMENT_LINK, STORAGE_KEYS, isPaymentLinkConfigured } from './config.js';
import { escapeHtml } from './products.js';

initUI();

const form = document.querySelector('[data-checkout-form]');
const errorSummary = document.querySelector('[data-error-summary]');
const errorList = document.querySelector('[data-error-list]');
const payButton = document.querySelector('[data-pay]');

/* ---------- Orderoverzicht ---------- */


function renderOrder() {
  const items = getItems();
  const empty = items.length === 0;
  document.querySelector('[data-checkout]').hidden = empty;
  document.querySelector('[data-checkout-empty]').hidden = !empty;
  document.querySelector('[data-order-lines]').innerHTML = orderLinesHtml(items);
  document.querySelector('[data-order-totals]').innerHTML = summaryHtml(getTotals(items), { showCheckout: false });
}

/* ---------- Validatie ---------- */

const POSTCODES = {
  NL: { re: /^[1-9][0-9]{3}\s?[a-z]{2}$/i, example: '1234 AB' },
  BE: { re: /^[1-9][0-9]{3}$/, example: '1000' },
  DE: { re: /^[0-9]{5}$/, example: '10115' },
};

const rules = {
  voornaam: (v) => (!v ? 'Vul je voornaam in.' : ''),
  achternaam: (v) => (!v ? 'Vul je achternaam in.' : ''),
  email: (v) => {
    if (!v) return 'Vul je e-mailadres in.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.';
    return '';
  },
  straat: (v) => {
    if (!v) return 'Vul je straat en huisnummer in.';
    if (!/\d/.test(v)) return 'Vergeet je huisnummer niet.';
    return '';
  },
  postcode: (v) => {
    const { re, example } = POSTCODES[form.land.value];
    if (!v) return 'Vul je postcode in.';
    if (!re.test(v)) return `Vul een geldige postcode in, bijvoorbeeld ${example}.`;
    return '';
  },
  plaats: (v) => (!v ? 'Vul je woonplaats in.' : ''),
};

function validateField(name) {
  const input = form.elements[name];
  const message = rules[name](input.value.trim());
  input.setAttribute('aria-invalid', String(Boolean(message)));
  document.getElementById(`${name}-error`).textContent = message;
  return message;
}

function validateAll() {
  return Object.keys(rules)
    .map((name) => ({ name, message: validateField(name) }))
    .filter((e) => e.message);
}

function showSummary(errors) {
  errorSummary.hidden = errors.length === 0;
  errorList.innerHTML = errors.map((e) => `<li><a href="#${e.name}">${escapeHtml(e.message)}</a></li>`).join('');
}

// Pas valideren nadat iemand een veld heeft verlaten; daarna live bijwerken.
const touched = new Set();
form.addEventListener('focusout', (event) => {
  const { name } = event.target;
  if (!rules[name] || (!event.target.value && !touched.has(name))) return;
  touched.add(name);
  validateField(name);
});
form.addEventListener('input', (event) => {
  const { name } = event.target;
  if (rules[name] && touched.has(name)) validateField(name);
});
form.land.addEventListener('change', () => touched.has('postcode') && validateField('postcode'));
errorList.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link) return;
  event.preventDefault();
  document.getElementById(link.hash.slice(1)).focus();
});

/* ---------- Betalen ---------- */

function makeOrderId() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `STIL-${date}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  Object.keys(rules).forEach((name) => touched.add(name));
  const errors = validateAll();
  showSummary(errors);
  if (errors.length) {
    errorSummary.focus();
    return;
  }

  const items = getItems();
  if (!items.length) return renderOrder();

  const data = Object.fromEntries(new FormData(form));
  const order = {
    id: makeOrderId(),
    datum: new Date().toISOString(),
    items,
    totals: getTotals(items),
    klant: {
      naam: `${data.voornaam.trim()} ${data.achternaam.trim()}`,
      email: data.email.trim(),
      adres: `${data.straat.trim()}, ${data.postcode.trim().toUpperCase()} ${data.plaats.trim()}, ${data.land}`,
    },
  };
  try {
    localStorage.setItem(STORAGE_KEYS.lastOrder, JSON.stringify(order));
  } catch {
    /* niet kritiek */
  }

  payButton.disabled = true;
  payButton.textContent = 'Doorsturen naar Stripe…';

  if (isPaymentLinkConfigured()) {
    // Payment Links accepteren o.a. een vooringevuld e-mailadres en een eigen referentie.
    const url = new URL(STRIPE_PAYMENT_LINK);
    url.searchParams.set('prefilled_email', order.klant.email);
    url.searchParams.set('client_reference_id', order.id);
    location.href = url.toString();
  } else {
    location.href = `success.html?order=${encodeURIComponent(order.id)}&demo=1`;
  }
});

document.querySelector('[data-demo-notice]').hidden = isPaymentLinkConfigured();
renderOrder();
onCartChange(renderOrder);

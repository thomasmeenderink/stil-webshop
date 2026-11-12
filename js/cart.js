// Winkelmand-state, bewaard in localStorage. Andere modules luisteren naar 'cart:change'.
import { STORAGE_KEYS, FREE_SHIPPING_THRESHOLD, SHIPPING_COST, MAX_QUANTITY } from './config.js';

const EVENT = 'cart:change';

function read() {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.cart) || '[]');
    return Array.isArray(items) ? items.filter((i) => i && i.id && i.aantal > 0) : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(items));
  } catch {
    // Opslag vol of geblokkeerd: de mand werkt dan alleen tot de pagina sluit.
  }
  memory = items;
  document.dispatchEvent(new CustomEvent(EVENT, { detail: { items } }));
}

let memory = read();

export const lineKey = (item) => `${item.id}|${item.maat}|${item.kleur}`;
const clamp = (n) => Math.max(1, Math.min(MAX_QUANTITY, Math.round(Number(n)) || 1));

export function getItems() {
  return memory.map((i) => ({ ...i }));
}

export function addItem(product, { maat, kleur, aantal = 1 }) {
  const items = getItems();
  const key = lineKey({ id: product.id, maat, kleur });
  const existing = items.find((i) => lineKey(i) === key);
  if (existing) {
    existing.aantal = clamp(existing.aantal + aantal);
  } else {
    items.push({
      id: product.id,
      naam: product.naam,
      prijs: product.prijs,
      afbeelding: product.afbeelding,
      maat,
      kleur,
      aantal: clamp(aantal),
    });
  }
  write(items);
}

export function setQuantity(key, aantal) {
  write(getItems().map((i) => (lineKey(i) === key ? { ...i, aantal: clamp(aantal) } : i)));
}

export function removeItem(key) {
  write(getItems().filter((i) => lineKey(i) !== key));
}

export function clearCart() {
  write([]);
}

export function getCount() {
  return memory.reduce((sum, i) => sum + i.aantal, 0);
}

export function getTotals(items = memory) {
  const subtotal = round(items.reduce((sum, i) => sum + i.prijs * i.aantal, 0));
  const shipping = items.length === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  return {
    subtotal,
    shipping,
    total: round(subtotal + shipping),
    remainingForFreeShipping: Math.max(0, round(FREE_SHIPPING_THRESHOLD - subtotal)),
  };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export function onCartChange(callback) {
  document.addEventListener(EVENT, () => callback(getItems()));
}

// Synchroniseer tussen tabbladen.
window.addEventListener('storage', (event) => {
  if (event.key === STORAGE_KEYS.cart) {
    memory = read();
    document.dispatchEvent(new CustomEvent(EVENT, { detail: { items: memory } }));
  }
});

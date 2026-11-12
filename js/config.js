// Centrale instellingen van de shop. Pas hier merk, verzendkosten en de Stripe-link aan.

export const BRAND = 'STIL';

// Stripe Payment Link (testmodus). Maak er een aan in het Stripe-dashboard
// (zie README) en plak de URL hier, bijvoorbeeld 'https://buy.stripe.com/test_abc123'.
// Zolang dit de placeholder is, draait de checkout in demo-modus en ga je direct naar success.html.
export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_REPLACE_ME';

export const CURRENCY = 'EUR';
export const LOCALE = 'nl-NL';
export const FREE_SHIPPING_THRESHOLD = 75;
export const SHIPPING_COST = 4.95;
export const MAX_QUANTITY = 10;

export const STORAGE_KEYS = {
  cart: 'stil.cart.v1',
  lastOrder: 'stil.lastOrder.v1',
};

export const PRODUCTS_URL = 'data/products.json';

// Volgorde en weergavenaam van categorieën.
export const CATEGORIES = [
  { id: 't-shirts', naam: 'T-shirts' },
  { id: 'hoodies', naam: 'Hoodies & sweaters' },
  { id: 'broeken', naam: 'Broeken' },
  { id: 'jassen', naam: 'Jassen' },
  { id: 'accessoires', naam: 'Accessoires' },
];

// Kleurnaam -> swatch-kleur. Nieuwe kleur in products.json? Voeg hem hier toe.
export const COLORS = {
  Zwart: '#1c1c1c',
  Wit: '#ffffff',
  'Gebroken wit': '#eeebe3',
  Grijs: '#8a8a8a',
  Zand: '#cdba96',
  Olijf: '#5b5e3a',
  Navy: '#1f2a44',
};

// Volgorde waarin maten in filters en op de productpagina verschijnen.
export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '36-39', '40-43', '44-46', 'One size'];

export function isPaymentLinkConfigured() {
  return /^https:\/\/buy\.stripe\.com\//.test(STRIPE_PAYMENT_LINK) && !STRIPE_PAYMENT_LINK.includes('REPLACE_ME');
}

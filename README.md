# STIL — statische webshop

**STIL** is een fictief, modern-minimalistisch kledingmerk. Deze repository bevat een complete webshop zonder backend:
alleen HTML, CSS en JavaScript, zodat hij gratis op GitHub Pages kan draaien.

> *Kleding die stil blijft.* STIL begon in een kleine studio in Amsterdam met één vraag: wat als je minder koopt,
> maar alles wat je hebt elke week wilt dragen? Basics zonder logo's of trends, van goede stoffen, gemaakt om jaren mee te gaan.

## Wat de shop doet

| Pagina | Functie |
| --- | --- |
| `index.html` | Hero met merkverhaal, nieuwe en uitgelichte producten, categorieën, sale-banner |
| `shop.html` | Alle producten met filters op categorie, maat, kleur, prijs en nieuw/sale; sorteren (aanbevolen, nieuwste, prijs, naam) en zoeken. De filterstatus staat in de URL, dus je kunt een gefilterde pagina delen, bookmarken en terug/vooruit gebruiken. Voorbeeld: `shop.html?cat=hoodies,jassen&maat=M&sort=prijs-op` |
| `product.html?id=…` | Productdetail. Kleur en maat zijn verplicht voordat je iets toevoegt; aantal kiezen; gerelateerde producten |
| `cart.html` | Volledige winkelmand: aantallen aanpassen, verwijderen, subtotaal, verzendkosten (gratis vanaf €75) en totaal |
| `checkout.html` | Formulier (naam, e-mail, adres) met nette validatie en een foutoverzicht, orderoverzicht en de knop **Betalen met Stripe** |
| `success.html` | Bevestiging met ordernummer en overzicht; leegt de winkelmand |

Op elke pagina zit een **slide-out winkelmand** (drawer) en een teller in de header. De winkelmand wordt bewaard in
`localStorage`, blijft dus staan na herladen en synchroniseert tussen tabbladen.

Toegankelijkheid: semantische HTML, skip-link, zichtbare focus, toetsenbordbediening (de drawer is een `<dialog>` die je met
Esc sluit en die de focus teruggeeft), labels en foutmeldingen gekoppeld via `aria-describedby`, live-meldingen voor
screenreaders, voldoende contrast en `prefers-reduced-motion` wordt gerespecteerd.

## Mappenstructuur

```
├── index.html, shop.html, product.html, cart.html, checkout.html, success.html
├── css/style.css            Alle stijlen (design tokens bovenin, mobile-first)
├── data/products.json       De productcatalogus
├── images/products/*.svg    Placeholder-afbeeldingen (4:5), vervang door echte foto's
├── js/
│   ├── config.js            Merk, verzendkosten, Stripe-link, categorieën, kleuren, maatvolgorde
│   ├── products.js          Producten laden, prijzen formatteren, productkaarten
│   ├── cart.js              Winkelmand-state in localStorage
│   ├── ui.js                Header, footer, drawer, meldingen, animaties
│   ├── filters.js           Shoppagina: filteren, sorteren, zoeken, URL-state
│   ├── checkout.js          Validatie en doorsturen naar Stripe
│   └── pages/               Kleine scripts per pagina (home, product, cart, success)
└── serve.ps1                Mini-webserver voor lokaal testen (Windows, geen installatie nodig)
```

## Lokaal draaien

De shop laadt `data/products.json` met `fetch`, en gebruikt JavaScript-modules. Daarom werkt het **niet** door
`index.html` dubbel te klikken (`file://`); je hebt een eenvoudige lokale webserver nodig. Kies er één:

```bash
# Windows, zonder iets te installeren (PowerShell):
powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1 -Port 8081
```

```bash
# Met Python:
python -m http.server 8081
```

```bash
# Met Node.js:
npx serve -l 8081
```

Open daarna <http://localhost:8081>. In VS Code werkt de extensie *Live Server* ook.

## Producten toevoegen of aanpassen

Alle producten staan in `data/products.json`. Een product ziet er zo uit:

```json
{
  "id": "essential-tee",
  "naam": "Essential Tee",
  "categorie": "t-shirts",
  "prijs": 29.95,
  "oudePrijs": 39.95,
  "beschrijving": "Het T-shirt waar alles mee begint…",
  "maten": ["XS", "S", "M", "L", "XL"],
  "kleuren": ["Zwart", "Wit", "Grijs"],
  "afbeelding": "images/products/essential-tee.svg",
  "label": "sale",
  "toegevoegd": "2026-03-02"
}
```

- **id**: uniek, alleen kleine letters, cijfers en streepjes (wordt gebruikt in `product.html?id=…`).
- **categorie**: één van de id's uit `CATEGORIES` in `js/config.js` (`t-shirts`, `hoodies`, `broeken`, `jassen`, `accessoires`). Nieuwe categorie? Voeg hem daar toe.
- **label**: `"nieuw"`, `"sale"` of `null`. Bij `"sale"` vul je ook **oudePrijs** in; die wordt doorgestreept getoond.
- **kleuren**: gebruik namen die in `COLORS` in `js/config.js` staan (daar staat de swatch-kleur). Nieuwe kleur? Voeg naam + hexcode toe.
- **maten**: vrije tekst; de volgorde in filters komt uit `SIZE_ORDER` in `js/config.js`.
- **toegevoegd**: datum (`JJJJ-MM-DD`), gebruikt voor sorteren op *nieuwste*.
- **afbeelding**: pad naar een afbeelding, het liefst in verhouding 4:5 (bijvoorbeeld 800×1000 px, WebP of JPG).

### Afbeeldingen vervangen

De huidige afbeeldingen zijn neutrale SVG-placeholders. Zet een foto in `images/products/` (bijvoorbeeld
`essential-tee.jpg`) en pas het veld `afbeelding` aan. De categorietegels en de hero op de homepage verwijzen
rechtstreeks naar afbeeldingen in `index.html`; pas die daar aan.

## Publiceren op GitHub Pages

1. Maak een repository op GitHub en push deze map naar de branch `main`.
2. Ga in de repository naar **Settings → Pages**.
3. Kies bij *Source* **Deploy from a branch**, selecteer `main` en de map `/ (root)` en klik **Save**.
4. Na een minuut staat de shop op `https://<gebruikersnaam>.github.io/<repository>/`.

Alle links en paden zijn relatief, dus de shop werkt ook vanuit een submap zoals `/<repository>/`.

## Stripe test Payment Link aanmaken

Een [Payment Link](https://docs.stripe.com/payment-links) is een door Stripe gehoste betaalpagina die je zonder eigen
server kunt gebruiken.

1. Maak een (gratis) account op <https://dashboard.stripe.com> en zet rechtsboven **Testmodus** aan.
2. Ga naar **Product catalogus → Product toevoegen**, bijvoorbeeld "STIL bestelling", met een prijs in EUR.
   Kies eventueel **Klant kiest bedrag** of laat de klant de hoeveelheid aanpassen.
3. Ga naar **Payment Links → Nieuw**, kies het product en stel bij **Na betaling** in:
   *Klanten doorsturen naar je website* → `https://<gebruikersnaam>.github.io/<repository>/success.html`.
4. Kopieer de link (die begint met `https://buy.stripe.com/test_…`) en plak hem in `js/config.js`:

   ```js
   export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/test_abc123';
   ```

5. Test met kaartnummer `4242 4242 4242 4242`, een datum in de toekomst en een willekeurige CVC.

De checkout stuurt het e-mailadres mee (`prefilled_email`) en een ordernummer (`client_reference_id`), dat je
terugziet bij de betaling in het dashboard. Zolang er nog een placeholder in `config.js` staat, draait de checkout
in **demo-modus**: je gaat direct door naar `success.html` en er wordt niets afgerekend.

### Belangrijk: beperkingen zonder backend

Een Payment Link heeft een **vast product en bedrag** dat je in het Stripe-dashboard instelt. Hij weet dus niet wat
er in de winkelmand van deze site zit. Voor een demo of een shop met één product is dat prima, maar een echte checkout
met meerdere producten, maten en een wisselend totaal heeft later een kleine **serverless functie** nodig
(bijvoorbeeld Netlify Functions, Vercel, Cloudflare Workers of een Supabase Edge Function). Die functie:

1. ontvangt de winkelmand (product-id's, maten, aantallen) van de browser;
2. zoekt de prijzen zelf op in de catalogus (vertrouw nooit prijzen uit de browser);
3. maakt met je **geheime** Stripe-sleutel een [Checkout Session](https://docs.stripe.com/api/checkout/sessions) aan met `line_items`;
4. stuurt de browser door naar de `url` van die sessie.

Daarnaast heb je voor voorraadbeheer en orderbevestigingen een webhook (`checkout.session.completed`) nodig.
De geheime sleutel mag nooit in deze repository of in de frontend-code terechtkomen.

## Aanpassen

- **Kleuren en typografie**: de design tokens staan bovenaan `css/style.css` (`--accent` is de enige accentkleur).
- **Verzendkosten**: `FREE_SHIPPING_THRESHOLD` en `SHIPPING_COST` in `js/config.js`.
- **Merknaam**: `BRAND` in `js/config.js` en de teksten in de HTML-pagina's.

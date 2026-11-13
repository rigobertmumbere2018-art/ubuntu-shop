import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = { DB: D1Database };
const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());

app.get('/', (c) => c.html(`<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#00144B" />
  <meta name="description" content="UBUNTU SHOP — la boutique en ligne de UBUNTU HOLDING DRC, à Goma." />
  <title>UBUNTU SHOP — UBUNTU HOLDING DRC</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/styles/brand.css" />
</head>
<body>
  <div class="top-pattern" aria-hidden="true"><img src="/assets/brand/hexagons-outline.png" alt="" /></div>
  <header class="site-header">
    <a class="brand" href="/" aria-label="Ubuntu Shop, accueil">
      <img src="/assets/brand/ubuntu-symbol-blue.png" alt="" />
      <span><strong>UBUNTU</strong><small>SHOP · UBUNTU HOLDING DRC</small></span>
    </a>
    <nav class="main-nav" aria-label="Navigation principale">
      <a href="#boutique" data-fr="Boutique" data-en="Shop">Boutique</a>
      <a href="#apropos" data-fr="À propos" data-en="About">À propos</a>
      <a href="#contact" data-fr="Contact" data-en="Contact">Contact</a>
    </nav>
    <div class="header-actions">
      <label class="sr-only" for="language">Langue</label>
      <select id="language" aria-label="Choisir la langue"><option value="fr">FR</option><option value="en">EN</option></select>
      <a class="cart-link" href="#boutique" aria-label="Voir la boutique"><span aria-hidden="true">⌕</span></a>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-copy">
        
        <h1 data-fr="Vos idées prennent forme." data-en="Where your ideas take shape.">Vos idées prennent forme.</h1>
        <p class="hero-description" data-fr="Découvrez nos créations personnalisées et les services de UBUNTU HOLDING DRC." data-en="Explore custom creations and services from UBUNTU HOLDING DRC.">Découvrez les produits et services proposés par UBUNTU HOLDING DRC. Une boutique pensée pour vous accompagner de la commande à la livraison.</p>
        <a class="button button-yellow" href="#boutique" data-fr="Explorer la boutique" data-en="Explore the shop">Explorer la boutique <span aria-hidden="true">↗</span></a>
        <div class="hero-meta"><span>GOMA · RDC</span><span>USD / CDF</span><span>FR / EN</span></div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <img class="hero-hex hero-hex-brown" src="/assets/brand/hexagons-solid.png" alt="" />
        <img class="hero-hex hero-hex-color" src="/assets/brand/hexagons-tricolor.png" alt="" />
        <img class="hero-symbol" src="/assets/brand/ubuntu-symbol-blue.png" alt="" />
      </div>
      <div class="hero-bottom-pattern" aria-hidden="true"><img src="/assets/brand/hexagons-tricolor.png" alt="" /></div>
    </section>

    <section class="shop-section section-wrap" id="boutique">
      <div class="section-heading">
        <div><h2 data-fr="La boutique" data-en="The shop">La boutique</h2></div>
        <p data-fr="Découvrez quelques-unes de nos réalisations." data-en="Discover a selection of our creations.">Les articles disponibles seront présentés ici avec leurs caractéristiques et leurs prix.</p>
      </div>
      <div class="catalog-tools"><label class="search-box"><span aria-hidden="true">⌕</span><input id="product-search" type="search" placeholder="Rechercher un produit…" data-placeholder-fr="Rechercher un produit…" data-placeholder-en="Search products…" /></label><span class="currency-note" data-fr="Prix affichés en USD · équivalent CDF selon le taux configuré" data-en="Prices in USD · CDF equivalent based on configured exchange rate">Prix affichés en USD · équivalent CDF selon le taux configuré</span></div>
      <div id="product-grid" class="product-grid" aria-live="polite"><div class="empty-state"><span class="empty-mark">⬡</span><h3 data-fr="Le catalogue se prépare" data-en="The catalogue is being prepared">Le catalogue se prépare</h3><p data-fr="Les produits seront publiés ici dès leur validation par l’équipe UBUNTU SHOP." data-en="Products will appear here once approved by the UBUNTU SHOP team.">Les produits seront publiés ici dès leur validation par l’équipe UBUNTU SHOP.</p></div></div>
    </section>

    <section class="about-section" id="apropos">
      <div class="about-pattern" aria-hidden="true"><img src="/assets/brand/hexagons-outline.png" alt="" /></div>
      <div class="section-wrap about-content"><div><h2>UBUNTU HOLDING DRC</h2></div><div><p data-fr="UBUNTU SHOP est l’espace de présentation et de commande des produits et services de UBUNTU HOLDING DRC, basé à Goma, en République démocratique du Congo." data-en="UBUNTU SHOP is the online space to discover and order products and services from UBUNTU HOLDING DRC, based in Goma, Democratic Republic of the Congo.">UBUNTU SHOP est l’espace de présentation et de commande des produits et services de UBUNTU HOLDING DRC, basé à Goma, en République démocratique du Congo.</p><a class="text-link" href="mailto:ubunturdc@gmail.com">En savoir plus <span aria-hidden="true">↗</span></a></div></div>
    </section>

    <section class="contact-section section-wrap" id="contact"><div><h2 data-fr="Parlons de votre projet." data-en="Let's talk about your project.">Parlons de votre projet.</h2></div><div class="contact-details"><a href="https://wa.me/243999214448" target="_blank" rel="noopener">WhatsApp · +243 999 214 448 ↗</a><a href="mailto:ubunturdc@gmail.com">ubunturdc@gmail.com</a><p>23 Av. Kinshasa, Route 1 km Témoin, Goma, RDC</p></div></section>
  </main>
  <footer class="site-footer"><div class="footer-pattern" aria-hidden="true"><img src="/assets/brand/hexagons-tricolor.png" alt="" /></div><div class="footer-inner"><span>© <span id="year"></span> UBUNTU HOLDING DRC</span><span>DESIGN & DIGITAL · RIGOURA DESIGN</span></div></footer>
  <script>
    const language = document.getElementById('language');
    language.addEventListener('change', () => {
      const lang = language.value;
      document.documentElement.lang = lang;
      document.querySelectorAll('[data-' + lang + ']').forEach(el => { el.textContent = el.getAttribute('data-' + lang); });
      document.querySelectorAll('[data-placeholder-' + lang + ']').forEach(el => { el.placeholder = el.getAttribute('data-placeholder-' + lang); });
    });
    document.getElementById('year').textContent = new Date().getFullYear();
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = Array.from({length: 9}, (_, index) => `
      <article class="product-card product-placeholder" aria-label="Emplacement produit à compléter">
        <div class="product-image placeholder-image" aria-hidden="true"></div>
        <div class="product-info">
          <span class="placeholder-line placeholder-short"></span>
          <span class="placeholder-line placeholder-title"></span>
          <span class="placeholder-line placeholder-description"></span>
          <span class="placeholder-line placeholder-price"></span>
        </div>
      </article>`).join('');
    document.getElementById('product-search').disabled = true;
    document.getElementById('product-search').placeholder = 'Catalogue en préparation…';
  </script>
</body></html>`));

app.get('/api/health', (c) => c.json({ status: 'ok', enterprise: 'UBUNTU HOLDING DRC', app: 'UBUNTU SHOP' }));

app.get('/api/exchange-rate', async (c) => {
  const record = await c.env.DB.prepare("SELECT currency_from, currency_to, rate, updated_at FROM exchange_rates WHERE currency_from = 'USD' AND currency_to = 'CDF'").first();
  if (!record) return c.json({ error: 'Taux USD/CDF non configuré.' }, 404);
  return c.json(record);
});

app.get('/api/products', async (c) => {
  const result = await c.env.DB.prepare("SELECT * FROM products WHERE status = 'published' ORDER BY created_at DESC").all();
  return c.json(result.results);
});

export default app;

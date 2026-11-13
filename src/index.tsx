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
  <meta name="description" content="UBUNTU SHOP — galerie et boutique des créations artistiques et imprimées de UBUNTU HOLDING DRC, à Goma." />
  <title>UBUNTU SHOP — Galerie & créations</title>
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
      <a href="#oeuvres" data-fr="Œuvres" data-en="Artworks">Œuvres</a>
      <a href="#collections" data-fr="Collections" data-en="Collections">Collections</a>
      <a href="#sur-mesure" data-fr="Sur mesure" data-en="Custom">Sur mesure</a>
      <a href="#contact" data-fr="Contact" data-en="Contact">Contact</a>
    </nav>
    <div class="header-actions">
      <label class="sr-only" for="language">Langue</label>
      <select id="language" aria-label="Choisir la langue"><option value="fr">FR</option><option value="en">EN</option></select>
      <a class="cart-link" href="#oeuvres" aria-label="Découvrir la boutique">↗</a>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow" data-fr="L’ART PREND FORME À GOMA" data-en="ART TAKES SHAPE IN GOMA">L’ART PREND FORME À GOMA</p>
        <h1 data-fr="Des créations qui ont une âme." data-en="Creations with a soul.">Des créations qui ont une âme.</h1>
        <p class="hero-description" data-fr="Explorez les œuvres en bois sculpté, les objets personnalisés et les créations imprimées de UBUNTU HOLDING DRC." data-en="Explore sculpted wooden artworks, personalized objects and printed creations by UBUNTU HOLDING DRC.">Explorez les œuvres en bois sculpté, les objets personnalisés et les créations imprimées de UBUNTU HOLDING DRC.</p>
        <div class="hero-actions"><a class="button button-yellow" href="#oeuvres" data-fr="Découvrir les œuvres" data-en="Discover the artworks">Découvrir les œuvres <span aria-hidden="true">↗</span></a><a class="hero-secondary" href="#sur-mesure" data-fr="Commander une création" data-en="Commission a creation">Commander une création</a></div>
        <div class="hero-meta"><span><small>GALERIE & BOUTIQUE</small><strong>Goma · RDC</strong></span><span><small>CRÉATIONS</small><strong>Art · Personnalisation · Print</strong></span></div>
      </div>
      <div class="hero-art">
        <img class="hero-photo" src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85" alt="Œuvre d’art exposée dans une galerie — visuel illustratif" />
        <div class="hero-photo-caption"><span>01 / GALERIE UBUNTU</span><strong>La matière, le geste, l’idée.</strong></div>
        <img class="hero-hex" src="/assets/brand/hexagons-tricolor.png" alt="" aria-hidden="true" />
      </div>
      <div class="hero-bottom-pattern" aria-hidden="true"><img src="/assets/brand/hexagons-tricolor.png" alt="" /></div>
    </section>

    <section class="intro-strip"><p data-fr="L’expression artistique au cœur de chaque création." data-en="Artistic expression at the heart of every creation.">L’expression artistique au cœur de chaque création.</p><span>UBUNTU HOLDING DRC · 2026</span></section>

    <section class="shop-section section-wrap" id="oeuvres">
      <div class="section-heading">
        <div><p class="eyebrow">SÉLECTION · 01</p><h2 data-fr="Œuvres à découvrir" data-en="Artworks to discover">Œuvres à découvrir</h2></div>
        <p data-fr="Des pièces décoratives façonnées avec soin. Chaque création présentée ici est un exemple de mise en scène pour la maquette." data-en="Decorative pieces shaped with care. Each item shown here is a sample concept for this mockup.">Des pièces décoratives façonnées avec soin. Chaque création présentée ici est un exemple de mise en scène pour la maquette.</p>
      </div>
      <div class="catalog-tools"><span class="catalog-label">COLLECTION ART & DÉCORATION</span><span class="currency-note">EXEMPLES FICTIFS · PRIX INDICATIFS À VALIDER</span></div>
      <div class="product-grid">
        <article class="product-card">
          <div class="product-image"><img src="https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=900&q=85" alt="Sculpture décorative en bois, visuel d’inspiration" /><span class="sample-tag">EXEMPLE DE MAQUETTE</span><span class="image-index">01</span></div>
          <div class="product-info"><p class="product-category">SCULPTURE · BOIS</p><h3>Totem des origines</h3><p>Pièce décorative sculptée, inspirée des formes et symboles africains.</p><div class="product-bottom"><strong>À partir de 85 $</strong><a href="#sur-mesure" aria-label="Demander un devis pour Totem des origines">↗</a></div><small class="price-note">Prix fictif indicatif · devis selon dimensions</small></div>
        </article>
        <article class="product-card">
          <div class="product-image"><img src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=900&q=85" alt="Composition artistique murale, visuel d’inspiration" /><span class="sample-tag">EXEMPLE DE MAQUETTE</span><span class="image-index">02</span></div>
          <div class="product-info"><p class="product-category">ART MURAL · 3D</p><h3>Mémoire en relief</h3><p>Composition murale en relief pour donner du caractère à un espace.</p><div class="product-bottom"><strong>Sur devis</strong><a href="#sur-mesure" aria-label="Demander un devis pour Mémoire en relief">↗</a></div><small class="price-note">Exemple de création personnalisable</small></div>
        </article>
        <article class="product-card">
          <div class="product-image"><img src="https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=900&q=85" alt="Objet d’art exposé, visuel d’inspiration" /><span class="sample-tag">EXEMPLE DE MAQUETTE</span><span class="image-index">03</span></div>
          <div class="product-info"><p class="product-category">OBJET DÉCORATIF</p><h3>Équilibre naturel</h3><p>Objet sculptural à poser, réalisé sur commande selon le modèle choisi.</p><div class="product-bottom"><strong>À partir de 45 $</strong><a href="#sur-mesure" aria-label="Demander un devis pour Équilibre naturel">↗</a></div><small class="price-note">Prix fictif indicatif · à confirmer</small></div>
        </article>
      </div>
      <div class="section-footnote">Les photographies et références produits de cette maquette sont illustratives. Elles ne représentent pas encore le catalogue réel de UBUNTU SHOP.</div>
    </section>

    <section class="collections-section section-wrap" id="collections">
      <div class="section-heading"><div><p class="eyebrow">SÉLECTION · 02</p><h2>Nos univers créatifs</h2></div><p>Une même exigence de création, déclinée dans plusieurs univers complémentaires.</p></div>
      <div class="collection-grid">
        <a class="collection-card collection-art" href="#oeuvres"><span>01 / ART & DÉCORATION</span><strong>Œuvres en bois<br/>et créations 3D</strong><b>Explorer ↗</b></a>
        <a class="collection-card collection-gift" href="#sur-mesure"><span>02 / CADEAUX</span><strong>Objets personnalisés<br/>et souvenirs</strong><b>Imaginer ↗</b></a>
        <a class="collection-card collection-print" href="#imprimerie"><span>03 / IMPRIMERIE</span><strong>Cartes, invitations<br/>et supports imprimés</strong><b>Découvrir ↗</b></a>
      </div>
    </section>

    <section class="print-section section-wrap" id="imprimerie">
      <div class="print-visual"><img src="https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1100&q=85" alt="Papeterie et cartes imprimées, visuel d’inspiration" /><span class="sample-tag">VISUEL ILLUSTRATIF</span></div>
      <div class="print-copy"><p class="eyebrow">SÉLECTION · 03</p><h2>Le papier aussi devient création.</h2><p>Invitations, cartes de vœux, cartes postales, cartes de service, cartes de visite et supports de communication : des impressions pensées pour marquer les esprits.</p><ul><li>Formats et papiers au choix</li><li>Impression recto ou recto-verso</li><li>Finitions et quantités personnalisables</li></ul><a class="text-link" href="#sur-mesure">Parler de mon projet ↗</a></div>
    </section>

    <section class="custom-section" id="sur-mesure"><div class="custom-inner section-wrap"><div><p class="eyebrow">VOTRE IDÉE, NOTRE SAVOIR-FAIRE</p><h2>Une pièce unique commence par une conversation.</h2><p>Vous avez un modèle, une dimension ou une idée précise ? Présentez-nous votre projet. Nous étudierons les possibilités et vous proposerons un devis adapté.</p></div><div class="custom-cta"><span>CRÉATION SUR COMMANDE</span><a class="button button-yellow" href="https://wa.me/243999214448?text=Bonjour%20UBUNTU%20SHOP%2C%20je%20souhaite%20discuter%20d'une%20cr%C3%A9ation%20sur%20mesure." target="_blank" rel="noopener">Demander un devis <b>↗</b></a><small>Échange direct avec notre équipe à Goma</small></div></div></section>

    <section class="how-section section-wrap"><div class="section-heading"><div><p class="eyebrow">SIMPLE & DIRECT</p><h2>Comment commander ?</h2></div><p>Un parcours clair, de la découverte à la réception de votre création.</p></div><div class="steps-grid"><div><span>01</span><h3>Choisissez</h3><p>Parcourez les créations ou décrivez votre besoin.</p></div><div><span>02</span><h3>Échangez</h3><p>Confirmez les détails, le prix et le délai avec l’équipe.</p></div><div><span>03</span><h3>Confirmez</h3><p>Validez la commande et les modalités de paiement convenues.</p></div><div><span>04</span><h3>Recevez</h3><p>Retirez votre commande ou organisez la livraison.</p></div></div></section>

    <section class="contact-section section-wrap" id="contact"><div><p class="eyebrow">UBUNTU HOLDING DRC · GOMA</p><h2>Faisons exister votre prochaine idée.</h2></div><div class="contact-details"><a href="https://wa.me/243999214448" target="_blank" rel="noopener">WhatsApp · +243 999 214 448 ↗</a><a href="mailto:ubunturdc@gmail.com">ubunturdc@gmail.com</a><p>23 Av. Kinshasa, Route 1 km Témoin, Goma, RDC</p></div></section>
  </main>
  <footer class="site-footer"><div class="footer-pattern" aria-hidden="true"><img src="/assets/brand/hexagons-tricolor.png" alt="" /></div><div class="footer-inner"><span>© <span id="year"></span> UBUNTU HOLDING DRC</span><span>DESIGN & DIGITAL · RIGOURA DESIGN</span><span>MAQUETTE DE PRÉSENTATION · VERSION DE TRAVAIL</span></div></footer>
  <script>
    const language = document.getElementById('language');
    language.addEventListener('change', () => {
      const lang = language.value;
      document.documentElement.lang = lang;
      document.querySelectorAll('[data-' + lang + ']').forEach(el => { el.textContent = el.getAttribute('data-' + lang); });
    });
    document.getElementById('year').textContent = new Date().getFullYear();
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

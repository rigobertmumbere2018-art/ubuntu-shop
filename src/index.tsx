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
      <a class="cart-link" href="#oeuvres" aria-label="Découvrir la boutique"><svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a>
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow" data-fr="L’ART PREND FORME À GOMA" data-en="ART TAKES SHAPE IN GOMA">L’ART PREND FORME À GOMA</p>
        <h1 data-fr="Des créations qui ont une âme." data-en="Creations with a soul.">Des créations qui ont une âme.</h1>
        <p class="hero-description" data-fr="Explorez les œuvres en bois sculpté, les objets personnalisés et les créations imprimées de UBUNTU HOLDING DRC." data-en="Explore sculpted wooden artworks, personalized objects and printed creations by UBUNTU HOLDING DRC.">Explorez les œuvres en bois sculpté, les objets personnalisés et les créations imprimées de UBUNTU HOLDING DRC.</p>
        <div class="hero-actions"><a class="button button-yellow" href="#oeuvres" data-fr="Découvrir les œuvres" data-en="Discover the artworks">Découvrir les œuvres <span aria-hidden="true"><svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></a><a class="hero-secondary" href="#sur-mesure" data-fr="Commander une création" data-en="Commission a creation">Commander une création</a></div>
        <div class="hero-meta"><span><small>GALERIE & BOUTIQUE</small><strong>Goma · RDC</strong></span><span><small>CRÉATIONS</small><strong>Art · Personnalisation · Print</strong></span></div>
      </div>
      <div class="hero-art">
        <img class="hero-photo" src="https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=85" alt="Œuvre murale en bois sculpté" />
        <div class="hero-photo-caption"><span>01 / GALERIE UBUNTU</span><strong>La matière, le geste, l’idée.</strong></div>
        <img class="hero-hex" src="/assets/brand/hexagons-tricolor.png" alt="" aria-hidden="true" />
      </div>
      <div class="hero-bottom-pattern" aria-hidden="true"><img src="/assets/brand/hexagons-tricolor.png" alt="" /></div>
    </section>

    <section class="intro-strip"><p data-fr="L’expression artistique au cœur de chaque création." data-en="Artistic expression at the heart of every creation.">L’expression artistique au cœur de chaque création.</p><span>UBUNTU HOLDING DRC · 2026</span></section>

    <section class="shop-section section-wrap" id="oeuvres">
      <div class="section-heading">
        <div><p class="eyebrow">SÉLECTION · 01</p><h2 data-fr="Œuvres à découvrir" data-en="Artworks to discover">Œuvres à découvrir</h2></div>
        <p data-fr="Sculptures, plaques gravées et objets décoratifs réalisés sur commande dans notre atelier." data-en="Wood sculptures, engraved signs, wall frames and personalized pieces for your spaces and ceremonies.">Sculptures en bois, plaques signalétiques gravées, cadres muraux et créations personnalisées pour vos espaces et vos cérémonies.</p>
      </div>
      <div class="catalog-tools"><span class="catalog-label">COLLECTION ART & DÉCORATION</span><span class="currency-note">COMMANDES PERSONNALISÉES · GOMA</span></div>
      <div class="product-grid" id="product-grid"><article class="product-card"><a class="product-card-link" href="/produit/sculpture-bois"><div class="product-image"><img src="https://i.etsystatic.com/20262922/r/il/d3fdb3/6514267928/il_1080xN.6514267928_pkna.jpg" alt="Œuvre murale en bois sculpté" loading="lazy"></div><div class="product-info"><p class="product-category">ŒUVRE EN BOIS</p><h3>Œuvre murale en bois sculpté</h3><p>Pièce murale en bois travaillée en relief, avec une finition qui laisse apparaître le veinage naturel du bois.</p><div class="product-bottom"><strong>Sur devis</strong><span class="card-open">VOIR LE PRODUIT <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></div></div></a></article><article class="product-card"><a class="product-card-link" href="/produit/plaque-gravee"><div class="product-image"><img src="https://www.krintech.co.uk/assets/images/wood/laser-engraved-walnut-block_feature.jpg" alt="Plaque signalétique gravée sur bois" loading="lazy"></div><div class="product-info"><p class="product-category">GRAVURE SUR BOIS</p><h3>Plaque signalétique gravée sur bois</h3><p>Plaque en bois avec texte, nom, logo ou motif gravé au laser. Adaptée à la signalétique intérieure, aux bureaux et aux espaces d’accueil.</p><div class="product-bottom"><strong>Sur devis</strong><span class="card-open">VOIR LE PRODUIT <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></div></div></a></article><article class="product-card"><a class="product-card-link" href="/produit/invitation-bois"><div class="product-image"><img src="https://i.etsystatic.com/31627371/r/il/0e0841/4006262414/il_1080xN.4006262414_14sc.jpg" alt="Faire-part de mariage gravé sur bois" loading="lazy"></div><div class="product-info"><p class="product-category">INVITATION EN BOIS</p><h3>Faire-part de mariage gravé sur bois</h3><p>Carte d’invitation en bois gravée ou découpée, à remettre aux familles et aux invités pour une cérémonie de mariage ou une célébration.</p><div class="product-bottom"><strong>Sur devis</strong><span class="card-open">VOIR LE PRODUIT <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></div></div></a></article><article class="product-card"><a class="product-card-link" href="/produit/invitation-papier"><div class="product-image"><img src="https://static.wixstatic.com/media/227cec_c637c16f222842809fb1a6b03bcd22e5~mv2.jpg/v1/fill/w_980%2Ch_980%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/227cec_c637c16f222842809fb1a6b03bcd22e5~mv2.jpg" alt="Faire-part de mariage imprimé – style wax" loading="lazy"></div><div class="product-info"><p class="product-category">PAPETERIE · INVITATION</p><h3>Faire-part de mariage imprimé – style wax</h3><p>Faire-part imprimé avec motifs inspirés des tissus wax, pour annoncer le mariage civil, la bénédiction nuptiale et la réception.</p><div class="product-bottom"><strong>Sur devis</strong><span class="card-open">VOIR LE PRODUIT <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></div></div></a></article><article class="product-card"><a class="product-card-link" href="/produit/invitation-classique"><div class="product-image"><img src="https://i.etsystatic.com/12733236/r/il/41c5c6/2835286652/il_fullxfull.2835286652_81ll.jpg" alt="Carte d’invitation pour cérémonie" loading="lazy"></div><div class="product-info"><p class="product-category">PAPETERIE · INVITATION</p><h3>Carte d’invitation pour cérémonie</h3><p>Carte d’invitation pour mariage, anniversaire, dot, jubilé, remise de diplôme ou autre cérémonie familiale.</p><div class="product-bottom"><strong>Sur devis</strong><span class="card-open">VOIR LE PRODUIT <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></div></div></a></article><article class="product-card"><a class="product-card-link" href="/produit/calendrier-photo"><div class="product-image"><img src="https://cdn.sanity.io/images/8ihypsrf/production/a778f385a510072400a30620b1a0a2fda0e44ee4-1500x1500.jpg?auto=format&fit=clip&q=75&w=3840" alt="Calendrier mural personnalisé avec photos" loading="lazy"></div><div class="product-info"><p class="product-category">IMPRESSION · CALENDRIER</p><h3>Calendrier mural personnalisé avec photos</h3><p>Calendrier mural illustré avec vos photos, les dates importantes et les événements à retenir tout au long de l’année.</p><div class="product-bottom"><strong>Sur devis</strong><span class="card-open">VOIR LE PRODUIT <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></div></div></a></article><article class="product-card"><a class="product-card-link" href="/produit/cadre-photo"><div class="product-image"><img src="https://artstreet.in/cdn/shop/products/ASPWT24269-SIDE-1_700x700.jpg?v=1686141105" alt="Cadres photos muraux en bois" loading="lazy"></div><div class="product-info"><p class="product-category">PHOTO · DÉCORATION</p><h3>Cadres photos muraux en bois</h3><p>Cadre mural pour portraits, photos de famille, souvenirs et décoration intérieure. Disponible en composition simple ou en galerie de plusieurs cadres.</p><div class="product-bottom"><strong>Sur devis</strong><span class="card-open">VOIR LE PRODUIT <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></div></div></a></article><article class="product-card"><a class="product-card-link" href="/produit/creation-sur-mesure"><div class="product-image"><img src="https://i.etsystatic.com/20262922/r/il/d3fdb3/6514267928/il_1080xN.6514267928_pkna.jpg" alt="Création personnalisée sur commande" loading="lazy"></div><div class="product-info"><p class="product-category">SUR MESURE</p><h3>Création personnalisée sur commande</h3><p>Une réalisation adaptée à votre besoin : plaque nominative, décoration murale, cadeau personnalisé ou support de communication.</p><div class="product-bottom"><strong>Sur devis</strong><span class="card-open">VOIR LE PRODUIT <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></span></div></div></a></article></div>      <div class="section-footnote"></div>
    </section>

    <section class="collections-section section-wrap" id="collections">
      <div class="section-heading"><div><p class="eyebrow">SÉLECTION · 02</p><h2>Nos univers créatifs</h2></div><p>Une même exigence de création, déclinée dans plusieurs univers complémentaires.</p></div>
      <div class="collection-grid">
        <a class="collection-card collection-art" href="#oeuvres"><span>01 / ART & DÉCORATION</span><strong>Œuvres en bois<br/>et créations 3D</strong><b>Explorer <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></b></a>
        <a class="collection-card collection-gift" href="#sur-mesure"><span>02 / CADEAUX</span><strong>Objets personnalisés<br/>et souvenirs</strong><b>Imaginer <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></b></a>
        <a class="collection-card collection-print" href="#imprimerie"><span>03 / IMPRIMERIE</span><strong>Cartes, invitations<br/>et supports imprimés</strong><b>Découvrir <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></b></a>
      </div>
    </section>

    <section class="print-section section-wrap" id="imprimerie">
      <div class="print-visual"><img src="https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=1100&q=85" alt="Faire-part et cartes d’invitation imprimés" /><span class="sample-tag"></span></div>
      <div class="print-copy"><p class="eyebrow">SÉLECTION · 03</p><h2>Le papier aussi devient création.</h2><p>Invitations, cartes de vœux, cartes postales, cartes de service, cartes de visite et supports de communication : des impressions pensées pour marquer les esprits.</p><ul><li>Formats et papiers au choix</li><li>Impression recto ou recto-verso</li><li>Finitions et quantités personnalisables</li></ul><a class="text-link" href="#sur-mesure">Parler de mon projet <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a></div>
    </section>

    <section class="custom-section" id="sur-mesure"><div class="custom-inner section-wrap"><div><p class="eyebrow">VOTRE IDÉE, NOTRE SAVOIR-FAIRE</p><h2>Une pièce unique commence par une conversation.</h2><p>Vous avez un modèle, une dimension ou une idée précise ? Présentez-nous votre projet. Nous étudierons les possibilités et vous proposerons un devis adapté.</p></div><div class="custom-cta"><span>CRÉATION SUR COMMANDE</span><a class="button button-yellow" href="https://wa.me/243999214448?text=Bonjour%20UBUNTU%20SHOP%2C%20je%20souhaite%20discuter%20d'une%20cr%C3%A9ation%20sur%20mesure." target="_blank" rel="noopener">Demander un devis <b><svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></b></a><small>Échange direct avec notre équipe à Goma</small></div></div></section>

    <section class="how-section section-wrap"><div class="section-heading"><div><p class="eyebrow">SIMPLE & DIRECT</p><h2>Comment commander ?</h2></div><p>Un parcours clair, de la découverte à la réception de votre création.</p></div><div class="steps-grid"><div><span>01</span><h3>Choisissez</h3><p>Parcourez les créations ou décrivez votre besoin.</p></div><div><span>02</span><h3>Échangez</h3><p>Confirmez les détails, le prix et le délai avec l’équipe.</p></div><div><span>03</span><h3>Confirmez</h3><p>Validez la commande et les modalités de paiement convenues.</p></div><div><span>04</span><h3>Recevez</h3><p>Retirez votre commande ou organisez la livraison.</p></div></div></section>

    <section class="contact-section section-wrap" id="contact"><div><p class="eyebrow">UBUNTU HOLDING DRC · GOMA</p><h2>Faisons exister votre prochaine idée.</h2></div><div class="contact-details"><a href="https://wa.me/243999214448" target="_blank" rel="noopener">WhatsApp · +243 999 214 448 <svg class="icon-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a><a href="mailto:ubunturdc@gmail.com">ubunturdc@gmail.com</a><p>23 Av. Kinshasa, Route 1 km Témoin, Goma, RDC</p></div></section>
  </main>
  <footer class="site-footer"><div class="footer-pattern" aria-hidden="true"><img src="/assets/brand/hexagons-tricolor.png" alt="" /></div><div class="footer-inner"><span>© <span id="year"></span> UBUNTU HOLDING DRC</span><span>DESIGN & DIGITAL · RIGOURA DESIGN</span><span>UBUNTU HOLDING DRC · GOMA</span></div></footer>
  <script>
    const products = [["sculpture-bois","Œuvre murale en bois sculpté","ŒUVRE EN BOIS","Pièce murale en bois travaillée en relief, avec une finition qui laisse apparaître le veinage naturel du bois.","Sur devis","https://i.etsystatic.com/20262922/r/il/d3fdb3/6514267928/il_1080xN.6514267928_pkna.jpg","Bois sculpté ou découpé · décoration murale","Dimensions, essence du bois, épaisseur, finition et mode de fixation à préciser selon la pièce.","https://i.etsystatic.com/20262922/r/il/292553/4632841374/il_794xN.4632841374_jvpm.jpg","https://www.krintech.co.uk/assets/images/wood/laser-engraved-walnut-block_feature.jpg"],["plaque-gravee","Plaque signalétique gravée sur bois","GRAVURE SUR BOIS","Plaque en bois avec texte, nom, logo ou motif gravé au laser. Adaptée à la signalétique intérieure, aux bureaux et aux espaces d’accueil.","Sur devis","https://www.krintech.co.uk/assets/images/wood/laser-engraved-walnut-block_feature.jpg","Support bois · gravure laser · finition personnalisée","Format, épaisseur, essence, texte, logo et fixation murale à définir.","https://i.etsystatic.com/20262922/r/il/292553/4632841374/il_794xN.4632841374_jvpm.jpg","https://i.etsystatic.com/20262922/r/il/d3fdb3/6514267928/il_1080xN.6514267928_pkna.jpg"],["invitation-bois","Faire-part de mariage gravé sur bois","INVITATION EN BOIS","Carte d’invitation en bois gravée ou découpée, à remettre aux familles et aux invités pour une cérémonie de mariage ou une célébration.","Sur devis","https://i.etsystatic.com/31627371/r/il/0e0841/4006262414/il_1080xN.4006262414_14sc.jpg","Bois fin · gravure ou découpe laser · enveloppe possible","Noms des mariés, date, lieu de la cérémonie, programme, format et quantité.","https://personalisedfavours.co.nz/cdn/shop/files/Engraved-Wooden-DL-Wedding-Invitation-1.jpg?v=1707265034&width=800","https://www.everfulwholesale.com/cdn/shop/files/EVFVX8WJZY3.jpg"],["invitation-papier","Faire-part de mariage imprimé – style wax","PAPETERIE · INVITATION","Faire-part imprimé avec motifs inspirés des tissus wax, pour annoncer le mariage civil, la bénédiction nuptiale et la réception.","Sur devis","https://static.wixstatic.com/media/227cec_c637c16f222842809fb1a6b03bcd22e5~mv2.jpg/v1/fill/w_980%2Ch_980%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/227cec_c637c16f222842809fb1a6b03bcd22e5~mv2.jpg","Carton imprimé · enveloppe · finitions au choix","Format, grammage, couleurs, quantité et impression recto-verso.","https://www.lecomptoirdubonheur.com/wp-content/uploads/2022/10/faire-part-mariage-theme-africain-wax-29.png","https://koala.sh/api/image/v2-r31i5-ndupz.jpg?dream=&height=1216&width=832"],["invitation-classique","Carte d’invitation pour cérémonie","PAPETERIE · INVITATION","Carte d’invitation pour mariage, anniversaire, dot, jubilé, remise de diplôme ou autre cérémonie familiale.","Sur devis","https://i.etsystatic.com/12733236/r/il/41c5c6/2835286652/il_fullxfull.2835286652_81ll.jpg","Papier couché ou cartonné · impression couleur","Texte, photos, format, enveloppe, quantité et finitions à préciser.","https://static.wixstatic.com/media/227cec_81c5af91113849129517d31fca418031~mv2.jpg/v1/fill/w_2000%2Ch_2000%2Cal_c%2Cq_90%2Cenc_avif%2Cquality_auto/227cec_81c5af91113849129517d31fca418031~mv2.jpg","https://www.lecomptoirdubonheur.com/wp-content/uploads/2022/10/faire-part-mariage-theme-africain-wax-29.png"],["calendrier-photo","Calendrier mural personnalisé avec photos","IMPRESSION · CALENDRIER","Calendrier mural illustré avec vos photos, les dates importantes et les événements à retenir tout au long de l’année.","Sur devis","https://cdn.sanity.io/images/8ihypsrf/production/a778f385a510072400a30620b1a0a2fda0e44ee4-1500x1500.jpg?auto=format&fit=clip&q=75&w=3840","Papier cartonné · reliure spirale ou support mural","Format A4 ou A3 selon modèle, nombre de pages, photos et mois de départ.","https://cms.cloudinary.vpsvc.com/images/if_ar_gt_1.1/c_scale%2Ct_pdpHeroGallery_Gallery/if_else/c_scale%2Cw_816/if_end/f_auto%2Cq_auto%3Abest%2Cdpr_1.0/legacy_dam/en-us/S001798081/NPIB-32843-Wall-Calendars-Marquee-007","https://www.thephotogift.com/cdn/shop/files/2025-photo-wall-calendar.jpg"],["cadre-photo","Cadres photos muraux en bois","PHOTO · DÉCORATION","Cadre mural pour portraits, photos de famille, souvenirs et décoration intérieure. Disponible en composition simple ou en galerie de plusieurs cadres.","Sur devis","https://artstreet.in/cdn/shop/products/ASPWT24269-SIDE-1_700x700.jpg?v=1686141105","Cadre bois · protection selon modèle · fixation murale","Dimensions, orientation portrait ou paysage, couleur et nombre de cadres.","https://www.photomon.com/assets/images/20260306/2026030620260306175230.png","https://artstreet.in/cdn/shop/products/ASPWT24269-SIDE-1_700x700.jpg?v=1686141105"],["creation-sur-mesure","Création personnalisée sur commande","SUR MESURE","Une réalisation adaptée à votre besoin : plaque nominative, décoration murale, cadeau personnalisé ou support de communication.","Sur devis","https://i.etsystatic.com/20262922/r/il/d3fdb3/6514267928/il_1080xN.6514267928_pkna.jpg","Matériaux et finitions selon projet","Décrivez le modèle, les dimensions, la quantité et le délai souhaité.","https://www.krintech.co.uk/assets/images/wood/laser-engraved-walnut-block_feature.jpg","https://artstreet.in/cdn/shop/products/ASPWT24269-SIDE-1_700x700.jpg?v=1686141105"]]
    const renderProductPage = () => {
      const slug = location.pathname.split('/')[2];
      if (!slug) return;
      const p = products.find(item => item[0] === slug);
      if (!p) return;
      const related = products.filter(item => item[0] !== slug).slice(0,3);
      const main = document.querySelector('main');
      const relatedHtml = related.map(item => '<article class="product-card"><a class="product-card-link" href="/produit/' + item[0] + '"><div class="product-image"><img src="' + item[5] + '" alt="' + item[1] + '" loading="lazy"></div><div class="product-info"><p class="product-category">' + item[2] + '</p><h3>' + item[1] + '</h3><p>' + item[3] + '</p><strong>' + item[4] + '</strong></div></a></article>').join('');
      const message = encodeURIComponent('Bonjour UBUNTU SHOP, je souhaite commander : ' + p[1] + '. Pouvez-vous me renseigner sur les options et le prix ?');
      main.innerHTML = '<section class="product-detail section-wrap"><a class="detail-back" href="/#oeuvres">← Retour aux œuvres</a><div class="detail-layout"><div class="detail-gallery"><img class="detail-main-image" id="detail-main-image" src="' + p[5] + '" alt="' + p[1] + '"><div class="detail-thumbnails"><button data-image="' + p[5] + '" class="active"><img src="' + p[5] + '" alt="Vue principale"></button><button data-image="' + (p[8] || p[5]) + '"><img src="' + (p[8] || p[5]) + '" alt="Vue complémentaire"></button><button data-image="' + (p[9] || p[5]) + '"><img src="' + (p[9] || p[5]) + '" alt="Détail du produit"></button></div><p class="gallery-note">Découvrez les différentes vues du produit et contactez notre équipe pour choisir les dimensions et finitions.</p></div><div class="detail-copy"><p class="eyebrow">' + p[2] + '</p><h1>' + p[1] + '</h1><p class="detail-price">' + p[4] + '</p><p class="detail-description">' + p[3] + '</p><h2>Caractéristiques</h2><p>' + p[6] + '</p><h2>Personnalisation et détails</h2><p>' + p[7] + '</p><div class="detail-actions"><a class="button button-yellow" target="_blank" rel="noopener" href="https://wa.me/243999214448?text=' + message + '">Commander / demander un devis</a></div></div></div><section class="related-products"><p class="eyebrow">POUR COMPLÉTER VOTRE DÉCOUVERTE</p><h2>Articles similaires</h2><div class="product-grid">' + relatedHtml + '</div></section></section>';
      document.querySelectorAll('.detail-thumbnails button').forEach(btn => btn.addEventListener('click', () => { document.getElementById('detail-main-image').src = btn.dataset.image; document.querySelectorAll('.detail-thumbnails button').forEach(x => x.classList.remove('active')); btn.classList.add('active'); }));
      document.title = p[1] + ' — UBUNTU SHOP';
    };
    renderProductPage();
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

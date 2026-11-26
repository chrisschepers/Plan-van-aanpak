# poortwachtercheck.nl

Website van **Poortwachtercheck**: een dossiercheck van het re-integratieverslag
(Wet verbetering poortwachter), zodat het verslag compleet naar UWV gaat en de
werkgever geen loonsanctie krijgt. Een dienst van Schepers Digital.

De site is een startpagina met een privacyverklaring als overlay, plus vier
uitlegpagina's (eerstejaarsevaluatie, eindevaluatie, administratieve loonsanctie,
WIA-aanvraag als werknemer). Er is geen backend: de knoppen openen het eigen
mailprogramma.

Alle pagina's worden bij de build vooraf naar HTML gerenderd, zodat zoekmachines
en AI-crawlers de tekst zien zonder JavaScript. De startpagina wordt daarna in de
browser overgenomen door `app.js` (hydrate); de uitlegpagina's hebben geen
JavaScript.

## Hosting

GitHub Pages serveert deze tak rechtstreeks op https://poortwachtercheck.nl
(zie `CNAME`). Samenvoegen naar deze tak zet een wijziging dus meteen live.

## Ontwikkelen

```bash
npm ci
npm run build   # app.js, index.html, <slug>/index.html en sitemap.xml
npm test        # smoke-test van de startpagina in jsdom
```

Commit de gegenereerde bestanden altijd mee (`app.js`, `index.html`, de mappen per
uitlegpagina en `sitemap.xml`): CI controleert dat een verse build niets verandert.
Bewerk ze dus nooit met de hand; pas `src/` of `build.mjs` aan.

| Bestand | Wat het doet |
|---|---|
| `build.mjs` | Bundelt `src/client.jsx` naar `app.js` en rendert alle pagina's vooraf, met meta-gegevens en JSON-LD |
| `index.html`, `<slug>/index.html`, `sitemap.xml` | Gegenereerd door de build |
| `styles.css` | Opmaak van de pagina; begint met de Hallmark-stempel en importeert de twee bestanden hieronder |
| `tokens.css` | Kleuren, lettertypen, maten en tempo's als variabelen (petrol, oker, Source Serif 4, Hanken Grotesk) |
| `base.css` | Basisregels die voor elke pagina gelden (focusrand, geen zijwaarts schuiven, minder beweging) |
| `src/app.jsx` | De startpagina met de privacyverklaring als overlay |
| `src/client.jsx` | Browser-entry: neemt de vooraf gerenderde HTML over |
| `src/server.jsx` | Build-entry: componenten en gestructureerde data (JSON-LD) per pagina |
| `src/artikelen.jsx` | De uitlegpagina's: tekst, bronnen en opmaak |
| `src/landing.jsx` | De startpagina: prijsoverzicht, waarom, werkwijze, tarieven, werknemers, afspraken, vragen, contact |
| `src/privacy.jsx` | Privacyverklaring |
| `src/merk.jsx` | Merknaam, contactadres en woordmerk |
| `src/iconen.jsx` | De paar inline iconen |
| `test/smoke.mjs` | Rendert de pagina en controleert de belangrijkste onderdelen |

React en ReactDOM komen als UMD-scripts van unpkg (versie vast, met SRI-hash).

## Oude invuller

Tot 21 november 2026 stond hier de Plan-van-aanpak-invuller (planvanaanpakinvuller.nl,
met backend op Railway en Supabase). Die is gestopt. De code staat nog in de
git-geschiedenis, tot en met commit `d393966`.

## Ontwerp

Het ontwerp is op 22 november 2026 vernieuwd met de Hallmark-skill (redesign, merk behouden).
Alleen het logboek van die run (`.hallmark/log.json`) gaat mee in git; de schermafbeeldingen
en de voor-en-navergelijking in `.hallmark/` zijn lokale werkbestanden.

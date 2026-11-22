# poortwachtercheck.nl

Website van **Poortwachtercheck**: een dossiercheck van het re-integratieverslag
(Wet verbetering poortwachter), zodat het verslag compleet naar UWV gaat en de
werkgever geen loonsanctie krijgt. Een dienst van Schepers Digital.

De site is één pagina met een privacyverklaring als overlay. Er is geen backend:
de snelle checklist werkt alleen in de browser en de knoppen openen het eigen
mailprogramma.

## Hosting

GitHub Pages serveert deze tak rechtstreeks op https://poortwachtercheck.nl
(zie `CNAME`). Samenvoegen naar deze tak zet een wijziging dus meteen live.

## Ontwikkelen

```bash
npm ci
npm run build   # bundelt src/ naar app.js
npm test        # smoke-test van de startpagina in jsdom
```

Commit `app.js` altijd mee: CI controleert dat het gelijk is aan een verse build.

| Bestand | Wat het doet |
|---|---|
| `index.html` + `styles.css` | Pagina en stijl |
| `src/app.jsx` | Startpunt: startpagina met de privacyverklaring als overlay |
| `src/landing.jsx` | De startpagina: checklist, werkwijze, tarieven, vragen, contact |
| `src/privacy.jsx` | Privacyverklaring |
| `src/merk.jsx` | Merknaam, contactadres en woordmerk |
| `src/iconen.jsx` | De paar inline iconen |
| `test/smoke.mjs` | Rendert de pagina en controleert de belangrijkste onderdelen |

React en ReactDOM komen als UMD-scripts van unpkg (versie vast, met SRI-hash).

## Oude invuller

Tot 21 november 2026 stond hier de Plan-van-aanpak-invuller (planvanaanpakinvuller.nl,
met backend op Railway en Supabase). Die is gestopt. De code staat nog in de
git-geschiedenis, tot en met commit `d393966`.

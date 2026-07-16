# planvanaanpakinvuller.nl

Website + tool die werkgevers en casemanagers helpt om automatisch een **concept
Plan van Aanpak** (Wet verbetering poortwachter) in te vullen. Upload de
terugkoppeling van de bedrijfsarts en krijg drie onderdelen terug:

1. **Opbouw- en re-integratieadvies** — opbouwschema met data en herstelpercentages
2. **Ingevuld concept Plan van Aanpak**
3. **Begeleidend bericht aan de werkgever**

Kernprincipes: **privacy by design** (medische gegevens worden er juist
úítgefilterd), **mens in de loop** (per veld is de bronpassage zichtbaar en is
controle verplicht vóór downloaden) en een **hybride aanpak** (AI extraheert de
feiten, een vaste rekenmotor berekent het schema — deterministisch, geen
verzinsels).

Het Plan van Aanpak volgt het **officiële UWV-format (formulier AG140, secties
1–10)** en de adviesmotor volgt de **Werkwijzer Poortwachter** (Agentprompt PvA
v2): procesadviezen op verzuimweek, leeftijdsregels (AOW/spoor 2, vereenvoudigde
60+-WIA-beoordeling) en het ziek-uit-dienst-blok (geen/verkort/volledig RIV) op
basis van de einddatum dienstverband. De download is een **echt `.docx`**.

> **Status: front-end MVP.** De website werkt volledig met de voorbeeldcasus
> (J. de Vries). Je kunt een eigen (PDF/Word) bestand uploaden om de flow te
> testen; de AI-extractie van échte documenten (de backend) is de volgende stap.
> Zie ook `AANLEVERDOCUMENT.md`.
>
> ⚠️ **Privacy/cybersecurity — hard aandachtspunt.** Zodra hier echte
> (medische/persoons)gegevens verwerkt gaan worden, MOET de repository terug
> naar **privé** en moet de hosting naar een afgeschermde, AVG-proof omgeving
> binnen de EER (met verwerkersovereenkomst, logging, toegangsbeheer). Gebruik
> tot die tijd uitsluitend **fictieve** terugkoppelingen. BSN wordt nooit
> verwerkt; medische gegevens worden bewust uitgefilterd.

## Bekijken

Open `index.html` in een browser — geen installatie nodig. Of zet de repository
op GitHub Pages (Settings → Pages → main branch, root).

## Ontwikkelen

De broncode staat in `src/` (React-componenten). Na een wijziging bundel je
opnieuw naar `app.js`:

```bash
npm install
npm run build   # bundelt src/ naar app.js
npm test        # smoke-test: klikt de hele flow door in jsdom
```

| Bestand | Wat het doet |
|---|---|
| `index.html` + `styles.css` / `tool.css` | Pagina en visuele stijl (navy `#1F3864`, groen accent) |
| `src/landing.jsx` | Landingspagina (hero, hoe het werkt, USP's, compliance, FAQ) |
| `src/tool.jsx` | De invuller: upload → verificatie → preview/download |
| `src/sourcedoc.jsx` | Brondocument met highlights (functioneel) en redacties (medisch) |
| `src/fields.jsx` | Bewerkbare geëxtraheerde velden + opbouwschema-tabel |
| `src/previews.jsx` | Previews van de vier onderdelen, gevuld met de gecontroleerde waarden |
| `src/engine.js` | Rekenmotor: deterministisch opbouwschema |
| `src/advice.js` | Adviesmotor: verzuimweek-tijdlijn, leeftijd (AOW/60+), ziek-uit-dienst |
| `src/download.js` | Echte `.docx`-export (docx-bibliotheek) van alle onderdelen |
| `src/casedata.js` | Voorbeeldcasus, veldenset en helpers (pure data, los testbaar) |
| `src/data.jsx` | Iconen + re-export van `casedata.js` |

Tests: `test/docx.mjs` (echte .docx genereren en de inhoud valideren) en
`test/smoke.mjs` (de volledige klik-flow in jsdom).

## AI-backend (echte documenten uitlezen)

De map `server/` bevat een Node-backend die met **Claude** (`@anthropic-ai/sdk`)
de terugkoppeling van de bedrijfsarts uitleest en de functionele gegevens
teruggeeft (medisch filter + BSN-regel). Deploy die op Railway en zet de URL in
`index.html` (`window.__PVA_BACKEND__`). Zie **`server/README.md`** voor de
stappen. Zonder backend werkt de site in demo-modus (voorbeeldcasus).

Flow: upload/plak → backend (Claude extraheert) → frontend bouwt het opbouwschema
(rekenmotor) → verificatie → UWV-PvA + brief. De API-sleutel staat **alleen** op
Railway, nooit in de repo of de frontend.

## Volgende stappen

- [x] Backend: echte documenten verwerken (AI-extractie met bronverwijzing + medisch filter)
- [ ] Repo terug naar privé + AVG-proof hosting binnen de EER + DPA met Anthropic vóór echte data
- [ ] Einddoel-vinkje automatisch aankruisen in het UWV-formulier
- [ ] Bedrijfsnaam, KVK, logo en privacyverklaring invullen (nu `[INVULLEN]`)
- [ ] Adviesregels fijnslijpen tegen het kennisdocument (Agentprompt PvA v2)

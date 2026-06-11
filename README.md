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

> **Status: front-end MVP.** De website werkt volledig met de voorbeeldcasus
> (J. de Vries). De AI-extractie van échte documenten (de backend) is de
> volgende stap. Zie ook `AANLEVERDOCUMENT.md` voor wat daarvoor aangeleverd
> moet worden.

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
| `src/previews.jsx` | Previews van de drie onderdelen, gevuld met de gecontroleerde waarden |
| `src/engine.js` | Rekenmotor: deterministisch opbouwschema |
| `src/download.js` | Echte Word-download (.doc) van de drie onderdelen |
| `src/data.jsx` | Voorbeeldcasus, veldenset en iconen |

## Volgende stappen

- [ ] Backend: echte documenten verwerken (AI-extractie met bronverwijzing)
- [ ] Eigen domein + hosting (EER)
- [ ] Bedrijfsnaam, KVK en privacyverklaring invullen (nu `[INVULLEN]`)
- [ ] Export als echt `.docx` met huisstijlsjabloon

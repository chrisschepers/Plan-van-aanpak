# AI-extractie backend (Railway)

Kleine Node-service die de terugkoppeling van de bedrijfsarts leest met **Claude**
en de **functionele** gegevens teruggeeft als JSON. Medische informatie en het
BSN worden nooit overgenomen (kernregels uit het kennisdocument). Het
opbouwschema wordt **niet** hier berekend — dat doet de rekenmotor in de
frontend, deterministisch.

## Endpoints
- `GET /health` — status (`keyConfigured` laat zien of de API-sleutel is gezet)
- `POST /api/extract` — `multipart/form-data` met veld **`document`** (PDF/Word/txt)
  **of** JSON `{ "text": "..." }` → `{ ok: true, data: { ... } }`

## Lokaal draaien
```bash
cd server
npm install
export ANTHROPIC_API_KEY=sk-ant-...      # jouw sleutel
npm start                                # luistert op poort 8080
curl -s localhost:8080/health
```

## Uitproberen hoe de bot terugkoppelingen leest (lokaal, zonder site)
Met een API-sleutel kun je direct zien hoe de bot een terugkoppeling interpreteert:
```bash
cd server
npm install
export ANTHROPIC_API_KEY=sk-ant-...
node try.mjs samples/terugkoppeling-01.txt
node try.mjs samples/terugkoppeling-03.txt
```
Je krijgt de gestructureerde JSON terug (functionele velden + bronnen + reken-
uitgangspunten + signalen). In `samples/` staan 10 realistische fictieve
terugkoppelingen (conform AVG/NVAB: zonder medische informatie of BSN), elk met
een ander scenario — zie `samples/00-overzicht-terugkoppelingen.txt` voor wat je
per casus mag verwachten. `samples/99-filtertest.txt` is een bewust fout document
(mét diagnose/BSN) om te controleren dat het filter zulke gegevens tegenhoudt.

Een functieomschrijving meegeven (voor de taaksuggestie):
```bash
node try.mjs samples/terugkoppeling-03.txt mijn-functieomschrijving.txt
```

## Deployen op Railway
1. **railway.app** → *New Project* → *Deploy from GitHub repo* → kies deze repo.
2. **Root Directory** instellen op **`server`** (Settings → Root Directory).
   Railway detecteert Node en draait automatisch `npm install` + `npm start`.
3. **Variables** toevoegen:
   - `ANTHROPIC_API_KEY` = jouw Claude API-sleutel  *(verplicht; staat alleen hier)*
   - `ALLOWED_ORIGIN` = `https://chrisschepers.github.io`  *(CORS; aanbevolen)*
   - optioneel `PVA_MODEL` = `claude-sonnet-4-6`  *(goedkoper dan de standaard `claude-opus-4-8`)*
4. **Region**: kies een **EU-regio** (EER) — belangrijk zodra je richting echte
   gegevens gaat.
5. Railway geeft een publieke URL, bijv. `https://pva-backend.up.railway.app`.
   Test: `curl https://<jouw-url>/health`.

## Frontend koppelen
Zet de Railway-URL in `index.html` (in de root van de repo):
```html
<script>window.__PVA_BACKEND__ = "https://<jouw-url>";</script>
```
Commit → GitHub Pages herbouwt → de site gebruikt nu de AI.

## Kosten (indicatie)
Een terugkoppeling is kort (~1–2k tokens in, ~1k uit). Met `claude-opus-4-8`
(\$5/\$25 per miljoen tokens) is dat enkele centen per document; `claude-sonnet-4-6`
is goedkoper.

## ⚠️ Privacy / AVG
- De API-sleutel staat **uitsluitend** als Railway-variabele — nooit in de repo
  of de frontend.
- Anthropic traint **niet** op API-data. Voor verwerking van **echte**
  (medische/persoons)gegevens is een verwerkersovereenkomst/DPA met Anthropic en
  een privacy-afweging (EER-regio, bewaartermijnen, logging) nodig. Gebruik tot
  die tijd **uitsluitend fictieve** terugkoppelingen.

/* Genereert server/adviescatalogus.txt: een leesbaar overzicht van ÁLLE adviezen
   die de tool kan geven, letterlijk overgenomen uit de echte adviesregels
   (src/advice.js). Omdat dit bestand uit de code zelf wordt opgebouwd, kan het
   nooit afwijken van wat de tool werkelijk doet.

   Draaien:  node server/genereer-adviescatalogus.mjs   (of: npm run catalogus)   */

import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import {
  POORTWACHTER, TIMELINE, SIGNAAL_ADVIES, computeAdvice, computeDerived,
} from "../src/advice.js";
import { INITIAL_FIELDS } from "../src/casedata.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- hulpfuncties ----------------------------------------------------------
function setField(fields, id, value) {
  return fields.map((g) => ({
    ...g,
    items: g.items.map((it) => it.id === id
      ? { ...it, value, status: value && value !== "[INVULLEN]" ? "ok" : "missing" }
      : it),
  }));
}

// Adviezen die een scenario oplevert bóvenop een referentiescenario.
function extra(scenarioFields, baseFields, reportDate, signalen = {}) {
  const baseTitles = new Set(computeAdvice(baseFields, reportDate, {}).map((a) => a.title));
  return computeAdvice(scenarioFields, reportDate, signalen).filter((a) => !baseTitles.has(a.title));
}

function wrap(text, width = 78, indent = "   ") {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > width) { lines.push(line.trim()); line = w; }
    else line = (line + " " + w).trim();
  }
  if (line) lines.push(line.trim());
  return lines.map((l) => indent + l).join("\n");
}

const LEVEL_LABEL = { deadline: "termijn", risk: "let op", attention: "aandachtspunt", flag: "aanvul-verzoek" };

function adviesBlok(a) {
  let out = ` • ${a.title}   [${LEVEL_LABEL[a.level] || a.level}]\n${wrap(a.body)}`;
  if (a.deadlines && a.deadlines.length) {
    for (const d of a.deadlines) out += `\n     - ${d.date}: ${d.title}. ${d.who}`;
  }
  return out;
}

// ---- vaste voorbeeldcasus (alleen om datums in de teksten te tonen) --------
const REPORT = "06-03-2025"; // spreekuurdatum voorbeeld; eerste ziektedag 03-02-2025
const BASE = INITIAL_FIELDS; // demo: eerste ziektedag 03-02-2025, geboortedatum 14-08-1987

const L = [];
const H = (t) => { L.push("", "=".repeat(80), " " + t, "=".repeat(80), ""); };
const S = (t) => { L.push("", "-".repeat(80), " " + t, "-".repeat(80), ""); };

L.push(
  "================================================================================",
  " ADVIESCATALOGUS — planvanaanpakinvuller.nl",
  "================================================================================",
  "",
  " Dit bestand bevat ALLE adviezen die de tool kan geven, letterlijk overgenomen",
  " uit de echte adviesregels. Het wordt automatisch gegenereerd (npm run catalogus),",
  " dus het kan niet afwijken van wat de tool werkelijk doet.",
  "",
  " Zo lees je dit bestand:",
  " - De AI leest alleen de terugkoppeling en zet 'signalen' aan/uit; de adviezen",
  "   hieronder staan vast in de tool (voorspelbaar en controleerbaar).",
  " - Datums in de voorbeeldteksten zijn rekenvoorbeelden bij eerste ziektedag",
  "   03-02-2025; bij een echte casus rekent de tool met de echte datums.",
  " - Klopt een tekst niet of mis je een advies? Noteer het nummer/de titel en",
  "   beschrijf in gewone taal wat het moet zijn.",
);

// 1. Altijd-adviezen ---------------------------------------------------------
H("1. ALTIJD-ADVIEZEN (in elk begeleidend bericht)");
for (const a of computeAdvice(BASE, REPORT, {}).filter((x) => x.title === "Altijd")) {
  L.push(adviesBlok(a));
}

// 2. Poortwachter-termijnen --------------------------------------------------
H("2. POORTWACHTER-TERMIJNEN (volledig overzicht; staat in scherm én document)");
L.push(" Berekend vanaf de eerste ziektedag. Kolommen: week — mijlpaal — actie werkgever.", "");
for (const m of POORTWACHTER) {
  L.push(` wk ${String(m.week).padStart(3)}  ${m.mijlpaal}`);
  L.push(wrap(m.actie, 74, "         "));
}

// 3. Procesadviezen per verzuimweek -----------------------------------------
H("3. PROCESADVIEZEN PER VERZUIMWEEK (in het begeleidend bericht)");
L.push(
  " Regel: de tool berekent de verzuimweek (spreekuurdatum minus eerste ziektedag)",
  " en neemt de adviezen op die NU spelen of binnen 8 weken gaan spelen.",
  " Alle mogelijke vensters en teksten:", "",
);
for (const t of TIMELINE) {
  const venster = t.to === 999 ? `vanaf wk ${t.from}` : `wk ${t.from}–${t.to}`;
  L.push(` • [${venster}] ${t.title}`);
  L.push(wrap(t.body));
}

// 4. Leeftijdsregels ---------------------------------------------------------
H("4. LEEFTIJDSREGELS (op basis van geboortedatum — automatisch)");
const leeftijdCase = setField(BASE, "geboortedatum", "01-01-1961");
for (const a of extra(leeftijdCase, BASE, REPORT)) L.push(adviesBlok(a), "");
L.push(
  " NB: de AOW-datum wordt indicatief berekend als geboortedatum + 67 jaar en is",
  " ook zichtbaar onder 'Berekend (automatisch)' op het controlescherm.",
);

// 5. Ziek uit dienst ---------------------------------------------------------
H("5. ZIEK UIT DIENST (tijdelijk contract eindigt tijdens ziekte)");
L.push(" De variant hangt af van de ziekteduur op de einddatum van het dienstverband:", "");
const zudScenarios = [
  { kop: "5a. Korter dan 6 weken ziek op de einddatum", eind: "10-03-2025", sig: {} },
  { kop: "5b. 6 t/m 10 weken ziek op de einddatum", eind: "14-04-2025", sig: {} },
  { kop: "5c. Langer dan 10 weken ziek op de einddatum", eind: "30-06-2025", sig: {} },
  { kop: "5d. Langer dan 10 weken, maar volledig herstel binnen 3 maanden verwacht (signaal)", eind: "30-06-2025", sig: { herstelVerwachtBinnen3Maanden: true } },
];
for (const sc of zudScenarios) {
  L.push(` ${sc.kop}`);
  const f = setField(BASE, "einddatum", sc.eind);
  for (const a of extra(f, BASE, REPORT, sc.sig).filter((x) => x.title.startsWith("Ziek uit dienst"))) {
    L.push(wrap(a.body));
  }
  L.push("");
}
const naWacht = setField(BASE, "einddatum", "30-06-2027");
L.push(" 5e. Einddatum ná het einde van de wachttijd");
for (const a of extra(naWacht, BASE, REPORT).filter((x) => x.title.startsWith("Einddatum"))) {
  L.push(wrap(a.body));
}

// 6. Signaal-adviezen --------------------------------------------------------
H("6. SIGNAAL-ADVIEZEN (de AI zet het signaal aan; de tool geeft dit vaste advies)");
L.push(
  " De AI zet een signaal alléén op 'aan' als de terugkoppeling het duidelijk zegt.",
  " Per signaal: wanneer het aangaat en welk advies er dan in het bericht komt.", "",
);
const TRIGGERS = {
  geenBenutbareMogelijkheden: "De bedrijfsarts geeft aan dat er op dit moment geen benutbare arbeidsmogelijkheden zijn.",
  duurzaamGeenMogelijkheden: "Duurzaam geen mogelijkheden én geen herstelverwachting.",
  marginaleMogelijkheden: "Marginale belastbaarheid: maximaal circa 2 uur per dag inzetbaar én zonder uitzicht op opbouw. Bij een opbouwperspectief (tempo genoemd of volgt op het vervolgconsult) gaat dit signaal niet aan.",
  arbeidstherapeutisch: "Werken op arbeidstherapeutische basis (zonder loonwaarde) wordt genoemd.",
  stagnatie: "De opbouw loopt achter op schema, de hervatting is instabiel, of er is uitval/terugval.",
  arbeidsconflict: "Er is sprake van een arbeidsconflict of verstoorde arbeidsverhouding.",
  belastbaarheidNaEerstejaars: "De belastbaarheid ontstaat pas (ruim) na ongeveer een jaar verzuim.",
  gewijzigdeBelastbaarheidSpoor2: "De belastbaarheid is gewijzigd terwijl een tweede-spoortraject loopt.",
};
let nr = 0;
for (const [key, advies] of Object.entries(SIGNAAL_ADVIES)) {
  nr += 1;
  L.push(` 6.${nr}  ${advies.title}   [${LEVEL_LABEL[advies.level]}]`);
  L.push(wrap(`Gaat aan wanneer: ${TRIGGERS[key] || "(zie prompt-context.txt)"}`, 72, "      "));
  L.push("      Advies dat dan in het bericht komt:");
  L.push(wrap(advies.body, 72, "      "));
  L.push("");
}
L.push(
  ` 6.${nr + 1}  Herstel verwacht binnen 3 maanden   [geen eigen alinea]`,
  "      Gaat aan wanneer: de bedrijfsarts verwacht volledig herstel/volledige",
  "      werkhervatting binnen circa 3 maanden.",
  "      Effect: geen losse advies-alinea, maar bij ziek-uit-dienst volstaat dan",
  "      een verkort re-integratieverslag (zie 5d).",
);

// 7. Meldingen bij ontbrekende gegevens --------------------------------------
H("7. MELDINGEN BIJ ONTBREKENDE GEGEVENS (aanvul-verzoeken in het bericht)");
const zonderEZ = setField(BASE, "eersteZ", "[INVULLEN]");
const zonderGebd = setField(BASE, "geboortedatum", "[INVULLEN]");
const flagTitles = new Set();
for (const f of [zonderEZ, zonderGebd, BASE]) {
  for (const a of computeAdvice(f, REPORT, {}).filter((x) => x.level === "flag")) {
    if (!flagTitles.has(a.title)) { flagTitles.add(a.title); L.push(adviesBlok(a), ""); }
  }
}

// 8. Taaksuggestie + disclaimer ----------------------------------------------
H("8. TAAKSUGGESTIE (alleen als een functieomschrijving is meegegeven)");
L.push(
  " De AI stelt 1–3 aangepaste taken voor die passen binnen de afgegeven",
  " belastbaarheid en werkaanpassing. In het bericht komt dat er zo uit te zien:", "",
  "   \"Suggestie voor aangepaste taken. Op basis van de functieomschrijving zou",
  "   je — binnen de afgegeven mogelijkheden — kunnen denken aan <taken van de AI>.",
  "   Let op: dit zijn voorstellen als gespreksopening. Bespreek ze eerst samen",
  "   met de werknemer; ze maken geen onderdeel uit van het Plan van Aanpak en",
  "   mogen niet eenzijdig in het dossier worden opgenomen.\"",
);

// 9. Open punten voor de domeinexpert ----------------------------------------
H("9. OPEN PUNTEN — GRAAG JOUW OORDEEL (domein, geen techniek)");
L.push(
  " a) Grens 'precies 10 weken' bij ziek-uit-dienst: het kennisdocument zegt",
  "    zowel '6 t/m 10 weken → verkort' als '≥ 10 weken → volledig'. De tool",
  "    kiest nu bij precies 10 weken: VERKORT. Akkoord, of moet dit volledig zijn?",
  "",
  " b) AOW-leeftijd staat vast op 67 jaar (indicatief, met SVB-disclaimer in de",
  "    tekst). Goed genoeg, of wil je de exacte AOW-staffel per geboortejaar?",
  "",
  " c) Het IVA-advies (6.2) noemt 'kan tot week 68'. Moet de tool dit advies",
  "    verbergen als de casus al voorbij week 68 is, of altijd tonen?",
  "",
  " d) UWV-formulier sectie 7B/7C/7D (werkplek, werktijden, verhoudingen) wordt",
  "    nog niet automatisch gevuld bij triggers in de terugkoppeling; die",
  "    categorieën blijven [INVULLEN]. Wil je dat ik dit als volgende stap bouw?",
  "",
);

const out = L.join("\n") + "\n";
const dest = join(__dirname, "adviescatalogus.txt");
writeFileSync(dest, out);
console.log(`Geschreven: ${dest} (${out.split("\n").length} regels)`);

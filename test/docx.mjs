/* Node-test van de echte .docx-generatie. Bouwt het document, pakt de
   document.xml uit de .docx-zip en controleert de inhoud:
   UWV-secties, ingevulde + ontbrekende velden, en de adviezen
   (verzuimweek-tijdlijn + ZUD bij ingevulde einddatum). */

import { Packer } from "docx";
import JSZip from "jszip";
import { buildDocxDocument, buildWerknemerDocx } from "../src/download.js";
import { computeAdvice } from "../src/advice.js";
import { INITIAL_FIELDS, CASE, getVal } from "../src/casedata.js";
import { computeSchema, computeWazo } from "../src/engine.js";

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

const schema = computeSchema(CASE);

// helper: zet een veldwaarde (kopie van de tool-logica)
function setField(fields, id, value) {
  return fields.map((g) => ({
    ...g,
    items: g.items.map((it) => it.id === id
      ? { ...it, value, status: value && value !== "[INVULLEN]" ? "ok" : "missing" }
      : it),
  }));
}

async function docZip(fields) {
  const doc = buildDocxDocument(fields, schema, CASE.reportDate);
  const buf = await Packer.toBuffer(doc);
  return JSZip.loadAsync(buf);
}
async function docText(fields) {
  return (await docZip(fields)).file("word/document.xml").async("string");
}
async function allText(zip, prefix) {
  const names = Object.keys(zip.files).filter((n) => n.startsWith(prefix) && n.endsWith(".xml"));
  const parts = await Promise.all(names.map((n) => zip.file(n).async("string")));
  return parts.join("\n");
}

// ---- 1. Basisdocument (velden zoals geëxtraheerd) ----
const zip0 = await docZip(INITIAL_FIELDS);
let xml = await zip0.file("word/document.xml").async("string");

// briefpapier in huisstijl: kop met merknaam + voet met EER/privacy-regel
const headers = await allText(zip0, "word/header");
const footers = await allText(zip0, "word/footer");
check("briefhoofd bevat merknaam", headers.includes("planvanaanpak") && headers.includes("invuller.nl"));
check("briefvoet bevat EER/privacy-regel", footers.includes("EER") && footers.includes("Privacy by design"));
check("briefvoet: website + privacyregel + paginanummers", footers.includes("planvanaanpakinvuller.nl") && footers.includes("Privacy by design") && footers.includes("PAGE") && footers.includes("NUMPAGES"));
check("briefhoofd heeft eerste + vervolgpagina-variant (afbeeldingen)", headers.includes("Vervolg") && Object.keys(zip0.files).some((n) => n.startsWith("word/media/")));

// Dit document is het begeleidend bericht (met opbouwadvies + verweven adviezen);
// het ingevulde Plan van aanpak zelf zit in het echte UWV-sjabloon (zie template.mjs).
check(".docx bevat opbouwadvies", xml.includes("Opbouw- en re-integratieadvies"));
check(".docx verwijst naar UWV-formulier (AG140)", xml.includes("AG140"));
check(".docx is een brief (meta-blok + ondertekening, ontwerp Briefpapier v2)", xml.includes("Ons kenmerk") && xml.includes("[INVULLEN: naam afzender]") && xml.includes("[INVULLEN: functie"));

check(".docx bevat begeleidend bericht aan werkgever", xml.includes("Beste werkgever"));
check(".docx bevat opbouwschema-datum 10-03-2025", xml.includes("10-03-2025"));

check(".docx bevat poortwachter-termijnen", xml.includes("Poortwachter-termijnen") && xml.includes("42e-weeksmelding"));
check("termijnen-bijlage staat aan het einde van de brief (na de afzender)", xml.lastIndexOf("Poortwachter-termijnen") > xml.indexOf("Met vriendelijke groet"));

// met functieomschrijving → taaksuggestie + disclaimer in het bericht
const docTaak = buildDocxDocument(INITIAL_FIELDS, schema, CASE.reportDate, "lichte administratieve taken met afwisseling zitten/staan");
const xmlTaak = await (await JSZip.loadAsync(await Packer.toBuffer(docTaak))).file("word/document.xml").async("string");
check(".docx bevat taaksuggestie", xmlTaak.includes("Suggestie voor aangepaste taken"));
check(".docx bevat disclaimer (niet eenzijdig in dossier)", xmlTaak.includes("niet eenzijdig in het dossier"));

// voorwaardelijk advies op signaal (arbeidsconflict → mediation, 5.3)
const docSig = buildDocxDocument(INITIAL_FIELDS, schema, CASE.reportDate, "", { arbeidsconflict: true });
const xmlSig = await (await JSZip.loadAsync(await Packer.toBuffer(docSig))).file("word/document.xml").async("string");
check(".docx vuurt voorwaardelijk advies (arbeidsconflict → mediation 5.3)", xmlSig.includes("mediation") && xmlSig.includes("5.3"));

// no-riskpolis: alleen als de bedrijfsarts het aangeeft (signaal), met UWV-melding-actie
check(".docx toont GEEN no-risk-advies zonder signaal", !xml.includes("no-risk"));
const docNoRisk = buildDocxDocument(INITIAL_FIELDS, schema, CASE.reportDate, "", { noRiskMogelijk: true });
const xmlNoRisk = await (await JSZip.loadAsync(await Packer.toBuffer(docNoRisk))).file("word/document.xml").async("string");
check(".docx toont no-risk-advies bij signaal (UWV-melding + classificatie)", xmlNoRisk.includes("no-risk") && xmlNoRisk.includes("classificatie") && xmlNoRisk.includes("UWV"));

// adviezen verweven in het begeleidend bericht
check(".docx bevat altijd-advies (verzuimdossier)", xml.includes("verzuimdossier"));
check(".docx bevat procesadvies (PvA uiterlijk week 8)", xml.includes("week 8"));

// Zwangerschap → WAZO/Ziektewet-vangnet-advies, alleen wanneer wazo is meegegeven
const wazoTest = computeWazo({ uitgerekendeDatum: "2025-08-01" });
check("zwangerschapsadvies met wazo (art. 29a)", computeAdvice(INITIAL_FIELDS, CASE.reportDate, {}, { wazo: wazoTest }).some((a) => a.title.startsWith("Zwangerschap") && /art\. 29a/.test(a.body)));
check("geen zwangerschapsadvies zonder wazo", !computeAdvice(INITIAL_FIELDS, CASE.reportDate, {}).some((a) => a.title.startsWith("Zwangerschap")));
const xmlZw = await (await JSZip.loadAsync(await Packer.toBuffer(buildDocxDocument(INITIAL_FIELDS, schema, CASE.reportDate, "", {}, false, "", { wazo: wazoTest })))).file("word/document.xml").async("string");
check(".docx-bericht bevat zwangerschaps-/Ziektewet-advies", xmlZw.includes("Ziektewet") && xmlZw.includes("29a"));
check(".docx neemt vast contract aan bij ontbrekende einddatum (geen flag)", !xml.includes("Einddatum dienstverband ontbreekt"));
check(".docx bevat geen letterlijke [INVULLEN]", !xml.includes("[INVULLEN]"));

// ---- 1d. Tijdlijn-afbeelding (png) → liggende slotpagina i.p.v. termijnen-tabel ----
const TINY_PNG = new Uint8Array(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAen63NgAAAAASUVORK5CYII=", "base64"));
const docImg = buildDocxDocument(INITIAL_FIELDS, schema, CASE.reportDate, "", {}, false, "", { tijdlijnPng: TINY_PNG, pngW: 900, pngH: 500 });
const xmlImg = await (await JSZip.loadAsync(await Packer.toBuffer(docImg))).file("word/document.xml").async("string");
check("met tijdlijn-png: liggende slotpagina (landscape)", xmlImg.includes('w:orient="landscape"'));
check("met tijdlijn-png: titel 'Tijdlijn van het verzuim'", xmlImg.includes("Tijdlijn van het verzuim"));
check("met tijdlijn-png: termijnen-tabel vervangen", !xmlImg.includes("Poortwachter-termijnen"));
check("zonder png: termijnen-tabel blijft (fallback)", xml.includes("Poortwachter-termijnen"));

// ---- 2. Met ingevulde einddatum tijdens ziekte -> ZUD-advies (verkort/volledig RIV) ----
const adviesZud = computeAdvice(setField(INITIAL_FIELDS, "einddatum", "30-06-2025"), CASE.reportDate);
const zud = adviesZud.find((a) => a.title.includes("Ziek uit dienst"));
check("ZUD-advies verschijnt bij einddatum tijdens ziekte", !!zud);
check("ZUD noemt re-integratieverslag", !!zud && /re-integratieverslag/i.test(zud.body));

// ziekteduur 03-02-2025 -> 30-06-2025 ≈ 21 weken => volledig RIV
check("ZUD kiest volledig RIV bij >10 weken ziekte", !!zud && zud.body.includes("Volledig re-integratieverslag"));
check("ZUD noemt participatieverzoek bij UWV", !!zud && zud.body.includes("participatieverzoek"));

// zelfde casus, maar herstel binnen 3 maanden verwacht (signaal) => verkort RIV
const adviesHerstel = computeAdvice(setField(INITIAL_FIELDS, "einddatum", "30-06-2025"), CASE.reportDate, { herstelVerwachtBinnen3Maanden: true });
const zudHerstel = adviesHerstel.find((a) => a.title.includes("Ziek uit dienst"));
check("ZUD + herstel binnen 3 maanden => verkort RIV", !!zudHerstel && zudHerstel.body.includes("Verkort re-integratieverslag volstaat"));

// ---- 3. Leeftijdsregel: oudere werknemer -> 60+/AOW-advies ----
const adviesOud = computeAdvice(setField(INITIAL_FIELDS, "geboortedatum", "01-01-1962"), CASE.reportDate);
const leeftijd = adviesOud.find((a) => a.title.includes("AOW") || a.title.includes("60-plusser"));
check("leeftijdsadvies verschijnt bij oudere werknemer", !!leeftijd);

// ---- 4. Werknemersbrief (eenvoudige taal, B1) ----
const docWn = buildWerknemerDocx(INITIAL_FIELDS, schema, CASE.reportDate, {}, "");
const xmlWn = await (await JSZip.loadAsync(await Packer.toBuffer(docWn))).file("word/document.xml").async("string");
check("werknemersbrief: aanhef", xmlWn.includes("Beste "));
check("werknemersbrief: legt het Plan van Aanpak uit", xmlWn.includes("Wat is een Plan van Aanpak?"));
check("werknemersbrief: privacy-uitleg (medisch blijft privé)", xmlWn.includes("blijft priv"));
check("werknemersbrief: recht op deskundigenoordeel (UWV)", xmlWn.includes("deskundigenoordeel") && xmlWn.includes("uwv.nl"));
check("werknemersbrief: opbouw in gewone taal", xmlWn.includes("stap voor stap"));
check("werknemersbrief: samen ondertekenen", xmlWn.includes("allebei hebben ondertekend"));
check("werknemersbrief: geen werkgeversjargon (RIV/spoor 2/loonsanctie)", !/\bRIV\b|spoor 2|loonsanctie|wachttijd/.test(xmlWn));

// zonder opbouwschema (geen benutbare mogelijkheden) → rustgevende variant
const docWnGeen = buildWerknemerDocx(INITIAL_FIELDS, [], CASE.reportDate, { geenBenutbareMogelijkheden: true }, "Geen benutbare mogelijkheden.");
const xmlWnGeen = await (await JSZip.loadAsync(await Packer.toBuffer(docWnGeen))).file("word/document.xml").async("string");
check("werknemersbrief zonder opbouw: 'niets forceren'-variant", xmlWnGeen.includes("hoeft nu dus niets te forceren"));

console.log(failures === 0 ? "\nAlle docx-checks geslaagd." : `\n${failures} docx-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

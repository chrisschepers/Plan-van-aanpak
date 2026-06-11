/* Node-test van de echte .docx-generatie. Bouwt het document, pakt de
   document.xml uit de .docx-zip en controleert de inhoud:
   UWV-secties, ingevulde + ontbrekende velden, en de adviezen
   (verzuimweek-tijdlijn + ZUD bij ingevulde einddatum). */

import { Packer } from "docx";
import JSZip from "jszip";
import { buildDocxDocument } from "../src/download.js";
import { computeAdvice } from "../src/advice.js";
import { INITIAL_FIELDS, CASE, getVal } from "../src/casedata.js";
import { computeSchema } from "../src/engine.js";

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

async function docText(fields) {
  const doc = buildDocxDocument(fields, schema, CASE.reportDate);
  const buf = await Packer.toBuffer(doc);
  const zip = await JSZip.loadAsync(buf);
  return zip.file("word/document.xml").async("string");
}

// ---- 1. Basisdocument (velden zoals geëxtraheerd) ----
let xml = await docText(INITIAL_FIELDS);

check(".docx bevat opbouwadvies", xml.includes("Opbouw- en re-integratieadvies"));
check(".docx bevat UWV Plan van aanpak", xml.toLowerCase().includes("plan van aanpak"));
check(".docx bevat UWV-secties (genummerd)", xml.includes("Werknemer") && xml.includes("Werkgever") && xml.includes("Arbodienst"));
check(".docx bevat UWV sectie 7 afspraken (7E)", xml.includes("Sociaal-medische zaken") || xml.includes("Afspraken"));
check(".docx bevat AG140-footer", xml.includes("AG140"));
check(".docx bevat Begeleidend bericht", xml.includes("Begeleidend bericht"));

check(".docx bevat naam J. de Vries", xml.includes("J. de Vries"));
check(".docx bevat geboortedatum 14-08-1987", xml.includes("14-08-1987"));
check(".docx houdt BSN op [INVULLEN]", xml.includes("[INVULLEN]"));
check(".docx bevat opbouwschema-datum 10-03-2025", xml.includes("10-03-2025"));

// adviezen verweven in het begeleidend bericht
check(".docx bevat altijd-advies (verzuimdossier)", xml.includes("verzuimdossier"));
check(".docx bevat procesadvies (PvA uiterlijk week 8)", xml.includes("week 8"));
check(".docx vraagt om einddatum dienstverband", xml.includes("einddatum"));

// ---- 2. Met ingevulde einddatum tijdens ziekte -> ZUD-advies (verkort/volledig RIV) ----
const adviesZud = computeAdvice(setField(INITIAL_FIELDS, "einddatum", "30-06-2025"), CASE.reportDate);
const zud = adviesZud.find((a) => a.title.includes("Ziek uit dienst"));
check("ZUD-advies verschijnt bij einddatum tijdens ziekte", !!zud);
check("ZUD noemt re-integratieverslag", !!zud && /re-integratieverslag/i.test(zud.body));

// ziekteduur 03-02-2025 -> 30-06-2025 ≈ 21 weken => volledig RIV
check("ZUD kiest volledig RIV bij >10 weken ziekte", !!zud && zud.body.includes("Volledig re-integratieverslag"));

// ---- 3. Leeftijdsregel: oudere werknemer -> 60+/AOW-advies ----
const adviesOud = computeAdvice(setField(INITIAL_FIELDS, "geboortedatum", "01-01-1962"), CASE.reportDate);
const leeftijd = adviesOud.find((a) => a.title.includes("AOW") || a.title.includes("60-plusser"));
check("leeftijdsadvies verschijnt bij oudere werknemer", !!leeftijd);

console.log(failures === 0 ? "\nAlle docx-checks geslaagd." : `\n${failures} docx-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

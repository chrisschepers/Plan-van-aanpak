/* Test: vult het echte UWV-sjabloon (uwv-template.docx) en controleert dat de
   waarden op de juiste FORMTEXT-posities landen, met behoud van een geldige docx. */

import JSZip from "jszip";
import { readFileSync } from "fs";
import { fillDocumentXml, buildUwvValues } from "../src/filltemplate.js";
import { INITIAL_FIELDS, CASE } from "../src/casedata.js";
import { computeSchema } from "../src/engine.js";

let failures = 0;
const check = (name, cond) => { console.log(`${cond ? "✓" : "✗"} ${name}`); if (!cond) failures++; };

const schema = computeSchema(CASE);
const fields = INITIAL_FIELDS.map((g) => ({
  ...g,
  items: g.items.map((it) => it.id === "werkgever" ? { ...it, value: "Voorbeeld Transport B.V.", status: "ok" } : it),
}));

const tplBuf = readFileSync("uwv-template.docx");
const zip = await JSZip.loadAsync(tplBuf);
const xml = await zip.file("word/document.xml").async("string");

const values = buildUwvValues(fields, schema);
const filled = fillDocumentXml(xml, values);

// Lees de resultaatwaarde (eerste w:t tussen separate en end) per TEXT-veld terug.
function readResults(doc) {
  const types = [...doc.matchAll(/<w:instrText[^>]*>(.*?)<\/w:instrText>/g)]
    .map((m) => (/FORMTEXT/.test(m[1]) ? "text" : /FORMCHECKBOX/.test(m[1]) ? "check" : "other"));
  const seps = [...doc.matchAll(/<w:fldChar w:fldCharType="separate"\s*\/>/g)].map((m) => m.index);
  const ends = [...doc.matchAll(/<w:fldChar w:fldCharType="end"\s*\/>/g)].map((m) => m.index);
  const out = {};
  let ti = 0;
  for (let i = 0; i < types.length; i++) {
    if (types[i] !== "text") continue;
    ti++;
    const tRe = /<w:t(?: [^>]*)?>([\s\S]*?)<\/w:t>/g;
    tRe.lastIndex = seps[i];
    const m = tRe.exec(doc);
    out[ti] = (m && m.index < ends[i]) ? m[1] : "";
  }
  return out;
}

const res = readResults(filled);

check("91 FORMTEXT-velden", Object.keys(res).length === 91);
check("veld 1 (naam) blijft leeg — werkgever vult zelf in", (res[1] || "").trim() === "");
check("veld 2 (BSN) blijft leeg", (res[2] || "").trim() === "");
check("veld 3 (bedrijfsnaam) blijft leeg — werkgever vult zelf in", (res[3] || "").trim() === "");
check("veld 6 = functie", res[6] === "Administratief medewerker");
check("7A activiteit (11) gevuld", res[11].startsWith("Werkgever en werknemer stellen"));
check("7A wie (12)", res[12] === "Werkgever en werknemer");
check("7A planning (13)", res[13] === "Per 10-03-2025");
check("7E opbouw-activiteit (59)", res[59].startsWith("Werknemer hervat/bouwt op"));
check("7E vervolgconsult (62)", res[62].includes("vervolgconsult"));
check("7F evaluatie (71)", res[71].includes("evalueren de voortgang"));

// docx blijft geldig: terugzetten en opnieuw inladen
zip.file("word/document.xml", filled);
const out = await zip.generateAsync({ type: "nodebuffer" });
const reload = await JSZip.loadAsync(out);
check("docx blijft geldig (document.xml herlaadbaar)", !!reload.file("word/document.xml"));
check("logo/fonts behouden", !!reload.file("word/media/image1.png") && !!reload.file("word/fontTable.xml"));

console.log(failures === 0 ? "\nAlle template-checks geslaagd." : `\n${failures} template-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

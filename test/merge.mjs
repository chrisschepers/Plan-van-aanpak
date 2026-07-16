/* Test: brief (briefpapier) + ingevuld UWV-PvA samenvoegen tot één document.
   Controleert dat het formulier ongewijzigd blijft en de brief ervoor staat,
   en dat het pakket consistent is (content types, rels, twee secties). */

import JSZip from "jszip";
import { Packer } from "docx";
import { readFileSync } from "fs";
import { buildDocxDocument } from "../src/download.js";
import { fillDocumentXml, buildUwvValues } from "../src/filltemplate.js";
import { mergeLetterAndForm } from "../src/merge.js";
import { INITIAL_FIELDS, CASE } from "../src/casedata.js";
import { computeSchema } from "../src/engine.js";

let failures = 0;
const check = (n, c) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) failures++; };

const schema = computeSchema(CASE);
const fields = INITIAL_FIELDS.map((g) => ({ ...g, items: g.items.map((it) =>
  it.id === "werkgever" ? { ...it, value: "Voorbeeld Transport B.V.", status: "ok" } : it) }));

// Referentie: het kale ingevulde formulier (om "ongewijzigd" te vergelijken)
const tpl = await JSZip.loadAsync(readFileSync("uwv-template.docx"));
const formXml = fillDocumentXml(await tpl.file("word/document.xml").async("string"), buildUwvValues(fields, schema));
const formBodyInner = formXml.slice(formXml.indexOf("<w:body>") + 8, formXml.lastIndexOf("</w:body>"));
// De formulier-INHOUD (alles vóór de body-sectPr) moet letterlijk behouden blijven;
// de merge mag wél de sectPr aanvullen (lege eerste-pagina-header, zie hieronder).
const formContent = formBodyInner.slice(0, formBodyInner.lastIndexOf("<w:sectPr"));

// Bouw los formulier-pakket (zoals downloadUwvPva doet)
const formZip = await JSZip.loadAsync(readFileSync("uwv-template.docx"));
formZip.file("word/document.xml", formXml);
const formBuf = await formZip.generateAsync({ type: "nodebuffer" });

// Brief
const letterBuf = await Packer.toBuffer(buildDocxDocument(fields, schema, CASE.reportDate));

// Samenvoegen
const mergedBuf = await mergeLetterAndForm(letterBuf, formBuf);
const M = await JSZip.loadAsync(mergedBuf);
const mDoc = await M.file("word/document.xml").async("string");
const mCT = await M.file("[Content_Types].xml").async("string");
const mRels = await M.file("word/_rels/document.xml.rels").async("string");

// 1) Formulier-inhoud ongewijzigd: alle formuliervelden/-tekst komen letterlijk voor
check("UWV-formulierinhoud letterlijk ongewijzigd aanwezig", mDoc.includes(formContent));
check("91 FORMTEXT-velden behouden", (mDoc.match(/FORMTEXT/g) || []).length === 91);
// De formuliersectie krijgt een eigen lege eerste-pagina-header (geen briefhoofd-lek)
check("formuliersectie heeft eigen eerste-pagina-header", mDoc.includes('w:headerReference w:type="first"') && !!M.file("word/headerBlank.xml"));
const formSectPr = mDoc.slice(mDoc.lastIndexOf("<w:sectPr"));
check("formulier behoudt eigen default-header (UWV)", /w:headerReference[^>]*w:type="default"[^>]*r:id="rId12"/.test(formSectPr));
check("UWV-logo/fonts behouden", !!M.file("word/media/image1.png") && !!M.file("word/fontTable.xml"));
check("AG140-footer behouden", !!M.file("word/footer1.xml"));

// 2) Brief staat ervoor (vóór het formulier)
check("brief vóór formulier", mDoc.indexOf("Beste werkgever") >= 0 && mDoc.indexOf("Beste werkgever") < mDoc.indexOf(formBodyInner.slice(0, 80)));
check("brief bevat opbouwadvies", mDoc.includes("Opbouw- en re-integratieadvies"));
const letterHeaders = Object.keys(M.files).filter((n) => /^word\/headerLetter\d+\.xml$/.test(n));
const letterFooters = Object.keys(M.files).filter((n) => /^word\/footerLetter\d+\.xml$/.test(n));
check("briefhoofd-parts toegevoegd (eerste + vervolgpagina)", letterHeaders.length === 2);
check("briefvoet-parts toegevoegd (eerste + vervolgpagina)", letterFooters.length === 2);
const headerXmls = await Promise.all(letterHeaders.map((n) => M.file(n).async("string")));
check("briefhoofd bevat merknaam", headerXmls.some((x) => x.includes("planvanaanpak")));

// 2b) Briefpapier-afbeeldingen (merkband/golven/logo) zijn meegekomen
const letterMedia = Object.keys(M.files).filter((n) => /^word\/media\/letter-/.test(n));
check("briefpapier-afbeeldingen meegenomen (apart van UWV-media)", letterMedia.length >= 3);
const headerRels = Object.keys(M.files).filter((n) => /^word\/_rels\/headerLetter\d+\.xml\.rels$/.test(n));
check("kop-relaties (afbeeldingen) aanwezig", headerRels.length === 2);
for (const hr of headerRels) {
  const rl = await M.file(hr).async("string");
  check(`media-verwijzingen in ${hr.split("/").pop()} resolven`, [...rl.matchAll(/Target="([^"]+)"/g)].every((m) => !!M.file("word/" + m[1])));
}

// 3) Pakket consistent
check("twee secties (2× sectPr)", (mDoc.match(/<w:sectPr/g) || []).length === 2);
check("content-types kent headerLetter-parts", letterHeaders.every((n) => mCT.includes("/" + n)));
check("content-types kent png", /Extension="png"/.test(mCT));
check("rels kent headerLetter + footerLetter", mRels.includes("headerLetter1.xml") && letterFooters.every((n) => mRels.includes(n.replace("word/", ""))));
// elke r:id in document.xml moet in rels bestaan
const relIds = new Set([...mRels.matchAll(/Id="(rId\d+)"/g)].map((m) => m[1]));
const used = [...mDoc.matchAll(/r:id="(rId\d+)"/g)].map((m) => m[1]);
check("alle header/footer-verwijzingen resolven", used.every((id) => relIds.has(id)));

// 3b) Eventuele brief-hyperlinks moeten als EXTERNE relatie meekomen en resolven.
// Sinds het no-risk-advies uit het begeleidend bericht is, bevat de standaardbrief geen
// hyperlinks meer; deze checks borgen dat ZODRA een advies wél een link bevat, de merge
// die correct als externe relatie meeneemt en de verwijzing oplost.
const hyperRels = [...mRels.matchAll(/<Relationship[^>]*\/hyperlink"[^>]*>/g)].map((m) => m[0]);
check("alle brief-hyperlinks zijn externe relaties", hyperRels.every((r) => r.includes('TargetMode="External"')));
// De docx-lib geeft hyperlinks een NIET-numeriek rId (bv. rIdab12cd) — match elk Id.
const allRelIds = new Set([...mRels.matchAll(/Id="([^"]+)"/g)].map((m) => m[1]));
const hyperUsed = [...mDoc.matchAll(/<w:hyperlink[^>]*r:id="([^"]+)"/g)].map((m) => m[1]);
check("brief-hyperlink-verwijzingen resolven", hyperUsed.every((id) => allRelIds.has(id)));

console.log(failures === 0 ? "\nAlle merge-checks geslaagd." : `\n${failures} merge-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

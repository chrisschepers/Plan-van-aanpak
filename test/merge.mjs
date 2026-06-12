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

// 1) Formulier ongewijzigd: het hele formulier-body komt letterlijk voor in het merge-document
check("UWV-formulier letterlijk ongewijzigd aanwezig", mDoc.includes(formBodyInner));
check("91 FORMTEXT-velden behouden", (mDoc.match(/FORMTEXT/g) || []).length === 91);
check("UWV-logo/fonts behouden", !!M.file("word/media/image1.png") && !!M.file("word/fontTable.xml"));
check("AG140-footer behouden", !!M.file("word/footer1.xml"));

// 2) Brief staat ervoor (vóór het formulier)
check("brief vóór formulier", mDoc.indexOf("Begeleidend bericht") < mDoc.indexOf(formBodyInner.slice(0, 80)));
check("brief bevat opbouwadvies", mDoc.includes("Opbouw- en re-integratieadvies"));
check("briefhoofd-part toegevoegd", !!M.file("word/headerLetter.xml"));
check("briefvoet-part toegevoegd", !!M.file("word/footerLetter.xml"));
check("briefhoofd bevat merknaam", (await M.file("word/headerLetter.xml").async("string")).includes("planvanaanpak"));

// 3) Pakket consistent
check("twee secties (2× sectPr)", (mDoc.match(/<w:sectPr/g) || []).length === 2);
check("content-types kent headerLetter", mCT.includes("/word/headerLetter.xml"));
check("rels kent headerLetter + footerLetter", mRels.includes("headerLetter.xml") && mRels.includes("footerLetter.xml"));
// elke r:id in document.xml moet in rels bestaan
const relIds = new Set([...mRels.matchAll(/Id="(rId\d+)"/g)].map((m) => m[1]));
const used = [...mDoc.matchAll(/r:id="(rId\d+)"/g)].map((m) => m[1]);
check("alle header/footer-verwijzingen resolven", used.every((id) => relIds.has(id)));

console.log(failures === 0 ? "\nAlle merge-checks geslaagd." : `\n${failures} merge-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

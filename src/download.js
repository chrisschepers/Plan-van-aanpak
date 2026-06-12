/* Echte .docx-export met de 'docx'-bibliotheek — opent overal netjes
   (Word, Google Docs, mobiele Office-apps). Bevat vier onderdelen:
   opbouwadvies, Plan van Aanpak (UWV AG140), aanvullende adviezen en
   het begeleidend bericht. */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak,
  Header, Footer, ShadingType, VerticalAlign,
} from "docx";
import { getVal, isMissing } from "./casedata.js";
import { fullRecoveryDate } from "./engine.js";
import { adviceParagraphs } from "./advice.js";
import { fillTemplate, buildUwvValues } from "./filltemplate.js";
import { mergeLetterAndForm } from "./merge.js";

const NAVY = "1F3864";
const NAVY_400 = "5B76A6";
const GREEN = "157F5B";
const GREY = "69748B";
const FAINT = "97A0B2";
const FLAG = "9A3B2E";

// ---- Briefpapier in de huisstijl van de website (navy + groen accent) ----
// Bewust zonder tabel: tabellen in een Word-kop renderen onbetrouwbaar.
function brandHeader() {
  return new Header({ children: [
    new Paragraph({ spacing: { after: 20 }, children: [
      new TextRun({ text: "planvanaanpak", bold: true, color: NAVY, size: 30, font: "Calibri" }),
      new TextRun({ text: "invuller.nl", bold: true, color: NAVY_400, size: 30, font: "Calibri" }),
    ] }),
    new Paragraph({
      spacing: { after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: GREEN } },
      children: [new TextRun({ text: "Concept Plan van aanpak · Wet verbetering poortwachter", color: GREY, size: 16, font: "Calibri" })],
    }),
  ] });
}

function brandFooter() {
  return new Footer({ children: [
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { before: 40 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: "E3E7EE" } },
      children: [new TextRun({ text: "planvanaanpakinvuller.nl · Privacy by design, mens in de loop · Verwerking binnen de EER · Geen training op klantdata", color: GREY, size: 14, font: "Calibri" })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "[INVULLEN: bedrijfsnaam · KVK · contactgegevens]", color: FAINT, size: 14, font: "Calibri" })] }),
  ] });
}

const txt = (fields, id) => {
  const v = getVal(fields, id);
  return isMissing(v) ? "[INVULLEN]" : v;
};

// Koppen zonder heading-stijl (alleen expliciete opmaak) zodat het brief-
// document ook zonder eigen styles.xml correct oogt — nodig bij samenvoegen.
const FONT = "Calibri";
function h1(text) {
  return new Paragraph({ spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 32, font: FONT })] });
}
function h2(text) {
  return new Paragraph({ spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 24, font: FONT })] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 },
    children: [new TextRun({ text, color: opts.color, italics: opts.italics, size: 22, font: FONT })] });
}
function sub(text) {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text, color: GREY, size: 20, font: FONT })] });
}

// Sleutel/waarde-rij; markeert ontbrekende waarden.
function kv(label, value) {
  const missing = isMissing(value);
  return new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: label + ": ", color: GREY, size: 22, font: FONT }),
    new TextRun({ text: missing ? "[INVULLEN]" : value, bold: true, color: missing ? FLAG : "18202F",
      italics: missing, size: 22, font: FONT }),
  ] });
}

const cell = (text, opts = {}) => new TableCell({
  width: { size: opts.w || 33, type: WidthType.PERCENTAGE },
  shading: opts.head ? { fill: "E6EBF4" } : undefined,
  children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.head, size: 20,
    color: opts.head ? NAVY : "3C465A", font: FONT })] })],
});

function table(headers, rows) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: "D7DCE5" };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: border, bottom: border, left: border, right: border,
      insideHorizontal: border, insideVertical: border },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h) => cell(h, { head: true })) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(String(c))) })),
    ],
  });
}

function schemaTable(schema) {
  return table(["Per datum", "Uren per week", "Hersteld"],
    schema.map((r) => [r.date, `${r.hours} uur`, `${r.pct}%`]));
}

export function buildDocxDocument(fields, schema, reportDate) {
  const naam = getVal(fields, "naam");
  const hersteld = fullRecoveryDate(schema);
  const alineas = adviceParagraphs(fields, reportDate);

  const doc = new Document({
    creator: "planvanaanpakinvuller.nl",
    title: `Plan van Aanpak — ${naam}`,
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1900, bottom: 1400, left: 1200, right: 1200 } } },
      headers: { default: brandHeader() },
      footers: { default: brandFooter() },
      children: [
        // 1 — Opbouwadvies
        h1("Opbouw- en re-integratieadvies"),
        sub(`Concept op basis van de terugkoppeling bedrijfsarts d.d. ${reportDate} — ter controle en vaststelling.`),
        h2("Uitgangspunten"),
        kv("Werknemer", txt(fields, "naam")),
        kv("Contracturen", txt(fields, "uren")),
        kv("Belastbaarheid", txt(fields, "belast")),
        kv("Opbouwtempo", txt(fields, "opbouw")),
        kv("Startdatum opbouw", txt(fields, "start")),
        h2("Opbouwschema"),
        schemaTable(schema),
        p(`Volledige werkhervatting voorzien per ${hersteld}. Tussentijdse evaluatie aanbevolen; bij terugval wordt het schema in overleg bijgesteld.`, { color: GREY }),
        p("Het ingevulde Plan van aanpak is bijgevoegd als apart document in het officiële UWV-formulier (AG140).", { color: GREY }),

        // 2 — Begeleidend bericht (met de adviezen verweven)
        new Paragraph({ children: [new PageBreak()] }),
        h1("Begeleidend bericht"),
        sub(`Onderwerp: Concept Plan van aanpak — ${naam}`),
        p(`Beste ${isMissing(getVal(fields, "werkgever")) ? "werkgever" : getVal(fields, "werkgever")}, hierbij ontvang je het concept-Plan van aanpak voor je werknemer ${naam}, opgesteld naar aanleiding van de terugkoppeling van de bedrijfsarts d.d. ${reportDate}.`),
        p(`Werknemer is belastbaar voor ${getVal(fields, "belast").toLowerCase()}. De bedrijfsarts adviseert een opbouw vanaf ${getVal(fields, "start")}, ${getVal(fields, "opbouw").toLowerCase()}, van ${schema[0].hours} naar ${schema[schema.length - 1].hours} uur. Volledige werkhervatting is voorzien rond ${hersteld}. Houd rekening met de werkaanpassing: ${getVal(fields, "beperking").toLowerCase()}.`),
        ...alineas.map((t) => p(t)),
        p("Bespreek het concept met je werknemer, vul de open velden ([INVULLEN]) samen in, onderteken beiden en bewaar het in je verzuimdossier; leg ook de terugkoppeling van de bedrijfsarts vast. Medische gegevens zijn bewust niet opgenomen."),
        p("Met vriendelijke groet,"),
        new Paragraph({ children: [new TextRun({ text: "[INVULLEN: naam afzender]", bold: true, color: NAVY, size: 22 })] }),
      ],
    }],
  });
  return doc;
}

function safeName(fields) {
  const naam = getVal(fields, "naam");
  return naam.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "concept";
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}

// Begeleidend bericht (met opbouwadvies + verweven adviezen) als .docx.
export async function downloadDocx(fields, schema, reportDate) {
  const filename = `Begeleidend-bericht-${safeName(fields)}.docx`;
  const blob = await Packer.toBlob(buildDocxDocument(fields, schema, reportDate));
  return triggerDownload(blob, filename);
}

// Het ingevulde Plan van aanpak in het échte UWV-formulier (AG140).
export async function downloadUwvPva(fields, schema) {
  const resp = await fetch(new URL("uwv-template.docx", document.baseURI));
  if (!resp.ok) throw new Error("UWV-sjabloon niet gevonden");
  const buf = await resp.arrayBuffer();
  const blob = await fillTemplate(buf, buildUwvValues(fields, schema));
  return triggerDownload(blob, `Plan-van-Aanpak-${safeName(fields)}.docx`);
}

// Eén document: begeleidend bericht (briefpapier) + ingevuld UWV-PvA erachter.
// Het UWV-formulier blijft ongewijzigd.
export async function downloadCombined(fields, schema, reportDate) {
  const letter = await Packer.toBlob(buildDocxDocument(fields, schema, reportDate));
  const resp = await fetch(new URL("uwv-template.docx", document.baseURI));
  if (!resp.ok) throw new Error("UWV-sjabloon niet gevonden");
  const filled = await fillTemplate(await resp.arrayBuffer(), buildUwvValues(fields, schema));
  const merged = await mergeLetterAndForm(letter, filled);
  return triggerDownload(merged, `Plan-van-Aanpak-${safeName(fields)}.docx`);
}

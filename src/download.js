/* Echte .docx-export met de 'docx'-bibliotheek — opent overal netjes
   (Word, Google Docs, mobiele Office-apps). Bevat vier onderdelen:
   opbouwadvies, Plan van Aanpak (UWV AG140), aanvullende adviezen en
   het begeleidend bericht. */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak,
} from "docx";
import { getVal, isMissing } from "./casedata.js";
import { fullRecoveryDate } from "./engine.js";
import { adviceParagraphs } from "./advice.js";
import { buildUwvPva } from "./uwvform.js";

const NAVY = "1F3864";
const GREY = "69748B";
const FLAG = "9A3B2E";

const txt = (fields, id) => {
  const v = getVal(fields, id);
  return isMissing(v) ? "[INVULLEN]" : v;
};

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 32 })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, bold: true, color: NAVY, size: 24 })] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 },
    children: [new TextRun({ text, color: opts.color, italics: opts.italics, size: 22 })] });
}
function sub(text) {
  return new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text, color: GREY, size: 20 })] });
}

// Sleutel/waarde-rij; markeert ontbrekende waarden.
function kv(label, value) {
  const missing = isMissing(value);
  return new Paragraph({ spacing: { after: 60 }, children: [
    new TextRun({ text: label + ": ", color: GREY, size: 22 }),
    new TextRun({ text: missing ? "[INVULLEN]" : value, bold: true, color: missing ? FLAG : "18202F",
      italics: missing, size: 22 }),
  ] });
}

const cell = (text, opts = {}) => new TableCell({
  width: { size: opts.w || 33, type: WidthType.PERCENTAGE },
  shading: opts.head ? { fill: "E6EBF4" } : undefined,
  children: [new Paragraph({ children: [new TextRun({ text, bold: !!opts.head, size: 20,
    color: opts.head ? NAVY : "3C465A" })] })],
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

        // 2 — Plan van Aanpak (officieel UWV-format AG140)
        new Paragraph({ children: [new PageBreak()] }),
        ...buildUwvPva(fields, schema),

        // 3 — Begeleidend bericht (met de adviezen verweven)
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

export async function downloadDocx(fields, schema, reportDate) {
  const naam = getVal(fields, "naam");
  const safe = naam.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "concept";
  const filename = `Plan-van-Aanpak-${safe}.docx`;
  const doc = buildDocxDocument(fields, schema, reportDate);
  const blob = await Packer.toBlob(doc);
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

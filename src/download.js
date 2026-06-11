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
import { computeAdvice } from "./advice.js";

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
  const advies = computeAdvice(fields, reportDate);
  const naam = getVal(fields, "naam");
  const hersteld = fullRecoveryDate(schema);

  const adviesBlokken = advies.flatMap((a) => {
    const out = [
      new Paragraph({ spacing: { before: 160, after: 40 },
        children: [new TextRun({ text: a.title, bold: true, color: a.level === "risk" ? FLAG : NAVY, size: 22 })] }),
      p(a.body),
    ];
    if (a.deadlines && a.deadlines.length) {
      out.push(table(["Wanneer", "Actie"], a.deadlines.map((d) => [d.date, `${d.title}. ${d.who}`])));
    }
    return out;
  });

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

        // 2 — Plan van Aanpak (UWV AG140)
        new Paragraph({ children: [new PageBreak()] }),
        h1("Plan van Aanpak"),
        sub("Wet verbetering poortwachter · UWV-formulier AG140 — concept ter controle."),
        h2("Werknemer"),
        kv("Voorletters en achternaam", txt(fields, "naam")),
        kv("Geboortedatum", txt(fields, "geboortedatum")),
        kv("Burgerservicenummer", "[INVULLEN]"),
        kv("Einddatum dienstverband", txt(fields, "einddatum")),
        h2("Werkgever"),
        kv("Bedrijfsnaam", txt(fields, "werkgever")),
        kv("Naam contactpersoon", "[INVULLEN]"),
        h2("Arbodienst / bedrijfsarts"),
        kv("Naam bedrijfsarts", "[INVULLEN]"),
        h2("Functie van de werknemer"),
        kv("Functie", txt(fields, "functie")),
        kv("Eerste ziektedag", txt(fields, "eersteZ")),
        h2("Mening werknemer en werkgever over de arbeidsmogelijkheden"),
        p(`Werknemer is belastbaar voor ${getVal(fields, "belast").toLowerCase()}. Werkgever en werknemer zien mogelijkheden om het eigen werk (${getVal(fields, "uren").toLowerCase()}) gefaseerd te hervatten volgens het opbouwschema.`),
        h2("Einddoel"),
        p(`Volledige werkhervatting in de eigen functie voor ${getVal(fields, "uren").toLowerCase()}. Verwachting: ${getVal(fields, "prognose").toLowerCase()}.`),
        h2("Afspraken — sociaal-medische zaken"),
        p(`Werknemer hervat het werk volgens onderstaand opbouwschema. Werkaanpassing: ${getVal(fields, "beperking").toLowerCase()}. Start op ${getVal(fields, "start")}, ${getVal(fields, "opbouw").toLowerCase()} uitgebreid.`),
        schemaTable(schema),
        h2("Eerstvolgende evaluatie"),
        kv("Eerstvolgende evaluatie", txt(fields, "evaluatie")),
        h2("Ondertekening"),
        p("Werkgever: ______________________    Datum: __________"),
        p("Werknemer: ______________________    Datum: __________"),

        // 3 — Aanvullende adviezen
        new Paragraph({ children: [new PageBreak()] }),
        h1("Aanvullende adviezen"),
        sub("Automatisch afgeleid uit de gecontroleerde gegevens — controleer en pas aan waar nodig."),
        ...adviesBlokken,

        // 4 — Begeleidend bericht
        new Paragraph({ children: [new PageBreak()] }),
        h1("Begeleidend bericht"),
        sub(`Onderwerp: Concept Plan van Aanpak — ${naam}`),
        p(`Beste ${isMissing(getVal(fields, "werkgever")) ? "[werkgever]" : getVal(fields, "werkgever")},`),
        p(`Op basis van de terugkoppeling van de bedrijfsarts is een concept Plan van Aanpak opgesteld voor ${naam}. In de bijlage vind je vier onderdelen: het opbouwadvies, het concept Plan van Aanpak (UWV-formulier AG140), de aanvullende adviezen en dit begeleidende bericht.`),
        p(`De kern: werknemer is belastbaar (${getVal(fields, "belast").toLowerCase()}) en bouwt vanaf ${getVal(fields, "start")} ${getVal(fields, "opbouw").toLowerCase()} op, van ${schema[0].hours} naar ${schema[schema.length - 1].hours} uur. Volledige werkhervatting is voorzien rond ${hersteld}. Houd rekening met de werkaanpassing: ${getVal(fields, "beperking").toLowerCase()}.`),
        p("Loop het concept na, vul de gemarkeerde velden ([INVULLEN]) aan en let op de aanvullende adviezen. Bespreek het Plan van Aanpak samen met de werknemer voordat je het vaststelt. Medische gegevens zijn bewust niet opgenomen."),
        p("Met vriendelijke groet,"),
        new Paragraph({ children: [new TextRun({ text: "[INVULLEN: naam casemanager]", bold: true, color: NAVY, size: 22 })] }),
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

/* Bouwt het Plan van Aanpak in de officiële UWV-opmaak (formulier AG140),
   getrouw gereconstrueerd uit het UWV-bronformulier: genummerde secties met
   donkerblauwe balk, labels, grijze invulvakken, cursieve hulpteksten,
   activiteitentabellen (7A–7F) en de AG140-footer.

   Vulregels volgen de Agentprompt PvA v2:
   - 1.2 BSN altijd [INVULLEN]
   - velden letterlijk uit de gecontroleerde gegevens, anders [INVULLEN]
   - sectie 7: basisactiviteiten (7E opbouw + vervolgconsult, 7F evaluatie) */

import {
  Paragraph, TextRun, Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, AlignmentType,
} from "docx";
import { getVal, isMissing } from "./casedata.js";

const NAVY = "1F3864";
const GREY = "69748B";
const FLAG = "9A3B2E";
const LINE = "C8CDD6";
const FILL = "F2F5FA";

const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
const allBorders = { top: border, bottom: border, left: border, right: border, insideHorizontal: border, insideVertical: border };

// Donkerblauwe sectiebalk: "1. Werknemer"
function sectionBar(nr, title) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    rows: [new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: NAVY },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: `${nr}.  ${title}`, bold: true, color: "FFFFFF", size: 22 })] })],
    })] })],
  });
}

// Cursieve hulptekst (grijs, klein)
function help(text) {
  return new Paragraph({ spacing: { before: 60, after: 40 },
    children: [new TextRun({ text, italics: true, color: GREY, size: 18 })] });
}

// Invulrij: label links, waarde in grijs vak rechts
function fieldRow(label, value, opts = {}) {
  const missing = isMissing(value) || opts.forceMissing;
  const shown = opts.forceMissing ? "[INVULLEN]" : (missing ? "[INVULLEN]" : value);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [3200, 6400],
    borders: allBorders,
    rows: [new TableRow({ children: [
      new TableCell({ width: { size: 33, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: "FFFFFF" }, margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: label, color: GREY, size: 20 })] })] }),
      new TableCell({ width: { size: 67, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: FILL }, margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text: shown, bold: !missing, italics: missing, color: missing ? FLAG : "18202F", size: 20 })] })] }),
    ] })],
  });
}

// Vrij tekstvak (volle breedte, grijs) — voor mening/omschrijving
function textBox(value) {
  const missing = isMissing(value);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorders,
    rows: [new TableRow({ children: [new TableCell({
      shading: { type: ShadingType.CLEAR, fill: FILL }, margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: missing ? "[INVULLEN]" : value, italics: missing, color: missing ? FLAG : "18202F", size: 20 })] })],
    })] })],
  });
}

// Activiteitentabel: Activiteit | Wie | Planning
function activityTable(rows) {
  const head = ["Activiteit", "Wie", "Planning"];
  const cell = (t, opts = {}) => new TableCell({
    width: { size: opts.w, type: WidthType.PERCENTAGE },
    shading: opts.head ? { type: ShadingType.CLEAR, fill: "E6EBF4" } : undefined,
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: !!opts.head, color: opts.head ? NAVY : "3C465A", size: 18 })] })],
  });
  const widths = [54, 20, 26];
  const dataRows = rows.length ? rows : [["[INVULLEN]", "[INVULLEN]", "[INVULLEN]"]];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allBorders,
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h, i) => cell(h, { head: true, w: widths[i] })) }),
      ...dataRows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { w: widths[i] })) })),
    ],
  });
}

function gap() { return new Paragraph({ spacing: { after: 80 }, children: [] }); }

/** @returns {Array} docx-elementen voor het UWV Plan van Aanpak (AG140). */
export function buildUwvPva(fields, schema) {
  const start = getVal(fields, "start");
  const opbouwActiviteit = `Werknemer hervat/bouwt op conform het opbouwschema van de bedrijfsarts (start ${getVal(fields, "start")}, ${getVal(fields, "opbouw").toLowerCase()} tot ${schema[schema.length - 1].hours} uur).`;

  const els = [
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Plan van aanpak", bold: true, color: NAVY, size: 36 })] }),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: "Wet verbetering poortwachter — in te vullen door werkgever en werknemer", color: GREY, size: 18 })] }),

    sectionBar(1, "Werknemer"),
    help("Gebruikt de werknemer de achternaam van de partner? Vul dan ook de geboortenaam in."),
    fieldRow("1.1  Voorletters en achternaam", getVal(fields, "naam")),
    fieldRow("1.2  Burgerservicenummer", "", { forceMissing: true }),
    fieldRow("Geboortedatum", getVal(fields, "geboortedatum")),
    fieldRow("Einddatum dienstverband", getVal(fields, "einddatum")),
    gap(),

    sectionBar(2, "Werkgever"),
    fieldRow("Bedrijfsnaam", getVal(fields, "werkgever")),
    fieldRow("Naam contactpersoon", "", { forceMissing: true }),
    gap(),

    sectionBar(3, "Arbodienst / bedrijfsarts"),
    help("Vul de naam in van de bedrijfsarts die de Probleemanalyse heeft opgesteld."),
    fieldRow("Naam bedrijfsarts", "", { forceMissing: true }),
    gap(),

    sectionBar(4, "Functie van de werknemer"),
    fieldRow("4.1  Functie", getVal(fields, "functie")),
    help("Omschrijving van de werkzaamheden van het laatste werk dat de werknemer deed vóór de ziekmelding."),
    textBox(""),
    gap(),

    sectionBar(5, "Mening werknemer en werkgever over de arbeidsmogelijkheden"),
    help("Welke mogelijkheden ziet de werknemer om weer (meer) te gaan werken?"),
    textBox(""),
    help("Welke mogelijkheden ziet de werkgever voor de werknemer om weer (meer) te gaan werken?"),
    textBox(""),
    gap(),

    sectionBar(6, "Einddoel"),
    textBox(`Werkhervatting in de eigen functie voor ${getVal(fields, "uren").toLowerCase()}. Verwachting: ${getVal(fields, "prognose").toLowerCase()}.`),
    gap(),

    sectionBar(7, "Afspraken"),
    help("Welke afspraken heeft u met uw werknemer gemaakt over zijn re-integratie? Vul de activiteiten in die ondernomen moeten worden om de werknemer te re-integreren. Betrek hierbij de Probleemanalyse en het advies van de bedrijfsarts."),

    new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: "7A  Arbeidsinhoud", bold: true, color: NAVY, size: 19 })] }),
    activityTable([["Werkgever en werknemer stellen samen passende werkzaamheden vast binnen de aangegeven mogelijkheden (afwisseling zitten/staan, geen piekbelasting).", "Werkgever en werknemer", "Per " + start]]),

    new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: "7B  Arbeidsomstandigheden", bold: true, color: NAVY, size: 19 })] }),
    help("Ongeschikte werkruimte, lawaai, tocht, gebrekkige ventilatie, gevaarlijke werkplek."),
    activityTable([]),

    new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: "7C  Arbeidsvoorwaarden", bold: true, color: NAVY, size: 19 })] }),
    help("Regelmatig voeren van werkoverleg; instemmen met zorgverlof; flexibiliseren van werktijden."),
    activityTable([]),

    new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: "7D  Arbeidsverhoudingen", bold: true, color: NAVY, size: 19 })] }),
    help("Onvoldoende steun van leidinggevende/collega's, conflict: mediation door de arbodienst of een andere externe deskundige."),
    activityTable([]),

    new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: "7E  Sociaal-medische zaken", bold: true, color: NAVY, size: 19 })] }),
    help("Acties om de werknemer te laten re-integreren. Deze acties vinden plaats op advies van de bedrijfsarts."),
    activityTable([
      [opbouwActiviteit, "Werknemer en werkgever", "Per " + start],
      ["Werknemer verschijnt op het vervolgconsult bij de bedrijfsarts.", "Werknemer", "Conform oproep arbodienst"],
    ]),

    new Paragraph({ spacing: { before: 80, after: 40 }, children: [new TextRun({ text: "7F  Overige activiteiten", bold: true, color: NAVY, size: 19 })] }),
    activityTable([
      ["Werkgever en werknemer evalueren de voortgang en stellen het Plan van aanpak bij wanneer de belastbaarheid wijzigt.", "Werkgever en werknemer", "Elke 6 weken"],
    ]),
    gap(),

    sectionBar(8, "Mening over de gemaakte afspraken"),
    help("Niet door de tool ingevuld — dit is aan werknemer en werkgever zelf."),
    fieldRow("Wat vindt de werknemer van de afspraken?", "", { forceMissing: true }),
    fieldRow("Wat vindt de werkgever van de afspraken?", "", { forceMissing: true }),
    gap(),

    sectionBar(9, "Te laat opgesteld Plan van aanpak"),
    help("Is het Plan van aanpak meer dan 2 weken na de Probleemanalyse opgesteld, geef hiervoor dan de reden."),
    textBox(""),
    gap(),

    sectionBar(10, "Ondertekening"),
  ];

  // Ondertekening — twee kolommen
  const signCell = (who) => new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE }, borders: allBorders,
    margins: { top: 80, bottom: 160, left: 120, right: 120 },
    children: [
      new Paragraph({ children: [new TextRun({ text: who, bold: true, color: NAVY, size: 20 })] }),
      new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Datum: ____________________", color: GREY, size: 18 })] }),
      new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Handtekening:", color: GREY, size: 18 })] }),
    ],
  });
  els.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, borders: allBorders,
    rows: [new TableRow({ children: [signCell("Werkgever"), signCell("Werknemer")] })],
  }));

  els.push(new Paragraph({ spacing: { before: 160 }, alignment: AlignmentType.RIGHT,
    children: [new TextRun({ text: "AG140  03041  05-23", color: GREY, size: 16 })] }));

  return els;
}

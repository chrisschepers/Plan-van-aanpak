/* Echte .docx-export met de 'docx'-bibliotheek — opent overal netjes
   (Word, Google Docs, mobiele Office-apps). Bevat vier onderdelen:
   opbouwadvies, Plan van Aanpak (UWV AG140), aanvullende adviezen en
   het begeleidend bericht. */

import {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak,
  Header, Footer, ShadingType, VerticalAlign, ImageRun, TabStopType,
  PageNumber, HorizontalPositionRelativeFrom, VerticalPositionRelativeFrom,
  TextWrappingType, PageOrientation,
} from "docx";
import { getVal, isMissing } from "./casedata.js";
import { fullRecoveryDate } from "./engine.js";
import { adviceBullets, poortwachterTermijnen, berichtKern, splitLinks, computeTijdlijn } from "./advice.js";
import { fillTemplate, buildUwvValues } from "./filltemplate.js";
import { BAND_PNG, DECO_PNG, MARK_PNG, pngBytes } from "./brandassets.js";
import { renderTijdlijnSvg } from "./tijdlijnsvg.js";

const NAVY = "1F3864";
const NAVY_900 = "14264A";
const NAVY_600 = "2C4A7E";
const NAVY_400 = "5B76A6";
const NAVY_50 = "F2F5FA";
const GREEN = "157F5B";
const GREY = "69748B";
const FAINT = "97A0B2";
const FLAG = "9A3B2E";
const LINE = "E3E7EE";

// ---- Briefpapier v2 (huisstijl-ontwerp): merkband bovenaan, golffiguur
// onderaan, briefkop met logo-blokje + contactblok, voet met paginanummers. ----
const MM_EMU = 36000;                       // EMU per millimeter
const mmPx = (mm) => Math.round((mm * 96) / 25.4); // docx-transformatie is in px (96dpi)
const CONTENT_W_TWIPS = 9411;               // 166mm tekstbreedte (210 − 2×22mm marge)

function floatImg(b64, wMm, hMm, xMm, yMm, opts = {}) {
  return new ImageRun({
    type: "png",
    data: pngBytes(b64),
    transformation: { width: mmPx(wMm), height: mmPx(hMm) },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: Math.round(xMm * MM_EMU) },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: Math.round(yMm * MM_EMU) },
      behindDocument: opts.front ? false : true,
      allowOverlap: true,
      wrap: { type: TextWrappingType.NONE },
    },
  });
}

// Logo-blokje zwevend op vaste positie (inline knipt af op de regelhoogte).
function markImg(sizeMm, yMm) {
  return floatImg(MARK_PNG, sizeMm, sizeMm, 22, yMm, { front: true });
}

// Achtergrond van elke pagina: navy merkband (boven) + lichtblauwe golven (onder).
function decoRuns() {
  return [floatImg(BAND_PNG, 210, 3.2, 0, 0), floatImg(DECO_PNG, 210, 52, 0, 245)];
}

// Rechter tab-stop; bij ingesprongen regels schuift de tab mee naar links.
function rightTab(indentTwips = 0) {
  return {
    indent: indentTwips ? { left: indentTwips } : undefined,
    tabStops: [{ type: TabStopType.RIGHT, position: CONTENT_W_TWIPS - indentTwips }],
  };
}
const RIGHT_TAB = rightTab(0);
const IND_FULL = 907;  // 16mm: logo-blokje 12mm + 4mm tussenruimte
const IND_COMPACT = 652; // 11.5mm: logo-blokje 8.5mm + 3mm

// Eerste pagina: volledige briefkop — logo-blokje + woordmerk + tagline links,
// contactblok rechts, dunne lijn eronder.
function letterHeadFirst() {
  return new Header({ children: [
    new Paragraph({ ...rightTab(IND_FULL), spacing: { after: 30 }, children: [
      ...decoRuns(),
      markImg(12, 12.5),
      new TextRun({ text: "planvanaanpak", bold: true, color: NAVY_900, size: 30, font: FONT }),
      new TextRun({ text: "invuller.nl", bold: true, color: NAVY_400, size: 30, font: FONT }),
      new TextRun({ text: "\tplanvanaanpakinvuller.nl", bold: true, color: NAVY, size: 17, font: FONT }),
    ] }),
    new Paragraph({ ...rightTab(IND_FULL), spacing: { after: 0 }, children: [
      new TextRun({ text: "Concept Plan van Aanpak — Wet verbetering poortwachter", color: GREY, size: 16, font: FONT }),
      new TextRun({ text: "\tcontact@planvanaanpakinvuller.nl", color: GREY, size: 17, font: FONT }),
    ] }),
    new Paragraph({ ...rightTab(IND_FULL), spacing: { after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: LINE } },
      children: [
        new TextRun({ text: "\t[INVULLEN: telefoon]", bold: true, italics: true, color: FLAG, size: 17, font: FONT }),
      ] }),
  ] });
}

// Vervolgpagina's: compacte kop met klein logo-blokje + paginatitel rechts.
function letterHeadCompact(naam) {
  const wie = isMissing(naam) ? "" : `, ${naam}`;
  return new Header({ children: [
    new Paragraph({ ...rightTab(IND_COMPACT), spacing: { after: 0 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: LINE } },
      children: [
        ...decoRuns(),
        markImg(8.5, 10.8),
        new TextRun({ text: "planvanaanpak", bold: true, color: NAVY_900, size: 23, font: FONT }),
        new TextRun({ text: "invuller.nl", bold: true, color: NAVY_400, size: 23, font: FONT }),
        new TextRun({ text: "\tVervolg — ", color: GREY, size: 17, font: FONT }),
        new TextRun({ text: `Concept Plan van Aanpak${wie}`, bold: true, color: NAVY_600, size: 17, font: FONT }),
      ] }),
  ] });
}

// Voet: groene stip + website links; privacyregel + paginanummer rechts.
function brandFooter() {
  return new Footer({ children: [
    new Paragraph({ ...RIGHT_TAB, spacing: { before: 40, after: 20 },
      border: { top: { style: BorderStyle.SINGLE, size: 8, color: "E6EBF4" } },
      children: [
        new TextRun({ text: "● ", color: GREEN, size: 17, font: FONT }),
        new TextRun({ text: "planvanaanpakinvuller.nl", bold: true, color: NAVY, size: 17, font: FONT }),
        new TextRun({ text: "\tPrivacy by design · hosting en opslag binnen de EER", color: GREY, size: 16, font: FONT }),
      ] }),
    new Paragraph({ ...RIGHT_TAB, spacing: { after: 0 }, children: [
      new TextRun({ text: "\t", size: 16 }),
      new TextRun({ color: GREY, size: 16, font: FONT, children: ["Pagina ", PageNumber.CURRENT, " van ", PageNumber.TOTAL_PAGES] }),
    ] }),
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
// Maakt URL's en e-mailadressen in lopende tekst klikbaar (ExternalHyperlink).
function linkChildren(text, opts = {}) {
  return splitLinks(text).map((part) => {
    if (part.type === "text") {
      return new TextRun({ text: part.value, color: opts.color, italics: opts.italics, size: 22, font: FONT });
    }
    const href = part.type === "email" ? `mailto:${part.value}` : part.value;
    return new ExternalHyperlink({
      link: href,
      children: [new TextRun({ text: part.value, size: 22, font: FONT, color: "0563C1", underline: {} })],
    });
  });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 }, children: linkChildren(text, opts) });
}
// Bullet zonder numbering.xml (literaal "• " + hangende inspringing) — veilig bij
// het samenvoegen met het UWV-formulier, dat geen eigen lijststijlen meekrijgt.
function bullet(text) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 360, hanging: 200 },
    children: [new TextRun({ text: "• ", color: NAVY, size: 22, font: FONT }), ...linkChildren(text)],
  });
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

// ---- Briefonderdelen pagina 1 (ontwerp Briefpapier v2) ----
const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december"];
function vandaagLang() {
  const d = new Date();
  return `${d.getDate()} ${MAANDEN[d.getMonth()]} ${d.getFullYear()}`;
}
function kenmerk(naam) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const wie = isMissing(naam) ? "" : ` · ${naam}`;
  return `PVA-${d.getFullYear()}-${p(d.getMonth() + 1)}${p(d.getDate())}${wie}`;
}

function invullen(text, opts = {}) {
  return new TextRun({ text, bold: true, italics: true, color: FLAG, size: opts.size || 21, font: FONT });
}

// Geadresseerde op vensterenvelop-positie (placeholders zoals in het ontwerp).
function addresseeBlock() {
  const lijn = (children, opts = {}) => new Paragraph({ spacing: { after: 20, before: opts.before || 0 }, children });
  return [
    lijn([invullen("[INVULLEN: bedrijfsnaam werkgever]")], { before: 360 }),
    lijn([new TextRun({ text: "T.a.v. ", color: "18202F", size: 21, font: FONT }), invullen("[INVULLEN: contactpersoon]")]),
    lijn([invullen("[INVULLEN: adres]")]),
    lijn([invullen("[INVULLEN: postcode en plaats]")]),
  ];
}

// Meta-blok: navy-getint kader met Datum / Ons kenmerk / Onderwerp / Bijlagen.
function metaBlock(naam) {
  const wie = isMissing(naam) ? "" : ` — ${naam}`;
  const rows = [
    ["Datum", vandaagLang()],
    ["Ons kenmerk", kenmerk(naam)],
    ["Onderwerp", `Concept Plan van Aanpak${wie}`],
    ["Bijlagen", "Plan van aanpak (UWV-formulier AG140) — apart document voor het personeelsdossier"],
  ];
  const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const borders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
  const cellOf = (text, head) => new TableCell({
    width: { size: head ? 20 : 80, type: WidthType.PERCENTAGE },
    shading: { fill: NAVY_50 },
    borders,
    margins: { top: 70, bottom: 70, left: 160, right: 160 },
    children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({
      text, size: 19, font: FONT,
      color: head ? GREY : NAVY_900, bold: !head,
    })] })],
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder,
      insideHorizontal: noBorder, insideVertical: noBorder },
    rows: rows.map(([k, v]) => new TableRow({ children: [cellOf(k, true), cellOf(v, false)] })),
  });
}

export function buildDocxDocument(fields, schema, reportDate, taaksuggestie, signalen, schemaZelfOpgesteld, opbouwReden = "", opts = {}) {
  const { tijdlijnPng = null, pngW = 0, pngH = 0, wazo = null } = opts;
  const naam = getVal(fields, "naam");
  const geenOpbouw = !!opbouwReden || schema.length === 0;
  const hersteld = schema.length ? fullRecoveryDate(schema) : "";
  const { bullets, termijnRef } = adviceBullets(fields, reportDate, signalen, { wazo });
  const kern = berichtKern(fields, schema, schemaZelfOpgesteld, opbouwReden);
  const taak = (taaksuggestie || "").trim();
  const termijnen = poortwachterTermijnen(fields);
  const startRaw = getVal(fields, "start");
  const startDisplay = geenOpbouw ? "—" : (isMissing(startRaw) ? (schema[0] ? schema[0].date : "—") : startRaw);
  const opbouwDisplay = geenOpbouw
    ? "Niet van toepassing"
    : (schemaZelfOpgesteld || isMissing(getVal(fields, "opbouw"))
      ? "Niet door de bedrijfsarts gespecificeerd" : getVal(fields, "opbouw"));

  const sections = [{
      properties: {
        titlePage: true, // eerste pagina: volledige briefkop; vervolg: compacte kop
        page: { size: { width: 11906, height: 16838 },
          margin: { top: 2100, bottom: 2300, left: 1247, right: 1247, header: 680, footer: 1000 } },
      },
      headers: { first: letterHeadFirst(), default: letterHeadCompact(naam) },
      footers: { first: brandFooter(), default: brandFooter() },
      children: [
        // ---- PAGINA 1 — het begeleidend bericht als brief (ontwerp Briefpapier v2) ----
        ...addresseeBlock(),
        new Paragraph({ spacing: { before: 240, after: 0 }, children: [] }),
        metaBlock(naam),
        new Paragraph({ spacing: { before: 200, after: 120 },
          children: [new TextRun({ text: "Beste werkgever,", color: "18202F", size: 22, font: FONT })] }),
        p(`Hierbij ontvang je het concept-Plan van aanpak voor ${isMissing(naam) ? "je werknemer" : naam}, opgesteld naar aanleiding van de terugkoppeling van de bedrijfsarts d.d. ${reportDate}. Dit document bevat het opbouwadvies en de poortwachter-termijnen ter ondersteuning. Het ingevulde Plan van aanpak (UWV-formulier AG140) ontvang je als apart document; dat hoort in het personeelsdossier.`),
        ...kern.map((t) => p(t)),
        new Paragraph({ spacing: { before: 60, after: 80 }, children: [
          new TextRun({ text: "Een paar praktische aandachtspunten:", bold: true, color: "18202F", size: 22, font: FONT })] }),
        ...bullets.map((t) => bullet(t)),
        ...(termijnRef ? [p(tijdlijnPng ? "De volledige tijdlijn met alle wettelijke mijlpalen staat op de laatste (liggende) pagina." : "De volledige wettelijke termijnen staan in de bijgevoegde tabel Poortwachter-termijnen.", { color: GREY })] : []),
        ...(taak ? [new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: "Suggestie voor aangepaste taken. ", bold: true, color: NAVY, size: 22, font: FONT }),
          new TextRun({ text: `Op basis van de functieomschrijving zou je — binnen de afgegeven mogelijkheden — kunnen denken aan ${taak}. `, size: 22, font: FONT }),
          new TextRun({ text: "Let op: dit zijn voorstellen als gespreksopening. Bespreek ze eerst samen met de werknemer; ze maken geen onderdeel uit van het Plan van Aanpak en mogen niet eenzijdig in het dossier worden opgenomen.", italics: true, size: 22, font: FONT }),
        ] })] : []),
        p("Bespreek het concept met je werknemer, vul de openstaande velden samen in, onderteken beiden en bewaar het in je verzuimdossier; leg ook de terugkoppeling van de bedrijfsarts vast. Medische gegevens zijn bewust niet opgenomen."),
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun({
          text: "Dit document is een concept, opgesteld op basis van de terugkoppeling van de bedrijfsarts. Controleer de gegevens en stel het Plan van aanpak altijd samen met je werknemer vast — het is een document van jullie beiden.",
          italics: true, color: GREY, size: 22, font: FONT })] }),
        new Paragraph({ spacing: { after: 120 }, children: [new TextRun({
          text: "Ben je eigenrisicodrager voor de Ziektewet of de WGA? Dan gelden aanvullende of afwijkende regels en kun je niet afgaan op dit automatisch gegenereerde advies — raadpleeg dan je eigen verzuim- of arbospecialist.",
          italics: true, color: GREY, size: 22, font: FONT })] }),
        new Paragraph({ spacing: { before: 200, after: 700 },
          children: [new TextRun({ text: "Met vriendelijke groet,", color: "3C465A", size: 22, font: FONT })] }),
        new Paragraph({ spacing: { after: 20 }, children: [invullen("[INVULLEN: naam afzender]", { size: 22 })] }),
        new Paragraph({ spacing: { after: 0 }, children: [invullen("[INVULLEN: functie, bv. casemanager verzuim]", { size: 18 })] }),

        // ---- BIJLAGE 1 — Opbouwadvies ----
        new Paragraph({ children: [new PageBreak()] }),
        h1("Opbouw- en re-integratieadvies"),
        sub(`Concept op basis van de terugkoppeling bedrijfsarts d.d. ${reportDate} — ter controle en vaststelling.`),
        h2("Uitgangspunten"),
        kv("Contracturen", txt(fields, "uren")),
        kv("Belastbaarheid", txt(fields, "belast")),
        kv("Opbouwtempo", opbouwDisplay),
        kv("Startdatum opbouw", startDisplay),
        ...(geenOpbouw
          ? [p(opbouwReden || "Een opbouwschema is op dit moment niet aan de orde.", { color: GREY })]
          : [
              ...(schemaZelfOpgesteld ? [p("De bedrijfsarts heeft geen concreet opbouwtempo gespecificeerd. Daarom is hieronder zelf een opbouwschema opgesteld: tweewekelijks één uur per werkdag erbij, oplopend naar de contracturen. Stem dit af met de werknemer en bedrijfsarts.", { color: GREY })] : []),
              h2("Opbouwschema"),
              schemaTable(schema),
              p(`Volledige werkhervatting voorzien per ${hersteld}. Tussentijdse evaluatie aanbevolen; bij terugval wordt het schema in overleg bijgesteld.`, { color: GREY }),
            ]),

        // ---- BIJLAGE 2 — Poortwachter-termijnen (tabel). Alleen als er GÉÉN
        // tijdlijn-afbeelding is; anders komt de tijdlijn op een liggende pagina. ----
        ...(tijdlijnPng ? [] : [
          new Paragraph({ children: [new PageBreak()] }),
          h1("Poortwachter-termijnen"),
          sub("Overzicht van de wettelijke mijlpalen, gerekend vanaf de eerste ziektedag."),
          table(["Termijn", "Mijlpaal", "Wat de werkgever doet"], termijnen.map((m) => [`wk ${m.week}${m.datum ? " · " + m.datum : ""}`, m.mijlpaal, m.actie])),
          p("Het ingevulde Plan van aanpak ontvang je als apart document (UWV-formulier AG140); dat hoort in het personeelsdossier. De adviezen in dit document zijn bedoeld als ondersteuning voor werkgever en werknemer en horen niet in het personeelsdossier.", { color: GREY }),
        ]),
      ],
    }];

  // Tijdlijn als afbeelding op een afsluitende LIGGENDE pagina (alleen browser-pad;
  // in Node/tests is er geen rasterisatie en valt het terug op de tabel hierboven).
  if (tijdlijnPng) {
    const blankH = new Header({ children: [new Paragraph({ children: [] })] });
    const blankF = new Footer({ children: [new Paragraph({ children: [] })] });
    sections.push({
      properties: {
        titlePage: false,
        page: {
          size: { orientation: PageOrientation.LANDSCAPE, width: 16838, height: 11906 },
          margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 },
        },
      },
      headers: { default: blankH, first: blankH },
      footers: { default: blankF, first: blankF },
      children: [
        h1("Tijdlijn van het verzuim"),
        sub("Van de eerste ziektedag tot het einde van de wachttijd, met de wettelijke mijlpalen. Het ingevulde Plan van aanpak (UWV-formulier AG140) ontvang je als apart document."),
        new Paragraph({ children: [new ImageRun({ type: "png", data: tijdlijnPng, transformation: { width: pngW, height: pngH } })] }),
      ],
    });
  }

  const doc = new Document({
    creator: "planvanaanpakinvuller.nl",
    title: `Plan van Aanpak — ${naam}`,
    styles: { default: { document: { run: { font: "Calibri" } } } },
    sections,
  });
  return doc;
}

function safeName(fields) {
  const naam = getVal(fields, "naam");
  if (isMissing(naam)) return "concept";
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

// Rasteriseer de tijdlijn-SVG naar PNG-bytes (browser; canvas-API, geen externe lib).
function pngBytesFromDataUrl(dataUrl) {
  const b64 = dataUrl.split(",")[1] || "";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
async function svgToPng(svg, w, h, scale = 2) {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error("svg laden mislukt")); img.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0, w, h);
    return pngBytesFromDataUrl(canvas.toDataURL("image/png"));
  } finally { URL.revokeObjectURL(url); }
}

// Begeleidend bericht op briefpapier: opbouwadvies + verweven adviezen + de
// verzuim-tijdlijn (als afbeelding op een liggende slotpagina). Bewust LOS van
// het Plan van aanpak, want dit hoort niet in het personeelsdossier.
export async function downloadBericht(fields, schema, reportDate, taaksuggestie, signalen, schemaZelfOpgesteld, opbouwReden, wazo) {
  const filename = `Begeleidend-bericht-${safeName(fields)}.docx`;
  const opts = { wazo: wazo || null }; // wazo voedt het zwangerschapsadvies, ook als de afbeelding faalt
  try {
    const tijdlijn = computeTijdlijn(fields, { wazo: wazo || null });
    if (tijdlijn) {
      const { svg, width, height } = renderTijdlijnSvg(tijdlijn);
      const png = await svgToPng(svg, width, height);
      const dispW = mmPx(255); // liggende A4-tekstbreedte (≈ 297 − 2×21 mm)
      opts.tijdlijnPng = png; opts.pngW = dispW; opts.pngH = Math.round(dispW * height / width);
    }
  } catch (e) {
    console.warn("Tijdlijn-afbeelding mislukt; val terug op de termijnen-tabel.", e && e.message);
  }
  const blob = await Packer.toBlob(buildDocxDocument(fields, schema, reportDate, taaksuggestie, signalen, schemaZelfOpgesteld, opbouwReden, opts));
  return triggerDownload(blob, filename);
}

// Het ingevulde Plan van aanpak in het échte UWV-formulier (AG140) — apart
// document dat in het personeelsdossier hoort.
export async function downloadUwvPva(fields, schema, functieomschrijving, opbouwReden, signalen) {
  const resp = await fetch(new URL("uwv-template.docx", document.baseURI));
  if (!resp.ok) throw new Error("UWV-sjabloon niet gevonden");
  const buf = await resp.arrayBuffer();
  const blob = await fillTemplate(buf, buildUwvValues(fields, schema, functieomschrijving, opbouwReden, signalen));
  return triggerDownload(blob, `Plan-van-Aanpak-${safeName(fields)}.docx`);
}

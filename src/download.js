/* Echte Word-download: bouwt één Word-compatibel document (.doc, HTML-formaat)
   met de drie onderdelen, gevuld met de gecontroleerde veldwaarden. */

import { getVal, isMissing } from "./data.jsx";
import { fullRecoveryDate } from "./engine.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function val(fields, id) {
  const v = getVal(fields, id);
  return isMissing(v) ? '<span style="color:#9a3b2e;font-style:italic">[INVULLEN]</span>' : esc(v);
}

function schemaTable(schema) {
  const rows = schema.map((r) =>
    `<tr><td>${r.date}</td><td>${r.hours} uur</td><td>${r.pct}%</td></tr>`
  ).join("");
  return `<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #c8cdd6;font-size:11pt">
    <tr style="background:#e6ebf4"><th align="left">Per datum</th><th align="left">Uren per week</th><th align="left">Hersteld</th></tr>${rows}</table>`;
}

export function buildWordDocument(fields, schema, reportDate) {
  const naam = getVal(fields, "naam");
  const hersteld = fullRecoveryDate(schema);
  const lower = (id) => {
    const v = getVal(fields, id);
    return isMissing(v) ? val(fields, id) : esc(v.toLowerCase());
  };

  const body = `
  <h1>Opbouw- en re-integratieadvies</h1>
  <p style="color:#69748b">Concept op basis van de terugkoppeling bedrijfsarts d.d. ${esc(reportDate)} — ter controle en vaststelling.</p>
  <h2>Uitgangspunten</h2>
  <table cellpadding="4" cellspacing="0" style="font-size:11pt">
    <tr><td width="220">Werknemer</td><td><b>${val(fields, "naam")}</b></td></tr>
    <tr><td>Contracturen</td><td><b>${val(fields, "uren")}</b></td></tr>
    <tr><td>Belastbaarheid</td><td><b>${val(fields, "belast")}</b></td></tr>
    <tr><td>Opbouwtempo</td><td><b>${val(fields, "opbouw")}</b></td></tr>
    <tr><td>Startdatum opbouw</td><td><b>${val(fields, "start")}</b></td></tr>
  </table>
  <h2>Opbouwschema</h2>
  ${schemaTable(schema)}
  <p>Volledige werkhervatting voorzien per ${hersteld}. Tussentijdse evaluatie aanbevolen; bij terugval wordt het schema in overleg bijgesteld.</p>

  <br clear="all" style="page-break-before:always" />

  <h1>Plan van Aanpak</h1>
  <p style="color:#69748b">Wet verbetering poortwachter — concept ter controle.</p>
  <h2>1 · Gegevens</h2>
  <table cellpadding="4" cellspacing="0" style="font-size:11pt">
    <tr><td width="220">Werknemer</td><td><b>${val(fields, "naam")}</b></td></tr>
    <tr><td>Functie</td><td><b>${val(fields, "functie")}</b></td></tr>
    <tr><td>Contracturen</td><td><b>${val(fields, "uren")}</b></td></tr>
    <tr><td>Eerste ziektedag</td><td><b>${val(fields, "eersteZ")}</b></td></tr>
    <tr><td>Werkgever</td><td><b>${val(fields, "werkgever")}</b></td></tr>
  </table>
  <h2>2 · Doel van de re-integratie</h2>
  <p>Volledige werkhervatting in de eigen functie voor ${lower("uren")}. De verwachting is: ${lower("prognose")}, conform het opbouwschema.</p>
  <h2>3 · Afspraken over de werkhervatting</h2>
  <p>Werknemer hervat het werk volgens onderstaand opbouwschema, met als werkaanpassing: ${lower("beperking")}. De opbouw start op ${val(fields, "start")} (${lower("belast")}) en wordt ${lower("opbouw")} uitgebreid.</p>
  ${schemaTable(schema)}
  <h2>4 · Evaluatie</h2>
  <p>De voortgang wordt periodiek geëvalueerd. Eerstvolgende evaluatie: ${val(fields, "evaluatie")}.</p>
  <h2>5 · Ondertekening</h2>
  <p>Werkgever: ____________________&nbsp;&nbsp;&nbsp;&nbsp;Datum: ____________</p>
  <p>Werknemer: ____________________&nbsp;&nbsp;&nbsp;&nbsp;Datum: ____________</p>

  <br clear="all" style="page-break-before:always" />

  <h1>Begeleidend bericht</h1>
  <p style="color:#69748b">Onderwerp: Concept Plan van Aanpak — ${esc(naam)}</p>
  <p>Beste ${isMissing(getVal(fields, "werkgever")) ? "[werkgever]" : esc(getVal(fields, "werkgever"))},</p>
  <p>Op basis van de terugkoppeling van de bedrijfsarts is een concept Plan van Aanpak opgesteld voor ${esc(naam)}. In de bijlage vind je drie onderdelen: het opbouwadvies, het concept Plan van Aanpak en dit begeleidende bericht.</p>
  <p>De kern: werknemer is belastbaar (${lower("belast")}) en bouwt vanaf ${val(fields, "start")} ${lower("opbouw")} op, van ${schema[0].hours} naar ${schema[schema.length - 1].hours} uur. Volledige werkhervatting is voorzien rond ${hersteld}. Houd rekening met de werkaanpassing: ${lower("beperking")}.</p>
  <p>Loop het concept na, vul de gemarkeerde velden ([INVULLEN]) aan en bespreek het Plan van Aanpak samen met de werknemer voordat je het vaststelt. Medische gegevens zijn bewust niet opgenomen.</p>
  <p>Met vriendelijke groet,<br/><b>[INVULLEN: naam casemanager]</b></p>`;

  return `<!DOCTYPE html><html lang="nl"><head><meta charset="utf-8"><title>Plan van Aanpak — ${esc(naam)}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #18202f; line-height: 1.5; }
    h1 { font-size: 17pt; color: #1F3864; border-bottom: 2px solid #1F3864; padding-bottom: 4px; }
    h2 { font-size: 12.5pt; color: #1a2f57; margin-top: 18px; }
    th { color: #1F3864; }
  </style></head><body>${body}</body></html>`;
}

export function downloadWord(fields, schema, reportDate) {
  const naam = getVal(fields, "naam");
  const safe = naam.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "") || "concept";
  const filename = `Plan-van-Aanpak-${safe}.doc`;
  const html = buildWordDocument(fields, schema, reportDate);
  const blob = new Blob(["﻿", html], { type: "application/msword" });
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

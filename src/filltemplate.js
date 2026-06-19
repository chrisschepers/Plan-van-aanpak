/* Vult het échte UWV-sjabloon (formulier AG140) in met behoud van de exacte
   opmaak: de FORMTEXT-velden worden op volgorde gevuld (de velden hebben geen
   unieke namen, dus we koppelen op positie — zie de mapping in buildUwvValues).
   De opmaak, lettertypen, het logo en de footer blijven ongewijzigd. */

import JSZip from "jszip";
import { getVal, isMissing } from "./casedata.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Vervangt de waarden van FORMTEXT-velden in word/document.xml op volgorde.
 * @param {string} xml  inhoud van word/document.xml
 * @param {Object<number,string>} values  1-based FORMTEXT-index → waarde
 * @returns {string} aangepaste xml
 */
export function fillDocumentXml(xml, values) {
  const types = [...xml.matchAll(/<w:instrText[^>]*>(.*?)<\/w:instrText>/g)]
    .map((m) => (/FORMTEXT/.test(m[1]) ? "text" : /FORMCHECKBOX/.test(m[1]) ? "check" : "other"));
  const seps = [...xml.matchAll(/<w:fldChar w:fldCharType="separate"\s*\/>/g)].map((m) => m.index);
  const ends = [...xml.matchAll(/<w:fldChar w:fldCharType="end"\s*\/>/g)].map((m) => m.index);
  const n = Math.min(types.length, seps.length, ends.length);

  let textIdx = 0;
  const repls = [];
  for (let i = 0; i < n; i++) {
    if (types[i] !== "text") continue;
    textIdx++;
    const val = values[textIdx];
    if (val == null || val === "") continue;
    const regionStart = seps[i];
    const regionEnd = ends[i];
    const tRe = /<w:t(?: [^>]*)?>[\s\S]*?<\/w:t>/g;
    tRe.lastIndex = regionStart;
    let first = true, mt;
    while ((mt = tRe.exec(xml)) && mt.index < regionEnd) {
      const repl = first
        ? `<w:t xml:space="preserve">${esc(val)}</w:t>`
        : `<w:t xml:space="preserve"></w:t>`;
      repls.push([mt.index, mt.index + mt[0].length, repl]);
      first = false;
    }
  }
  repls.sort((a, b) => b[0] - a[0]);
  let out = xml;
  for (const [s, e, t] of repls) out = out.slice(0, s) + t + out.slice(e);

  // Einddoel: kruis altijd het eerste vakje aan — "Werkhervatting in de eigen
  // functie". Dat is in dit formulier de eerste FORMCHECKBOX, dus we zetten de
  // default van de eerste checkbox op aangevinkt (1).
  out = out.replace(
    '<w:checkBox><w:sizeAuto/><w:default w:val="0"/></w:checkBox>',
    '<w:checkBox><w:sizeAuto/><w:default w:val="1"/></w:checkBox>'
  );
  return out;
}

/**
 * Mapping van FORMTEXT-index → waarde voor de voorbeeldcasus/velden.
 * Posities bepaald uit het UWV-formulier (AG140):
 *  1=1.1 naam · 3=2.1 bedrijfsnaam · 6=4.1 functie
 *  sectie 7 (Activiteit/Wie/Planning, 3 velden per rij, 4 rijen per categorie):
 *  7A Arbeidsinhoud 11–22 · 7B 23–34 · 7C 35–46 · 7D 47–58 · 7E 59–70 · 7F 71–82
 * 7B/7C/7D worden alleen (rij 1) gevuld bij een trigger: een werkplek- resp.
 * werktijden-aanpassing in de terugkoppeling, of het arbeidsconflict-signaal.
 * BSN (veld 2) blijft altijd leeg.
 */
export function buildUwvValues(fields, schema, functieomschrijving, opbouwReden = "", signalen = {}) {
  const v = (id) => { const x = getVal(fields, id); return isMissing(x) ? "" : x; };
  const geenOpbouw = !!opbouwReden || schema.length === 0;
  const startRaw = getVal(fields, "start");
  const start = isMissing(startRaw) ? (schema[0] ? schema[0].date : "") : startRaw;
  const fromH = schema[0] ? schema[0].hours : 0;
  const lastH = schema[schema.length - 1] ? schema[schema.length - 1].hours : 0;
  const opbouwVal = getVal(fields, "opbouw");
  const ritme = isMissing(opbouwVal) ? "tweewekelijks één uur per werkdag erbij" : opbouwVal.toLowerCase();
  const opbouw = geenOpbouw
    ? (opbouwReden || "Een opbouwschema is op dit moment niet aan de orde; de bedrijfsarts beoordeelt dit op het vervolgconsult.")
    : `Werknemer bouwt op van ${fromH} naar ${lastH} uur volgens het opbouwschema (start ${start}, ${ritme}).`;
  const beperkingVal = getVal(fields, "beperking");
  const arbeidsinhoud = isMissing(beperkingVal)
    ? "Werkgever en werknemer stellen samen passende werkzaamheden vast binnen de aangegeven mogelijkheden."
    : `Werkgever en werknemer stellen samen passende werkzaamheden vast binnen de aangegeven mogelijkheden (${beperkingVal.toLowerCase()}).`;
  const fo = (functieomschrijving || "").trim();
  const werkplek = v("werkplek");
  const werktijden = v("werktijden");
  const arbeidsconflict = !!(signalen && signalen.arbeidsconflict);

  return {
    1: v("naam"),               // 1.1 Voorletters en achternaam
    5: v("naamBedrijfsarts"),   // 3.1 Naam bedrijfsarts
    6: v("functie"),            // 4.1 Functie
    7: fo,                      // 4.2 Omschrijving van de werkzaamheden (uit de functieomschrijving)
    8: "Door de werknemer zelf in te vullen.",  // 5.1 Mening werknemer
    9: "Door de werkgever zelf in te vullen.",  // 5.2 Mening werkgever
    // 7A Arbeidsinhoud — rij 1
    11: arbeidsinhoud,
    12: "Werkgever en werknemer",
    13: start ? `Per ${start}` : "In overleg",
    // 7B Arbeidsomstandigheden — alleen bij een genoemde werkplekaanpassing
    ...(werkplek ? { 23: `Aanpassing werkplek/omstandigheden: ${werkplek}`, 24: "Werkgever", 25: "In overleg" } : {}),
    // 7C Arbeidsvoorwaarden — alleen bij een genoemde aanpassing van werktijden/rooster
    ...(werktijden ? { 35: `Aanpassing werktijden/rooster: ${werktijden}`, 36: "Werkgever en werknemer", 37: "In overleg" } : {}),
    // 7D Arbeidsverhoudingen — alleen bij een arbeidsconflict-signaal
    ...(arbeidsconflict ? { 47: "Werkgever en werknemer gaan met elkaar in gesprek, zo nodig onder begeleiding (mediation), om de arbeidsverhouding te herstellen.", 48: "Werkgever en werknemer", 49: "Op korte termijn" } : {}),
    // 7E Sociaal-medische zaken — rij 1 (opbouw) en rij 2 (vervolgconsult)
    59: opbouw,
    60: "Werknemer en werkgever",
    61: start ? `Per ${start}` : "In overleg",
    62: "Werknemer verschijnt op het vervolgconsult bij de bedrijfsarts.",
    63: "Werknemer",
    64: "Conform oproep arbodienst",
    // 7F Overige — rij 1 (periodieke evaluatie / bijstelling)
    71: "Werkgever en werknemer evalueren de voortgang en stellen het Plan van aanpak bij wanneer de belastbaarheid wijzigt.",
    72: "Werkgever en werknemer",
    73: "Elke 6 weken",
  };
}

/**
 * Laadt een .docx (ArrayBuffer/Buffer), vult de velden en levert het resultaat.
 * @returns {Promise<Blob|Buffer>}
 */
export async function fillTemplate(data, values) {
  const zip = await JSZip.loadAsync(data);
  const xml = await zip.file("word/document.xml").async("string");
  zip.file("word/document.xml", fillDocumentXml(xml, values));
  const isNode = typeof window === "undefined";
  return zip.generateAsync({
    type: isNode ? "nodebuffer" : "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    compression: "DEFLATE",
  });
}

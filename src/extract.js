/* Frontend-kant van de AI-extractie: stuurt een bestand of geplakte tekst naar
   de backend en zet het JSON-antwoord om naar het veldenmodel + opbouwschema.
   Het schema wordt hier deterministisch berekend (rekenmotor), niet door de AI. */

import { BACKEND_URL } from "./config.js";
import { computeSchema, computeDefaultSchema } from "./engine.js";

const MISSING = "[INVULLEN]";

function api(path) {
  return BACKEND_URL.replace(/\/$/, "") + path;
}

export async function extractCasus({ file, text, functieomschrijving }) {
  if (!BACKEND_URL) throw new Error("Geen backend ingesteld.");
  const fo = (functieomschrijving || "").trim();
  let resp;
  if (file) {
    const fd = new FormData();
    fd.append("document", file);
    if (fo) fd.append("functieomschrijving", fo);
    resp = await fetch(api("/api/extract"), { method: "POST", body: fd });
  } else {
    resp = await fetch(api("/api/extract"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text, functieomschrijving: fo }),
    });
  }
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error || `Serverfout (${resp.status})`);
  }
  const { data } = await resp.json();
  return mapExtraction(data, fo);
}

function isoToNL(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso.split("-").reverse().join("-") : "";
}
function nlToISO(nl) {
  return /^\d{2}-\d{2}-\d{4}$/.test(nl || "") ? nl.split("-").reverse().join("-") : "";
}
function todayISO() {
  const x = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}`;
}
function todayNL() {
  const x = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(x.getDate())}-${p(x.getMonth() + 1)}-${x.getFullYear()}`;
}

function mapExtraction(d, functieomschrijving) {
  const sources = {};
  const mk = (id, label, value, bron) => {
    const v = (value || "").trim();
    if (bron && bron.trim()) sources[id] = bron.trim();
    return { id, label, value: v || MISSING, status: v ? "ok" : "missing", src: bron && bron.trim() ? id : null };
  };
  const b = d.bronnen || {};

  const fields = [
    { group: "Werknemer & dienstverband", items: [
      mk("naam", "Naam werknemer", d.naam, null),
      mk("naamBedrijfsarts", "Naam bedrijfsarts", d.naamBedrijfsarts, null),
      mk("functie", "Functie", d.functie, b.functie),
      mk("uren", "Contracturen", d.contracturen, b.contracturen),
      mk("eersteZ", "Eerste ziektedag", d.eersteZiektedag, b.eersteZiektedag),
      mk("geboortedatum", "Geboortedatum", d.geboortedatum, null),
      mk("einddatum", "Einddatum dienstverband", d.einddatumDienstverband, null),
    ]},
    { group: "Belastbaarheid & opbouw", items: [
      mk("belast", "Belastbaarheid", d.belastbaarheid, b.belastbaarheid),
      mk("opbouw", "Opbouwtempo", d.opbouwtempo, b.opbouwtempo),
      mk("start", "Startdatum opbouw", d.startdatumOpbouw, b.startdatumOpbouw),
      mk("beperking", "Werkaanpassing", d.werkaanpassing, b.werkaanpassing),
    ]},
    { group: "Prognose", items: [
      mk("prognose", "Prognose herstel", d.prognose, b.prognose),
    ]},
  ];

  const r = d.reken || {};
  const sig = d.signalen || {};
  // Situaties waarin een opbouwschema inhoudelijk NIET aan de orde is:
  const geenMogelijkheden = !!(sig.geenBenutbareMogelijkheden || sig.duurzaamGeenMogelijkheden);
  const marginaal = !!sig.marginaleMogelijkheden;
  const volledigInzetbaar = !!sig.volledigInzetbaar
    || (r.contractHours > 0 && !(r.weeklyIncrease > 0) && r.startHours >= r.contractHours);

  let schema = [];
  let schemaZelfOpgesteld = false;
  let opbouwReden = "";   // gevuld wanneer er bewust GEEN opbouwschema is

  if (geenMogelijkheden) {
    opbouwReden = "De bedrijfsarts geeft aan dat er op dit moment geen benutbare arbeidsmogelijkheden zijn. Er is daarom (nog) geen opbouwschema; de bedrijfsarts houdt de vinger aan de pols en beoordeelt dit op het vervolgconsult.";
  } else if (marginaal) {
    opbouwReden = "De belastbaarheid is marginaal: zeer beperkt en zonder uitzicht op opbouw op korte termijn. Er is daarom (nog) geen oplopend opbouwschema; benut de geringe mogelijkheden binnen de eigen organisatie en herbeoordeel bij het vervolgconsult.";
  } else if (volledigInzetbaar) {
    opbouwReden = "De werknemer is volledig inzetbaar in de eigen uren; een opbouwschema is niet aan de orde.";
  } else if (r.contractHours > 0 && r.startHours > 0 && r.weeklyIncrease > 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.startDateISO || "")) {
    // De bedrijfsarts noemt een concreet wekelijks ritme → dat volgen.
    schema = computeSchema({
      contractHours: r.contractHours, startHours: r.startHours,
      weeklyIncrease: r.weeklyIncrease, startDate: r.startDateISO,
    });
  } else if (r.contractHours > 0) {
    // Wél opbouwperspectief, maar geen concreet ritme doorgegeven → zelf een
    // opbouwschema opstellen (tweewekelijks één uur per werkdag erbij). Dat mag;
    // we melden het expliciet.
    const startISO = /^\d{4}-\d{2}-\d{2}$/.test(r.startDateISO || "")
      ? r.startDateISO
      : nlToISO((d.startdatumOpbouw || "").trim()) || todayISO();
    schema = computeDefaultSchema({ contractHours: r.contractHours, startDate: startISO });
    schemaZelfOpgesteld = true;
  } else {
    // Zelfs de contracturen ontbreken: geen schema, wel een nette uitleg.
    opbouwReden = "De uitgangspunten voor een opbouwschema (zoals de contracturen) ontbreken nog. Vul deze aan, dan berekent de tool het schema.";
  }

  return {
    mode: "ai",
    fields,
    schema,
    schemaZelfOpgesteld,
    opbouwReden,
    reportDate: (d.spreekuurdatum || "").trim() || todayNL(),
    sources,
    functieomschrijving: functieomschrijving || "",
    taaksuggestie: (d.taaksuggestie || "").trim(),
    signalen: d.signalen || {},
  };
}

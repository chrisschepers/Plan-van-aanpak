/* Frontend-kant van de AI-extractie: stuurt een bestand of geplakte tekst naar
   de backend en zet het JSON-antwoord om naar het veldenmodel + opbouwschema.
   Het schema wordt hier deterministisch berekend (rekenmotor), niet door de AI. */

import { BACKEND_URL } from "./config.js";
import { computeSchema, computeDefaultSchema } from "./engine.js";

const MISSING = "[INVULLEN]";

function api(path) {
  return BACKEND_URL.replace(/\/$/, "") + path;
}

export async function extractCasus({ file, text, functieomschrijving, accessToken }) {
  if (!BACKEND_URL) throw new Error("Geen backend ingesteld.");
  const fo = (functieomschrijving || "").trim();
  const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  let resp;
  if (file) {
    const fd = new FormData();
    fd.append("document", file);
    if (fo) fd.append("functieomschrijving", fo);
    resp = await fetch(api("/api/extract"), { method: "POST", body: fd, headers: authHeaders });
  } else {
    resp = await fetch(api("/api/extract"), {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders },
      body: JSON.stringify({ text, functieomschrijving: fo }),
    });
  }
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    const err = new Error(e.error || `Serverfout (${resp.status})`);
    err.code = e.code || (resp.status === 402 ? "no_credits" : undefined);
    throw err;
  }
  const { data, balance } = await resp.json();
  return { ...mapExtraction(data, fo), balance };
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

// Vangnet voor gemiste signalen: leidt belastbaarheidstoestanden af uit
// ondubbelzinnige domeintaal in de geëxtraheerde tekst. Zet signalen alleen
// AAN (nooit uit) — normalizeExtraction lost daarna de onderlinge prioriteit op.
// Bewust hoge precisie: alleen heldere markers, geen brede gok.
export function reviewSignals(d) {
  const data = { ...(d || {}) };
  const sig = { ...(data.signalen || {}) };
  const r = data.reken || {};
  const belast = (data.belastbaarheid || "").toLowerCase();
  const prognose = (data.prognose || "").toLowerCase();
  const tekst = `${belast} ${prognose}`;

  if (/geen benutbare mogelijkheden/.test(tekst)) sig.geenBenutbareMogelijkheden = true;
  if (/duurzaam geen\b/.test(belast) || /\(iva\)/.test(prognose) || /vervroegde\s+(wia|iva)/.test(prognose)) {
    sig.duurzaamGeenMogelijkheden = true;
  }
  if (/volledig inzetbaar/.test(tekst) || /geen (functionele|medische) beperkingen/.test(tekst)) {
    sig.volledigInzetbaar = true;
  }
  // Marginaal alleen bij géén opbouwperspectief ÉN lage belastbaarheid — zo
  // blijft "weinig uren mét opbouw" (bv. stagnatie) buiten schot.
  const geenUitzicht = /uitbreiding[^.]{0,40}niet te verwachten/.test(tekst)
    || /geen uitzicht op (opbouw|uitbreiding|meer uren|urenuitbreiding)/.test(tekst)
    || /\bmargina/.test(tekst);
  const lageBelastbaarheid = (r.contractHours > 0 && r.startHours > 0 && r.startHours <= r.contractHours * 0.4)
    || /maximaal\b[^.]{0,25}\b(uur|uren)\b/.test(belast);
  if (geenUitzicht && lageBelastbaarheid) sig.marginaleMogelijkheden = true;
  if (/arbeidstherapeut/.test(tekst)) sig.arbeidstherapeutisch = true;
  // No-risk: hoge precisie — alleen bij een expliciete vermelding van no-risk/vangnet.
  if (/\bno.?risk\b|vangnet/.test(`${tekst} ${(data.werkaanpassing || "").toLowerCase()}`)) sig.noRiskMogelijk = true;

  data.signalen = sig;
  return data;
}

// Strijkt wisselende/tegenstrijdige AI-signalen deterministisch glad, zodat
// dezelfde feiten tot dezelfde uitkomst leiden. Raakt nooit de feitelijke
// velden (naam, datums, uren) — alleen de onderling uitsluitende
// belastbaarheidstoestanden en de reken-consistentie die daarbij hoort.
export function normalizeExtraction(d) {
  const data = { ...(d || {}) };
  const sig = { ...(data.signalen || {}) };
  const r = { ...(data.reken || {}) };

  // Duurzaam geen mogelijkheden impliceert geen benutbare mogelijkheden, en
  // sluit "herstel binnen 3 maanden" uit (de route is juist richting IVA).
  if (sig.duurzaamGeenMogelijkheden) {
    sig.geenBenutbareMogelijkheden = true;
    sig.herstelVerwachtBinnen3Maanden = false;
  }

  // Onderling uitsluitende belastbaarheidstoestanden, op volgorde van zwaarte.
  // De zwaarste wint; lichtere/tegenstrijdige worden uitgezet.
  if (sig.geenBenutbareMogelijkheden) {
    sig.marginaleMogelijkheden = false;
    sig.volledigInzetbaar = false;
    sig.arbeidstherapeutisch = false;
  } else if (sig.volledigInzetbaar) {
    sig.marginaleMogelijkheden = false;
    sig.arbeidstherapeutisch = false;
  } else if (sig.marginaleMogelijkheden) {
    sig.volledigInzetbaar = false;
  }

  // Reken-consistentie. In "geen opbouw"-toestanden hoort geen oplopend ritme;
  // bij volledig inzetbaar start je per definitie op de contracturen.
  if (sig.geenBenutbareMogelijkheden || sig.marginaleMogelijkheden) {
    r.startHours = 0;
    r.weeklyIncrease = 0;
  } else if (sig.volledigInzetbaar && r.contractHours > 0) {
    r.startHours = r.contractHours;
    r.weeklyIncrease = 0;
  }

  data.signalen = sig;
  data.reken = r;
  return data;
}

function mapExtraction(d, functieomschrijving) {
  d = normalizeExtraction(reviewSignals(d));
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
      mk("werkplek", "Aanpassing werkplek (7B)", d.aanpassingWerkplek, null),
      mk("werktijden", "Aanpassing werktijden (7C)", d.aanpassingWerktijden, null),
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

  // Stap 0 — inputvalidatie. Ontbreekt het blok (oudere backend) → behandel als geschikt.
  const iv = d.inputvalidatie || {};
  const inputvalidatie = {
    documenttype: (iv.documenttype || "").trim(),
    geschikt: iv.geschikt !== false,
    toelichting: (iv.toelichting || "").trim(),
    meestRecenteSpreekuur: (iv.meestRecenteSpreekuur || "").trim(),
    tegenstrijdigheden: Array.isArray(iv.tegenstrijdigheden)
      ? iv.tegenstrijdigheden.filter((t) => t && String(t).trim())
      : [],
  };

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
    inputvalidatie,
  };
}

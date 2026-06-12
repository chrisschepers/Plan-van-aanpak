/* Frontend-kant van de AI-extractie: stuurt een bestand of geplakte tekst naar
   de backend en zet het JSON-antwoord om naar het veldenmodel + opbouwschema.
   Het schema wordt hier deterministisch berekend (rekenmotor), niet door de AI. */

import { BACKEND_URL } from "./config.js";
import { computeSchema } from "./engine.js";

const MISSING = "[INVULLEN]";

function api(path) {
  return BACKEND_URL.replace(/\/$/, "") + path;
}

export async function extractCasus({ file, text }) {
  if (!BACKEND_URL) throw new Error("Geen backend ingesteld.");
  let resp;
  if (file) {
    const fd = new FormData();
    fd.append("document", file);
    resp = await fetch(api("/api/extract"), { method: "POST", body: fd });
  } else {
    resp = await fetch(api("/api/extract"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error || `Serverfout (${resp.status})`);
  }
  const { data } = await resp.json();
  return mapExtraction(data);
}

function isoToNL(iso) {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? iso.split("-").reverse().join("-") : "";
}
function todayNL() {
  const x = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(x.getDate())}-${p(x.getMonth() + 1)}-${x.getFullYear()}`;
}

function mapExtraction(d) {
  const sources = {};
  const mk = (id, label, value, bron) => {
    const v = (value || "").trim();
    if (bron && bron.trim()) sources[id] = bron.trim();
    return { id, label, value: v || MISSING, status: v ? "ok" : "missing", src: bron && bron.trim() ? id : null };
  };
  const b = d.bronnen || {};

  const fields = [
    { group: "Werknemer & dienstverband", items: [
      mk("naam", "Naam werknemer", d.naam, b.naam),
      mk("functie", "Functie", d.functie, b.functie),
      mk("uren", "Contracturen", d.contracturen, b.contracturen),
      mk("eersteZ", "Eerste ziektedag", d.eersteZiektedag, b.eersteZiektedag),
      mk("geboortedatum", "Geboortedatum", d.geboortedatum, null),
      mk("einddatum", "Einddatum dienstverband", d.einddatumDienstverband, null),
      mk("werkgever", "Werkgever", d.werkgever, null),
    ]},
    { group: "Belastbaarheid & opbouw", items: [
      mk("belast", "Belastbaarheid", d.belastbaarheid, b.belastbaarheid),
      mk("opbouw", "Opbouwtempo", d.opbouwtempo, b.opbouwtempo),
      mk("start", "Startdatum opbouw", d.startdatumOpbouw, b.startdatumOpbouw),
      mk("beperking", "Werkaanpassing", d.werkaanpassing, b.werkaanpassing),
    ]},
    { group: "Prognose", items: [
      mk("prognose", "Prognose herstel", d.prognose, b.prognose),
      mk("evaluatie", "Eerstvolgende evaluatie", d.evaluatie, null),
    ]},
  ];

  const r = d.reken || {};
  let schema;
  if (r.contractHours > 0 && r.startHours > 0 && r.weeklyIncrease > 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.startDateISO || "")) {
    schema = computeSchema({
      contractHours: r.contractHours, startHours: r.startHours,
      weeklyIncrease: r.weeklyIncrease, startDate: r.startDateISO,
    });
  } else {
    // Geen concreet ritme: één regel zodat de rest van de flow blijft werken.
    const disp = isoToNL(r.startDateISO) || (d.startdatumOpbouw || "").trim() || "—";
    schema = [{ date: disp, hours: r.contractHours || 0, pct: 100 }];
  }

  return {
    mode: "ai",
    fields,
    schema,
    reportDate: (d.spreekuurdatum || "").trim() || todayNL(),
    sources,
  };
}

/* Pure data en helpers (geen JSX) — los van de iconen zodat de adviesmotor
   en de docx-generatie ook buiten de browser (in Node) getest kunnen worden. */

// ---------- Uitgangspunten van de voorbeeldcasus (input voor de rekenmotor) ----------
export const CASE = {
  contractHours: 32,   // contracturen per week
  startHours: 8,       // start: 2 dagdelen × 4 uur
  weeklyIncrease: 4,   // wekelijkse opbouw in uren
  startDate: "2025-03-10",
  reportDate: "06-03-2025",
};

// ---------- Geëxtraheerde velden (mens-in-de-loop) ----------
// status: ok | missing  ·  src: id van bron-highlight
// Velden zonder src (geboortedatum, einddatum, werkgever) komen niet uit de
// terugkoppeling van de bedrijfsarts maar uit de personeelsadministratie:
// die vult de werkgever zelf in. Geboortedatum en einddatum sturen de adviezen.
export const INITIAL_FIELDS = [
  { group: "Werknemer & dienstverband", items: [
    { id: "naam",         label: "Naam werknemer",          value: "J. de Vries",               status: "ok",      src: "s-naam" },
    { id: "functie",      label: "Functie",                 value: "Administratief medewerker", status: "ok",      src: "s-functie" },
    { id: "uren",         label: "Contracturen",            value: "32 uur per week",           status: "ok",      src: "s-uren" },
    { id: "eersteZ",      label: "Eerste ziektedag",        value: "03-02-2025",                status: "ok",      src: "s-eerste" },
    { id: "geboortedatum",label: "Geboortedatum",           value: "14-08-1987",                status: "ok",      src: null },
    { id: "einddatum",    label: "Einddatum dienstverband", value: "[INVULLEN]",                status: "missing", src: null },
    { id: "werkgever",    label: "Werkgever",               value: "[INVULLEN]",                status: "missing", src: null },
  ]},
  { group: "Belastbaarheid & opbouw", items: [
    { id: "belast",    label: "Belastbaarheid",     value: "Licht werk, opbouw vanaf 2×4 uur", status: "ok", src: "s-belast" },
    { id: "opbouw",    label: "Opbouwtempo",        value: "Wekelijks +4 uur",            status: "ok",      src: "s-opbouw" },
    { id: "start",     label: "Startdatum opbouw",  value: "10-03-2025",                  status: "ok",      src: "s-start" },
    { id: "beperking", label: "Werkaanpassing",     value: "Afwisseling zitten/staan, geen piekbelasting", status: "ok", src: "s-aanpassing" },
  ]},
  { group: "Prognose", items: [
    { id: "prognose",  label: "Prognose herstel",   value: "Volledige werkhervatting binnen ±7 weken", status: "ok", src: "s-prognose" },
    { id: "evaluatie", label: "Eerstvolgende evaluatie", value: "[INVULLEN]",             status: "missing", src: null },
  ]},
];

export const MISSING = "[INVULLEN]";
export const isMissing = (v) => !v || v === MISSING;

// Veldwaarde opzoeken op id (voor previews, adviezen en download).
export function getVal(fields, id) {
  for (const g of fields) {
    const f = g.items.find((it) => it.id === id);
    if (f) return f.value;
  }
  return MISSING;
}

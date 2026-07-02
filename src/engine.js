/* Rekenmotor — deterministisch opbouwschema.
   Zelfde input, zelfde uitkomst: geen gegenereerde cijfers of aannames. */

function fmtDate(d) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/**
 * Bouwt het opbouwschema: vanaf startDate elke week `weeklyIncrease` uur erbij,
 * van startHours tot (en met) contractHours.
 * @returns {Array<{date: string, hours: number, pct: number}>}
 */
export function computeSchema({ contractHours, startHours, weeklyIncrease, startDate }) {
  // Guard: zonder positieve contracturen is er geen schema (en geen deling door
  // nul); zonder positieve wekelijkse uitbreiding zou de lus nooit eindigen.
  if (!(contractHours > 0)) return [];
  const rows = [];
  const d = new Date(startDate + "T00:00:00");
  for (let h = startHours; ; h += weeklyIncrease) {
    const hours = Math.min(h, contractHours);
    rows.push({ date: fmtDate(d), hours, pct: Math.ceil((hours / contractHours) * 100) }); // % afronden naar boven (v2 Stap 2 regel 4)
    if (hours >= contractHours || !(weeklyIncrease > 0)) break;
    d.setDate(d.getDate() + 7);
  }
  return rows;
}

/** Datum (dd-mm-jjjj) van volledige werkhervatting = laatste rij van het schema. */
export function fullRecoveryDate(schema) {
  return schema[schema.length - 1].date;
}

// Aantal werkdagen op basis van de contracturen (tenzij anders gespecificeerd).
// 36/38/40 → 5 · 28..35 → 4 · 22..27 → 3 · 15..21 → 2 · ≤14 → 1
export function werkdagen(contractHours) {
  if (contractHours >= 36) return 5;
  if (contractHours >= 28) return 4;
  if (contractHours >= 22) return 3;
  if (contractHours >= 15) return 2;
  return 1;
}

/**
 * Eigen opbouwschema wanneer de bedrijfsarts géén concreet ritme noemt.
 * Regel: tweewekelijks één uur per werkdag erbij, oplopend tot de contracturen.
 * @returns {Array<{date, hours, pct}>}
 */
export function computeDefaultSchema({ contractHours, startDate }) {
  if (!(contractHours > 0)) return [];
  const dagen = werkdagen(contractHours);
  const rows = [];
  const d = new Date(startDate + "T00:00:00");
  for (let h = dagen; ; h += dagen) {
    const hours = Math.min(h, contractHours);
    rows.push({ date: fmtDate(d), hours, pct: Math.ceil((hours / contractHours) * 100) }); // % afronden naar boven (v2 Stap 2 regel 4)
    if (hours >= contractHours) break;
    d.setDate(d.getDate() + 14); // tweewekelijks
  }
  return rows;
}

// ---- WAZO: zwangerschaps- en bevallingsverlof (deterministisch) ----
const DAG_MS = 86400000;
const WEEK = 7;
function parseDatum(s) {
  // accepteert "JJJJ-MM-DD" of "DD-MM-JJJJ"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s || "")) return new Date(s + "T00:00:00");
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s || "");
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}
function addDagen(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

/**
 * Berekent het WAZO-verlof uit de (vermoedelijke) bevallingsdatum. UWV-regels:
 * - terugtellen vanaf de DAG NÁ de uitgerekende datum;
 * - zwangerschapsverlof start in de flexibiliseringsperiode: 6-4 wk vóór
 *   (meerling 10-8 wk); stopt op de dag van de bevalling;
 * - bevallingsverlof start de dag ná de geboorte, minimaal 10 wk;
 * - niet-opgenomen zwangerschapsverlofdagen schuiven naar het bevallingsverlof,
 *   zodat het totaal minimaal 16 wk is (meerling 20 wk);
 * - later bevallen dan gepland → zwangerschapsverlof langer, bevallingsverlof
 *   blijft ≥10 wk, dus totaal > 16 wk.
 * Zonder werkelijke bevallingsdatum wordt met geboorte op de uitgerekende datum
 * gerekend (gepland=true). De flexibiliseringsperiode-ziektedagenregel wordt
 * NIET automatisch toegepast (randgeval).
 *
 * @param {{uitgerekendeDatum:string, meerling?:boolean, startWekenVoor?:number, werkelijkeBevalling?:string}} p
 * @returns {{gepland:boolean, venster:{vroegst:string,uiterlijk:string},
 *   zwangerschapsverlof:{start,eind,dagen,weken}, bevallingsverlof:{start,eind,dagen,weken},
 *   totaalDagen:number, totaalWeken:number}}
 */
export function computeWazo({ uitgerekendeDatum, meerling = false, startWekenVoor, werkelijkeBevalling } = {}) {
  const due = parseDatum(uitgerekendeDatum);
  if (!due) throw new Error("Ongeldige uitgerekende datum");
  const dagNa = addDagen(due, 1);                       // terugtellen vanaf de dag ná de uitgerekende datum
  const maxVoor = meerling ? 10 : 6;                    // vroegste start (weken vóór)
  const minVoor = meerling ? 8 : 4;                     // verplichte uiterste start
  const totaalMinDagen = (meerling ? 20 : 16) * WEEK;
  const bevMinDagen = 10 * WEEK;

  let weken = startWekenVoor == null ? maxVoor : startWekenVoor;
  weken = Math.max(minVoor, Math.min(maxVoor, weken));  // klem op de flexibiliseringsperiode
  const zwStart = addDagen(dagNa, -weken * WEEK);

  const bevalling = werkelijkeBevalling ? parseDatum(werkelijkeBevalling) : due;
  if (!bevalling) throw new Error("Ongeldige werkelijke bevallingsdatum");

  const takenZwDagen = Math.round((bevalling - zwStart) / DAG_MS) + 1; // t/m de dag van de bevalling
  // Plausibiliteit: een bevalling vóór de verlofstart geeft negatieve verlofdagen
  // en dus een onzinnige tijdlijn — beter falen dan stil doorrekenen.
  if (takenZwDagen < 1) throw new Error("De werkelijke bevallingsdatum ligt vóór de start van het zwangerschapsverlof — controleer de datums.");
  const bevDagen = Math.max(bevMinDagen, totaalMinDagen - takenZwDagen);
  const bevStart = addDagen(bevalling, 1);              // dag ná de geboorte
  const bevEind = addDagen(bevStart, bevDagen - 1);
  const totaalDagen = takenZwDagen + bevDagen;

  const blok = (start, eind, dagen) => ({ start: fmtDate(start), eind: fmtDate(eind), dagen, weken: +(dagen / WEEK).toFixed(1) });
  return {
    gepland: !werkelijkeBevalling,
    venster: { vroegst: fmtDate(addDagen(dagNa, -maxVoor * WEEK)), uiterlijk: fmtDate(addDagen(dagNa, -minVoor * WEEK)) },
    zwangerschapsverlof: blok(zwStart, bevalling, takenZwDagen),
    bevallingsverlof: blok(bevStart, bevEind, bevDagen),
    totaalDagen,
    totaalWeken: +(totaalDagen / WEEK).toFixed(1),
  };
}

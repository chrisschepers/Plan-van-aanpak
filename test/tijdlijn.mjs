/* Test voor de verzuim-tijdlijn (src/advice.js computeTijdlijn): anker op de
   eerste ziektedag, Poortwachter-mijlpalen, WAZO-verschuiving en eindpunten. */

import { computeTijdlijn } from "../src/advice.js";
import { computeWazo } from "../src/engine.js";
import { INITIAL_FIELDS } from "../src/casedata.js";

let failures = 0;
const check = (n, c) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) failures++; };

function setField(fields, id, value) {
  return fields.map((g) => ({ ...g, items: g.items.map((it) => it.id === id
    ? { ...it, value, status: value && value !== "[INVULLEN]" ? "ok" : "missing" } : it) }));
}

// 1. Basis: alleen eerste ziektedag → mijlpalen + einde wachttijd wk 104, geen verschuiving.
const t = computeTijdlijn(INITIAL_FIELDS);
check("tijdlijn aanwezig bij eerste ziektedag", !!t);
check("anker = 03-02-2025", t.anker.datum === "03-02-2025");
check("einde wachttijd op wk 104", t.eindeWachttijd.week === 104);
check("einde wachttijd niet verschoven", t.eindeWachttijd.verschovenDoorWazo === false);
check("bevat mijlpaal wk 1 en wk 104", t.events.some((e) => e.id === "pw-1") && t.events.some((e) => e.id === "pw-104"));
check("loondoorbetaling-baan met cao-noot", t.banen[0].id === "loondoorbetaling" && /cao/i.test(t.banen[0].noot));
check("geen einde dienstverband zonder einddatum", !t.events.some((e) => e.categorie === "zud"));
check("geen AOW-marker (geboortedatum 1987 ligt te ver)", !t.events.some((e) => e.categorie === "aow"));

// 2. Met WAZO (uitgerekend 01-09-2025) → einde wachttijd schuift 16 wk op naar wk 120.
const wazo = computeWazo({ uitgerekendeDatum: "2025-09-01" });
const tw = computeTijdlijn(INITIAL_FIELDS, { wazo });
check("WAZO-verlofblok aanwezig", tw.events.some((e) => e.categorie === "wazo"));
check("einde wachttijd verschoven naar wk 120", tw.eindeWachttijd.week === 120);
check("einde wachttijd gemarkeerd als verschoven", tw.eindeWachttijd.verschovenDoorWazo === true);
check("mijlpaal vóór verlof niet verschoven", tw.events.find((e) => e.id === "pw-1").verschoven === false);
check("mijlpaal ná verlof verschoven", tw.events.find((e) => e.id === "pw-104").verschoven === true);

// 3. Met einddatum tijdens ziekte → eindpunt 'einde dienstverband'.
const tz = computeTijdlijn(setField(INITIAL_FIELDS, "einddatum", "30-06-2025"));
check("einde dienstverband als eindpunt", tz.events.some((e) => e.categorie === "zud" && e.titel === "Einde dienstverband"));

// 4. Geboortedatum dicht bij de AOW → AOW-marker verschijnt.
const to = computeTijdlijn(setField(INITIAL_FIELDS, "geboortedatum", "01-10-1959"));
check("AOW-marker bij oudere werknemer", to.events.some((e) => e.categorie === "aow"));

console.log(failures === 0 ? "\nAlle tijdlijn-checks geslaagd." : `\n${failures} tijdlijn-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

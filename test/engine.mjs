/* Tests voor de rekenmotor-guards en de schema-herberekening (audit 2 juli):
   - computeSchema/computeDefaultSchema mogen nooit oneindig lussen of door nul delen;
   - computeWazo weigert een bevallingsdatum vóór de verlofstart;
   - deriveSchema berekent het schema opnieuw zodra de contracturen zijn aangevuld
     (de flow achter "vul de contracturen aan, dan berekent de tool het schema"). */

import { computeSchema, computeDefaultSchema, computeWazo } from "../src/engine.js";
import { deriveSchema } from "../src/extract.js";

let fail = 0;
const check = (naam, ok) => { console.log(`${ok ? "✓" : "✗"} ${naam}`); if (!ok) fail++; };

// 1) Normale opbouw blijft werken.
let s = computeSchema({ contractHours: 36, startHours: 8, weeklyIncrease: 4, startDate: "2026-02-24" });
check("normaal schema eindigt op contracturen", s.length > 1 && s[s.length - 1].hours === 36);
check("percentage naar boven afgerond", s[0].pct === Math.ceil((8 / 36) * 100));

// 2) Guards: geen oneindige lus / deling door nul.
s = computeSchema({ contractHours: 36, startHours: 8, weeklyIncrease: 0, startDate: "2026-02-24" });
check("weeklyIncrease 0 → één rij, geen hang", s.length === 1 && s[0].hours === 8);
check("contractHours 0 → leeg schema", computeSchema({ contractHours: 0, startHours: 8, weeklyIncrease: 4, startDate: "2026-02-24" }).length === 0);
check("default-schema contractHours 0 → leeg", computeDefaultSchema({ contractHours: 0, startDate: "2026-02-24" }).length === 0);

// 3) WAZO: bevalling vóór de verlofstart is een invoerfout, geen stille uitkomst.
let threw = false;
try { computeWazo({ uitgerekendeDatum: "2026-09-01", werkelijkeBevalling: "2026-06-01" }); } catch { threw = true; }
check("computeWazo weigert bevalling vóór verlofstart", threw);
check("computeWazo normaal blijft werken", computeWazo({ uitgerekendeDatum: "2026-09-01" }).totaalWeken >= 16);

// 4) Herberekening: ontbrekende contracturen → uitleg; daarna aangevuld → schema.
const leeg = deriveSchema({ reken: { contractHours: 0, startHours: 0, weeklyIncrease: 0, startDateISO: "" }, signalen: {}, startdatumOpbouwNL: "" });
check("zonder contracturen: geen schema + uitleg", leeg.schema.length === 0 && /contracturen/.test(leeg.opbouwReden));
const aangevuld = deriveSchema({ reken: { contractHours: 32, startHours: 0, weeklyIncrease: 0, startDateISO: "2026-03-02" }, signalen: {}, startdatumOpbouwNL: "" });
check("contracturen aangevuld → zelf-opgesteld schema", aangevuld.schema.length > 0 && aangevuld.schemaZelfOpgesteld === true && aangevuld.opbouwReden === "");

// 5) Herberekening volgt het ritme van de arts wanneer dat compleet is.
const ritme = deriveSchema({ reken: { contractHours: 36, startHours: 8, weeklyIncrease: 4, startDateISO: "2026-02-24" }, signalen: {}, startdatumOpbouwNL: "" });
check("compleet ritme → arts-schema (niet zelf-opgesteld)", ritme.schema.length > 0 && ritme.schemaZelfOpgesteld === false);

// 6) Signalen blijven leidend: geen benutbare mogelijkheden → nooit een schema.
const gbm = deriveSchema({ reken: { contractHours: 36, startHours: 8, weeklyIncrease: 4, startDateISO: "2026-02-24" }, signalen: { geenBenutbareMogelijkheden: true }, startdatumOpbouwNL: "" });
check("geen benutbare mogelijkheden → geen schema", gbm.schema.length === 0 && gbm.opbouwReden.length > 0);

console.log(fail ? `\n${fail} engine-check(s) gefaald.` : "\nAlle engine-checks geslaagd.");
process.exit(fail ? 1 : 0);

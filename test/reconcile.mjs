/* Test voor de self-consistency-reconciliatie (server/reconcile.js).
   Borgt: meerderheidsstem op signalen, modus/mediaan op reken-getallen,
   modus-met-terugval op tekstvelden. */

import { reconcile } from "../server/reconcile.js";

let fail = 0;
const check = (naam, ok) => { console.log(`${ok ? "✓" : "✗"} ${naam}`); if (!ok) fail++; };

const s = (over = {}) => ({
  naam: "P. Driessen", contracturen: "36 uur per week", belastbaarheid: "Licht werk",
  signalen: { marginaleMogelijkheden: false, arbeidsconflict: false },
  reken: { contractHours: 36, startHours: 8, weeklyIncrease: 4, startDateISO: "2026-02-24" },
  ...over,
});

// 1) één sample → ongewijzigd terug
const single = s();
check("één sample → identiek", reconcile([single]) === single);

// 2) signaal-meerderheid (2 van 3 → aan; 1 van 3 → uit)
let r = reconcile([
  s({ signalen: { marginaleMogelijkheden: true, arbeidsconflict: false } }),
  s({ signalen: { marginaleMogelijkheden: true, arbeidsconflict: true } }),
  s({ signalen: { marginaleMogelijkheden: false, arbeidsconflict: false } }),
]);
check("signaal in 2/3 → aan", r.signalen.marginaleMogelijkheden === true);
check("signaal in 1/3 → uit", r.signalen.arbeidsconflict === false);

// 3) reken-getal: modus wint bij meerderheid
r = reconcile([
  s({ reken: { contractHours: 36, startHours: 8, weeklyIncrease: 4, startDateISO: "2026-02-24" } }),
  s({ reken: { contractHours: 36, startHours: 8, weeklyIncrease: 4, startDateISO: "2026-02-24" } }),
  s({ reken: { contractHours: 36, startHours: 0, weeklyIncrease: 0, startDateISO: "" } }),
]);
check("startHours modus 8 (2/3)", r.reken.startHours === 8);
check("weeklyIncrease modus 4 (2/3)", r.reken.weeklyIncrease === 4);
check("startDateISO modus van niet-lege", r.reken.startDateISO === "2026-02-24");

// 4) reken-getal zonder meerderheid → mediaan
r = reconcile([
  s({ reken: { contractHours: 32, startHours: 8, weeklyIncrease: 0, startDateISO: "" } }),
  s({ reken: { contractHours: 32, startHours: 4, weeklyIncrease: 0, startDateISO: "" } }),
  s({ reken: { contractHours: 32, startHours: 0, weeklyIncrease: 0, startDateISO: "" } }),
]);
check("startHours zonder meerderheid → mediaan 4", r.reken.startHours === 4);
check("contractHours unaniem → 32", r.reken.contractHours === 32);

// 5) tekstveld: modus bij meerderheid, anders sample[0]
r = reconcile([s({ contracturen: "36 uur per week" }), s({ contracturen: "36 uur per week" }), s({ contracturen: "40 uur per week" })]);
check("contracturen modus 36 (2/3)", r.contracturen === "36 uur per week");
r = reconcile([s({ naam: "A" }), s({ naam: "B" }), s({ naam: "C" })]);
check("naam zonder meerderheid → sample[0]", r.naam === "A");

// 6) lege invoer faalt netjes
let threw = false;
try { reconcile([]); } catch { threw = true; }
check("lege samples → fout", threw);

// 7) bronnen horen bij de GEKOZEN waarde, niet blind bij sample[0]
r = reconcile([
  s({ belastbaarheid: "Zwaar werk", bronnen: { belastbaarheid: "citaat-zwaar" } }),
  s({ belastbaarheid: "Licht werk", bronnen: { belastbaarheid: "citaat-licht" } }),
  s({ belastbaarheid: "Licht werk", bronnen: { belastbaarheid: "citaat-licht-2" } }),
]);
check("bron volgt de meerderheidswaarde", r.belastbaarheid === "Licht werk" && r.bronnen.belastbaarheid === "citaat-licht");
r = reconcile([
  s({ belastbaarheid: "A", bronnen: { belastbaarheid: "citaat-A" } }),
  s({ belastbaarheid: "B", bronnen: { belastbaarheid: "citaat-B" } }),
  s({ belastbaarheid: "C", bronnen: { belastbaarheid: "citaat-C" } }),
]);
check("geen meerderheid → sample[0]-waarde mét bijpassend citaat", r.belastbaarheid === "A" && r.bronnen.belastbaarheid === "citaat-A");
r = reconcile([
  s({ opbouwtempo: "", bronnen: {} }),
  s({ opbouwtempo: "4 uur per week erbij", bronnen: { opbouwtempo: "citaat-tempo" } }),
  s({ opbouwtempo: "", bronnen: {} }),
]);
check("gekozen lege waarde → geen misleidend citaat", r.opbouwtempo === "" && r.bronnen.opbouwtempo === "");

console.log(fail ? `\n${fail} reconcile-check(s) gefaald.` : "\nAlle reconcile-checks geslaagd.");
process.exit(fail ? 1 : 0);

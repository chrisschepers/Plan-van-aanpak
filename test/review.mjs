/* Test voor de signaal-reviewer (src/extract.js): leidt gemiste
   belastbaarheidstoestanden af uit ondubbelzinnige domeintaal, met hoge
   precisie. Fixtures zijn de échte door het model geëxtraheerde teksten van de
   10 sample-terugkoppelingen. Belangrijkste eis: geen vals-positieven
   (m.n. casus 09 "max 8 uur/week mét opbouw" mag NIET marginaal worden). */

import { reviewSignals, normalizeExtraction } from "../src/extract.js";

let fail = 0;
const check = (naam, ok) => { console.log(`${ok ? "✓" : "✗"} ${naam}`); if (!ok) fail++; };

// Welke onderling uitsluitende toestand komt eruit na reviewer + normalisatie?
function toestand(fix) {
  const s = normalizeExtraction(reviewSignals(fix)).signalen;
  if (s.duurzaamGeenMogelijkheden) return "duurzaam";
  if (s.geenBenutbareMogelijkheden) return "gbm";
  if (s.volledigInzetbaar) return "volledig";
  if (s.marginaleMogelijkheden) return "marginaal";
  return "opbouw";
}
const fix = (belastbaarheid, prognose, contractHours, startHours, weeklyIncrease = 0) =>
  ({ belastbaarheid, prognose, signalen: {}, reken: { contractHours, startHours, weeklyIncrease } });

const C = {
  "01 standaard": [fix("Beperkt voor tillen en bovenhands werken. Zittend, administratief werk is goed mogelijk.", "Volledige werkhervatting in de eigen functie binnen ongeveer 7 weken, mits de opbouw zonder terugval verloopt.", 36, 8, 4), "opbouw"],
  "02 geen ritme": [fix("Beperkt in concentratie en in het hanteren van werkdruk. Lichte, afgebakende taken zijn wel mogelijk.", "De verwachte verzuimduur is op dit moment nog niet goed in te schatten.", 28, 0), "opbouw"],
  "03 ziek uit dienst": [fix("Beperkt voor langdurig staan en lopen, tillen boven 5 kg. Zittend en licht staand werk is mogelijk.", "In aangepast werk wordt een goede opbouw verwacht.", 38, 20, 4), "opbouw"],
  "04 ouder": [fix("Gebaat bij regelmaat; piekbelasting vermijden; administratieve taken zijn goed mogelijk.", "Volledige werkhervatting in de eigen functie verwacht binnen acht à tien weken.", 32, 8, 4), "opbouw"],
  "05 GBM": [fix("Op dit moment zijn er geen benutbare mogelijkheden voor arbeid. Re-integratieactiviteiten zijn nu niet aan de orde.", "De verwachte verzuimduur is op dit moment niet in te schatten.", 40, 0), "gbm"],
  "06 volledig inzetbaar": [fix("Geen functionele beperkingen vastgesteld; volledig inzetbaar voor passende werkzaamheden.", "Bij een geslaagd gesprek is volledige werkhervatting op korte termijn mogelijk.", 32, 0), "volledig"],
  "07 arbeidstherapeutisch": [fix("Opbouw in dagdelen; geen volledige werkdagen in deze fase. Korte, afgebakende taken zijn passend.", "Geleidelijk herstel van de belastbaarheid verwacht; het tempo is nu nog niet aan te geven.", 30, 0), "opbouw"],
  "08 marginaal": [fix("Maximaal twee keer twee uur per week licht, zittend werk. Geen fysieke belasting, geen tijdsdruk.", "Uitbreiding van uren is op korte termijn niet te verwachten.", 36, 4), "marginaal"],
  "09 stagnatie (geen marginaal!)": [fix("Licht werk, maximaal 8 uur per week, met afwisseling van taken en zonder piekbelasting.", "", 24, 8), "opbouw"],
  "10 duurzaam/IVA": [fix("Duurzaam geen benutbare mogelijkheden voor arbeid, ook niet voor aangepast of ander werk.", "Geen verwachting dat de situatie nog verbetert; een vervroegde WIA-aanvraag (IVA) kan worden overwogen.", 40, 0), "duurzaam"],
};

for (const [naam, [fixture, verwacht]] of Object.entries(C)) {
  check(`${naam} → ${verwacht}`, toestand(fixture) === verwacht);
}

// Extra: reviewer zet signalen alleen AAN, raakt feitelijke velden niet
const before = fix("Beperkt voor tillen.", "Herstel binnen 6 weken.", 36, 8, 4);
before.naam = "X";
const after = reviewSignals(before);
check("reviewer laat feitelijke velden ongemoeid", after.naam === "X" && after.reken.startHours === 8);
check("reviewer zet niets aan bij neutrale tekst", Object.values(after.signalen).every((v) => !v));

console.log(fail ? `\n${fail} review-check(s) gefaald.` : "\nAlle review-checks geslaagd.");
process.exit(fail ? 1 : 0);

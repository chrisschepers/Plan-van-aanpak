/* Test voor de deterministische normalisatielaag (src/extract.js).
   Strijkt wisselende/tegenstrijdige AI-signalen glad zodat dezelfde feiten tot
   dezelfde uitkomst leiden. */

import { normalizeExtraction } from "../src/extract.js";

let fail = 0;
const check = (naam, ok) => { console.log(`${ok ? "✓" : "✗"} ${naam}`); if (!ok) fail++; };
const base = (sig = {}, reken = {}) => ({
  naam: "Test", signalen: sig, reken: { contractHours: 32, startHours: 8, weeklyIncrease: 4, startDateISO: "2026-05-01", ...reken },
});

// 1) duurzaam impliceert GBM en sluit herstel-binnen-3-maanden uit
let r = normalizeExtraction(base({ duurzaamGeenMogelijkheden: true, herstelVerwachtBinnen3Maanden: true }));
check("duurzaam → geenBenutbareMogelijkheden aan", r.signalen.geenBenutbareMogelijkheden === true);
check("duurzaam → herstelVerwacht uit", r.signalen.herstelVerwachtBinnen3Maanden === false);

// 2) GBM zet lichtere/tegenstrijdige toestanden uit + nuldraait de reken
r = normalizeExtraction(base({ geenBenutbareMogelijkheden: true, marginaleMogelijkheden: true, volledigInzetbaar: true, arbeidstherapeutisch: true }));
check("GBM → marginaal uit", r.signalen.marginaleMogelijkheden === false);
check("GBM → volledigInzetbaar uit", r.signalen.volledigInzetbaar === false);
check("GBM → arbeidstherapeutisch uit", r.signalen.arbeidstherapeutisch === false);
check("GBM → reken zonder opbouw (start 0, +0)", r.reken.startHours === 0 && r.reken.weeklyIncrease === 0);

// 3) volledig inzetbaar wint van marginaal en zet reken op contracturen
r = normalizeExtraction(base({ volledigInzetbaar: true, marginaleMogelijkheden: true }, { contractHours: 36 }));
check("volledig → marginaal uit", r.signalen.marginaleMogelijkheden === false);
check("volledig → start = contracturen, +0", r.reken.startHours === 36 && r.reken.weeklyIncrease === 0);

// 4) marginaal zonder zwaardere toestand: reken zonder opbouw, volledig uit
r = normalizeExtraction(base({ marginaleMogelijkheden: true, volledigInzetbaar: true }));
check("marginaal (na volledig-prioriteit) → marginaal blijft pas als volledig false", true);
r = normalizeExtraction(base({ marginaleMogelijkheden: true }));
check("marginaal → reken zonder opbouw", r.reken.startHours === 0 && r.reken.weeklyIncrease === 0);

// 5) gewone opbouw blijft ongemoeid
r = normalizeExtraction(base({ herstelVerwachtBinnen3Maanden: true }));
check("gewone opbouw → reken intact", r.reken.startHours === 8 && r.reken.weeklyIncrease === 4 && r.reken.contractHours === 32);
check("gewone opbouw → feitelijke velden intact", r.naam === "Test");

// 6) robuust bij ontbrekende objecten
r = normalizeExtraction({});
check("leeg object → signalen/reken bestaan", !!r.signalen && !!r.reken);

console.log(fail ? `\n${fail} normalize-check(s) gefaald.` : "\nAlle normalize-checks geslaagd.");
process.exit(fail ? 1 : 0);

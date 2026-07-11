/* Test voor het WAZO-rekenblok (src/engine.js computeWazo): zwangerschaps- en
   bevallingsverlof uit de (vermoedelijke) bevallingsdatum, volgens de UWV-regels. */

import { computeWazo } from "../src/engine.js";

let failures = 0;
const check = (n, c) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) failures++; };
const eq = (n, a, b) => check(`${n} (verwacht ${b}, kreeg ${a})`, a === b);

// 1. Enkelvoud, gepland (geboorte op uitgerekende datum), standaard start 6 wk vóór.
//    Uitgerekend 01-07-2026 → terugtellen vanaf 02-07-2026.
const a = computeWazo({ uitgerekendeDatum: "2026-07-01" });
eq("venster vroegst (6 wk vóór dag-na)", a.venster.vroegst, "21-05-2026");
eq("venster uiterlijk (4 wk vóór dag-na)", a.venster.uiterlijk, "04-06-2026");
eq("zwangerschapsverlof start", a.zwangerschapsverlof.start, "21-05-2026");
eq("zwangerschapsverlof stopt op dag bevalling", a.zwangerschapsverlof.eind, "01-07-2026");
eq("zwangerschapsverlof weken", a.zwangerschapsverlof.weken, 6);
eq("bevallingsverlof start = dag ná geboorte", a.bevallingsverlof.start, "02-07-2026");
eq("bevallingsverlof eind", a.bevallingsverlof.eind, "09-09-2026");
eq("bevallingsverlof weken", a.bevallingsverlof.weken, 10);
eq("totaal weken", a.totaalWeken, 16);
check("gepland=true zonder werkelijke bevallingsdatum", a.gepland === true);

// 2. Latere start (4 wk vóór) → bevallingsverlof 12 wk, totaal blijft 16 wk.
const b = computeWazo({ uitgerekendeDatum: "2026-07-01", startWekenVoor: 4 });
eq("start 4 wk → zwangerschap weken", b.zwangerschapsverlof.weken, 4);
eq("start 4 wk → bevalling weken", b.bevallingsverlof.weken, 12);
eq("start 4 wk → totaal weken", b.totaalWeken, 16);

// 3. Buiten de flexibiliseringsperiode wordt geklemd (3→4 wk, 8→6 wk).
eq("klem onder venster (3→4)", computeWazo({ uitgerekendeDatum: "2026-07-01", startWekenVoor: 3 }).zwangerschapsverlof.weken, 4);
eq("klem boven venster (8→6)", computeWazo({ uitgerekendeDatum: "2026-07-01", startWekenVoor: 8 }).zwangerschapsverlof.weken, 6);

// 4. Meerling → venster 10-8 wk vóór, totaal 20 wk.
const m = computeWazo({ uitgerekendeDatum: "2026-07-01", meerling: true });
eq("meerling venster vroegst (10 wk)", m.venster.vroegst, "23-04-2026");
eq("meerling zwangerschap weken", m.zwangerschapsverlof.weken, 10);
eq("meerling bevalling weken", m.bevallingsverlof.weken, 10);
eq("meerling totaal weken", m.totaalWeken, 20);

// 5. Eerder bevallen (1 wk te vroeg) → totaal blijft 16 wk, bevallingsverlof langer.
const vroeg = computeWazo({ uitgerekendeDatum: "2026-07-01", werkelijkeBevalling: "2026-06-24" });
eq("vroeg bevallen → totaal blijft 16 wk", vroeg.totaalWeken, 16);
eq("vroeg bevallen → bevallingsverlof 11 wk", vroeg.bevallingsverlof.weken, 11);
check("vroeg bevallen → gepland=false", vroeg.gepland === false);

// 6. Later bevallen (1 wk te laat) → bevallingsverlof blijft 10 wk, totaal > 16 wk.
const laat = computeWazo({ uitgerekendeDatum: "2026-07-01", werkelijkeBevalling: "2026-07-08" });
eq("laat bevallen → bevallingsverlof 10 wk", laat.bevallingsverlof.weken, 10);
eq("laat bevallen → totaal 17 wk", laat.totaalWeken, 17);

// 7. Vermeerdering gemeten t/m de uitgerekende datum (art. 3:1 lid 3 WAZO):
//    korter gekozen verlof + later bevallen eet de vermeerdering NIET op.
//    Naslagwerktabel: 4 wk ervoor + 2 wk te laat → bevallingsverlof 12 wk.
const laatKort = computeWazo({ uitgerekendeDatum: "2026-07-01", startWekenVoor: 4, werkelijkeBevalling: "2026-07-15" });
eq("4 wk vóór + 2 wk te laat → zwangerschap 6 wk", laatKort.zwangerschapsverlof.weken, 6);
eq("4 wk vóór + 2 wk te laat → bevallingsverlof 12 wk", laatKort.bevallingsverlof.weken, 12);
eq("4 wk vóór + 2 wk te laat → totaal 18 wk", laatKort.totaalWeken, 18);

// 8. Naslagwerktabel, overige rijen (één kind): 4 wk ervoor + 2 wk te vroeg → 14 wk.
const vroegKort = computeWazo({ uitgerekendeDatum: "2026-07-01", startWekenVoor: 4, werkelijkeBevalling: "2026-06-17" });
eq("4 wk vóór + 2 wk te vroeg → bevallingsverlof 14 wk", vroegKort.bevallingsverlof.weken, 14);
eq("4 wk vóór + 2 wk te vroeg → totaal 16 wk", vroegKort.totaalWeken, 16);

// 9. Naslagwerktabel meerling: 8 wk ervoor → 12 wk; ook bij 2 wk te laat 12 wk.
const m8 = computeWazo({ uitgerekendeDatum: "2026-07-01", meerling: true, startWekenVoor: 8 });
eq("meerling 8 wk vóór → bevallingsverlof 12 wk", m8.bevallingsverlof.weken, 12);
const m8laat = computeWazo({ uitgerekendeDatum: "2026-07-01", meerling: true, startWekenVoor: 8, werkelijkeBevalling: "2026-07-15" });
eq("meerling 8 wk vóór + 2 wk te laat → bevallingsverlof 12 wk", m8laat.bevallingsverlof.weken, 12);
const m8vroeg = computeWazo({ uitgerekendeDatum: "2026-07-01", meerling: true, startWekenVoor: 8, werkelijkeBevalling: "2026-06-17" });
eq("meerling 8 wk vóór + 2 wk te vroeg → bevallingsverlof 14 wk", m8vroeg.bevallingsverlof.weken, 14);

console.log(failures === 0 ? "\nAlle wazo-checks geslaagd." : `\n${failures} wazo-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

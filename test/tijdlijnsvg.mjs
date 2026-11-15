/* Test voor de SVG-weergave van de tijdlijn (src/tijdlijnsvg.js). Pure functie. */

import { renderTijdlijnSvg } from "../src/tijdlijnsvg.js";
import { computeTijdlijn } from "../src/advice.js";
import { computeWazo } from "../src/engine.js";
import { INITIAL_FIELDS } from "../src/casedata.js";

let failures = 0;
const check = (n, c) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) failures++; };

const t = computeTijdlijn(INITIAL_FIELDS, { wazo: computeWazo({ uitgerekendeDatum: "2025-08-01" }) });
const { svg, width, height } = renderTijdlijnSvg(t);

check("geldig <svg> met afmetingen", svg.startsWith("<svg") && svg.endsWith("</svg>") && width > 0 && height > 0);
check("bevat de kop", svg.includes("Tijdlijn verzuim"));
check("bevat mijlpaal-titels", svg.includes("Ziekmelding") && svg.includes("Einde wachttijd"));
check("bevat het WAZO-blok", svg.includes("WAZO"));
check("bevat de uitgerekende-datum-markering", svg.includes("uitgerekend"));
check("bevat loondoorbetaling met jaar-2 70%", svg.includes("LOONDOORBETALING") && svg.includes("70%"));
check("welgevormd (evenveel < als >)", (svg.match(/</g) || []).length === (svg.match(/>/g) || []).length);
check("geen on-ge-escapete &", !/&(?!amp;|lt;|gt;|#)/.test(svg));

// Zonder WAZO blijft het werken (basistijdlijn).
const base = renderTijdlijnSvg(computeTijdlijn(INITIAL_FIELDS));
check("basistijdlijn (zonder WAZO) rendert", base.svg.includes("Tijdlijn verzuim") && !base.svg.includes("WAZO"));

console.log(failures === 0 ? "\nAlle tijdlijnsvg-checks geslaagd." : `\n${failures} tijdlijnsvg-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

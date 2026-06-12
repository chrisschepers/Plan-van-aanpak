/* Smoke-test: rendert de site in jsdom en klikt de hele flow door.
   landing → tool → voorbeeldcasus → verwerken → verificatie → preview → download-gate. */

import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { setTimeout as wait } from "timers/promises";

const dom = new JSDOM(`<!DOCTYPE html><html lang="nl"><body><div id="root"></div></body></html>`, {
  url: "https://planvanaanpakinvuller.nl/",
  pretendToBeVisual: true,
  runScripts: "outside-only",
});
const { window } = dom;

// stubs voor APIs die jsdom niet heeft
window.scrollTo = () => {};
window.Element.prototype.scrollTo = () => {};
window.URL.createObjectURL = () => "blob:test";
window.URL.revokeObjectURL = () => {};
// downloadanker niet echt laten navigeren in jsdom
window.HTMLAnchorElement.prototype.click = () => {};
// docx (Packer) heeft deze browser-globals nodig; in jsdom ontbreken ze
window.TextEncoder = TextEncoder;
window.TextDecoder = TextDecoder;
window.Blob = window.Blob || Blob;

const run = (file) => window.eval(readFileSync(file, "utf8"));
run("node_modules/react/umd/react.development.js");
run("node_modules/react-dom/umd/react-dom.development.js");
run("app.js");

const $ = (sel) => window.document.querySelector(sel);
const $$ = (sel) => [...window.document.querySelectorAll(sel)];
const byText = (sel, txt) => $$(sel).find((el) => el.textContent.includes(txt));
const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? "✓" : "✗"} ${name}`);
  if (!cond) failures++;
}

await wait(100);

// Landing
check("landing rendert hero", !!byText("h1", "automatisch ingevuld"));
check("landing heeft FAQ", !!byText("h2", "privacy en verantwoordelijkheid"));
check("landing heeft 4 stappen", $$(".step").length === 4);

// Open de tool
click(byText("button", "Probeer de PvA-invuller"));
await wait(50);
check("tool opent op stap 1 (upload)", !!byText("h1", "Lever de terugkoppeling"));

// Voorbeeldcasus laden en verwerken (via de voorbeeld-link)
click(byText(".example-link button", "voorbeeldcasus"));
await wait(50);
check("voorbeeldbestand geladen", !!byText(".file-chip .nm", "terugkoppeling-bedrijfsarts.pdf"));
click(byText("button", "Verwerk"));
await wait(50);
check("verwerken toont voortgang", !!byText("h3", "Concept wordt opgesteld"));
await wait(2300);

// Stap 2 — verificatie
check("stap 2: verificatiescherm", !!byText("h1", "Controleer de geëxtraheerde gegevens"));
check("data-velden aanwezig (10)", $$(".field-row:not(.computed)").length === 10);
check("1 veld ontbreekt (einddatum)", $$(".field-row.missing").length === 1);
check("naam/werkgever/evaluatie verwijderd", !byText(".field-row .flabel", "Naam werknemer") && !byText(".field-row .flabel", "Eerstvolgende evaluatie"));
check("geboortedatum-veld aanwezig", !!byText(".field-row .flabel", "Geboortedatum"));
check("einddatum dienstverband-veld aanwezig", !!byText(".field-row .flabel", "Einddatum dienstverband"));
check("berekend: AOW-datum aanwezig", !!byText(".field-row.computed .flabel", "AOW") && !!byText(".field-row.computed .fval", "2054"));
check("berekend: einde wachttijd aanwezig", !!byText(".field-row.computed .flabel", "Einde wachttijd") && !!byText(".field-row.computed .fval", "2027"));
check("bron-highlights aanwezig (9)", $$(".srcdoc .hl").length === 9);
check("medische redacties aanwezig (4)", $$(".srcdoc span.redact").length === 4);
check("opbouwschema heeft 7 rijen", $$(".schema-table tbody tr").length === 7);
check("schema eindigt op 100% per 21-04-2025", !!byText(".schema-table tr", "21-04-2025"));

// veld → bron koppeling
click($$(".field-row")[1]);
await wait(30);
check("veldklik activeert bron-highlight", $$(".hl.active").length === 1);

// gate: knop disabled tot vinkje
const naarPreview = byText("button", "Naar preview");
check("preview-knop geblokkeerd zonder controle", naarPreview.disabled);
click($(".control-check"));
await wait(30);
check("controle-vinkje ontgrendelt", !byText("button", "Naar preview").disabled);
click(byText("button", "Naar preview"));
await wait(50);

// Stap 3 — preview
check("stap 3: preview", !!byText("h1", "Preview en download"));
check("3 preview-tabs", $$(".preview-tabs button").length === 3);
click($$(".preview-tabs button")[1]);
await wait(30);
check("PvA-tab toont UWV-formulierweergave", !!byText(".uwv-bar", "Werknemer"));
check("PvA toont ingevulde functie", !!byText(".uwv-val", "Administratief medewerker"));
check("PvA heeft einddoel-vinkje aangekruist", $$(".uwv-box.on").length >= 1);
check("PvA toont sectie 7E (sociaal-medisch)", !!byText(".uwv-cat", "Sociaal-medische"));
check("PvA toont AG140-footer", !!byText(".uwv-foot", "AG140"));
// Begeleidend bericht met verweven adviezen
click($$(".preview-tabs button")[2]);
await wait(30);
check("bericht-tab toont begeleidend bericht", !!byText(".doc-sheet h2", "Begeleidend bericht"));
check("bericht bevat verweven advies (verzuimdossier)", !!byText(".doc-sheet", "verzuimdossier"));
check("bericht bevat einddatum-advies", !!byText(".doc-sheet", "einddatum"));
// Eén gecombineerde downloadknop, actief na controle (download zelf: zie merge.mjs)
const dlBtn = byText(".dl-buttons button", "Download als Word");
check("download-knop aanwezig en actief na controle", !!dlBtn && !dlBtn.disabled);
check("download-bar noemt één document (bericht + PvA)", !!byText(".dl-info h4", "Plan van aanpak"));

console.log(failures === 0 ? "\nAlle checks geslaagd." : `\n${failures} check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

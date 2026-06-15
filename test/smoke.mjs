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

// Privacyverklaring-pagina (concept) opent en sluit
click(byText("button", "Lees de privacyverklaring"));
await wait(50);
check("privacyverklaring opent", !!byText("h1", "Privacyverklaring") && !!byText(".tool-body", "AI-transparantie"));
check("privacyverklaring is gemarkeerd als concept", !!byText(".tool-body", "Concept"));
check("privacyverklaring noemt verwerker-rol", !!byText(".tool-body", "verwerker"));
click(byText(".tool-back", "Terug naar site"));
await wait(40);
check("privacyverklaring sluit terug naar landing", !byText("h1", "Privacyverklaring") && !!byText("h1", "automatisch ingevuld"));

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
check("data-velden aanwezig (12)", $$(".field-row:not(.computed)").length === 12);
check("1 veld ontbreekt (einddatum)", $$(".field-row.missing").length === 1);
check("naam werknemer + bedrijfsarts aanwezig", !!byText(".field-row .flabel", "Naam werknemer") && !!byText(".field-row .flabel", "Naam bedrijfsarts"));
check("werkgever/evaluatie verwijderd", !byText(".field-row .flabel", "Bedrijfsnaam") && !byText(".field-row .flabel", "Eerstvolgende evaluatie"));
check("geboortedatum-veld aanwezig", !!byText(".field-row .flabel", "Geboortedatum"));
check("einddatum dienstverband-veld aanwezig", !!byText(".field-row .flabel", "Einddatum dienstverband"));
check("berekend: AOW-datum aanwezig", !!byText(".field-row.computed .flabel", "AOW") && !!byText(".field-row.computed .fval", "2054"));
check("berekend: einde wachttijd aanwezig", !!byText(".field-row.computed .flabel", "Einde wachttijd") && !!byText(".field-row.computed .fval", "2027"));
check("bron-highlights aanwezig (8)", $$(".srcdoc .hl").length === 8);
check("geen medische redacties/beeld in bron meer", $$(".srcdoc span.redact").length === 0 && !byText(".srcdoc", "medisch beeld"));
check("opbouwschema heeft 7 rijen", $$(".schema-table:not(.termijnen-table) tbody tr").length === 7);
check("schema eindigt op 100% per 21-04-2025", !!byText(".schema-table tr", "21-04-2025"));
check("poortwachter-termijnen zichtbaar", !!byText(".termijnen-panel h3", "Poortwachter-termijnen") && !!byText(".termijnen-table", "42e-weeksmelding"));

// veld → bron koppeling (klik op een veld mét bronpassage, bv. Functie)
click(byText(".field-row .flabel", "Functie").closest(".field-row"));
await wait(30);
check("veldklik activeert bron-highlight", $$(".hl.active").length === 1);

// bewerk-knop: eigen, altijd-zichtbare tikknop met label (niet meer hover-only/overlappend)
check("bewerk-knop aanwezig met label", !!byText(".field-row .fedit", "Bewerk"));
check("ontbrekend veld toont 'Invullen'-knop", !!byText(".field-row.missing .fedit", "Invullen"));

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
check("bericht bevat kernzin belastbaarheid", !!byText(".doc-sheet", "belastbaarheid"));
check("geen einddatum-ontbreekt-advies (vast contract aangenomen)", !byText(".doc-sheet", "Einddatum dienstverband ontbreekt"));
check("geen letterlijke [INVULLEN] in bericht", !byText(".doc-sheet", "[INVULLEN]"));
check("bericht bevat taaksuggestie (aangepaste taken)", !!byText(".doc-sheet", "aangepaste taken"));
check("bericht bevat disclaimer (niet eenzijdig in dossier)", !!byText(".doc-sheet", "niet eenzijdig in het dossier"));
// Eén gecombineerde downloadknop, actief na controle (download zelf: zie merge.mjs)
const dlPva = byText(".dl-buttons button", "Plan van aanpak");
const dlBericht = byText(".dl-buttons button", "Begeleidend bericht");
check("twee download-knoppen (PvA + bericht), actief na controle", !!dlPva && !dlPva.disabled && !!dlBericht && !dlBericht.disabled);
check("download-bar legt scheiding uit (twee aparte documenten)", !!byText(".dl-info h4", "Twee aparte documenten"));

console.log(failures === 0 ? "\nAlle checks geslaagd." : `\n${failures} check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

/* Smoke-test: rendert de site in jsdom en controleert de landing, het statische
   voorbeeldresultaat (geen backend/credits) en dat de tool opent op de upload-stap.
   De interactieve demo-flow is verwijderd; verify/preview/download worden direct
   getest in docx.mjs / merge.mjs / template.mjs. */

import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { setTimeout as wait } from "timers/promises";

// Laadt de site in een verse jsdom; pagina = "" (startpagina) of "invuller".
function laad(pagina) {
  const dom = new JSDOM(`<!DOCTYPE html><html lang="nl"><body><div id="root"></div></body></html>`, {
    url: "https://poortwachtercheck.nl/" + (pagina ? "plan-van-aanpak-invullen/" : ""),
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  const { window } = dom;
  window.scrollTo = () => {};
  window.Element.prototype.scrollTo = () => {};
  window.URL.createObjectURL = () => "blob:test";
  window.URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = () => {};
  window.TextEncoder = TextEncoder;
  window.TextDecoder = TextDecoder;
  window.Blob = window.Blob || Blob;
  if (pagina) window.__PVA_PAGINA__ = pagina;
  const run = (file) => window.eval(readFileSync(file, "utf8"));
  run("node_modules/react/umd/react.development.js");
  run("node_modules/react-dom/umd/react-dom.development.js");
  run("app.js");
  return window;
}

let window = laad("");
const $$ = (sel) => [...window.document.querySelectorAll(sel)];
const byText = (sel, txt) => $$(sel).find((el) => el.textContent.includes(txt));
const click = (el) => el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));

let failures = 0;
function check(name, cond) { console.log(`${cond ? "✓" : "✗"} ${name}`); if (!cond) failures++; }

await wait(100);

// Startpagina (dossiercheck)
check("startpagina rendert hero", !!byText("h1", "compleet naar UWV"));
check("startpagina heeft FAQ", !!byText("h2", "Goed om te weten"));
check("startpagina heeft 4 stappen", $$(".step").length === 4);
check("startpagina heeft 3 pakketten", $$(".pakket").length === 3);
check("checklist begint leeg", !!byText(".check-uitkomst h3", "Nog niets aangevinkt"));
click($$(".check-rij input")[0]);
await wait(40);
check("checklist telt wat ontbreekt", !!byText(".check-uitkomst h3", "Nog 8 onderdelen"));
check("aanvraag gaat per mail met de lijst", decodeURIComponent($$(".check-uitkomst a")[0].getAttribute("href")).includes("Eerstejaarsevaluatie"));
check("link naar de invuller", $$('a[href="plan-van-aanpak-invullen/"]').length >= 2);
check("startpagina toont de invuller-hero niet", !byText("h1", "automatisch ingevuld"));

// Pagina van de invuller
window = laad("invuller");
await wait(100);
check("invuller-pagina rendert hero", !!byText("h1", "automatisch ingevuld"));
check("invuller-pagina linkt terug naar de startpagina", $$('a.brand[href="../"]').length >= 1);
check("hero-teaser toont opbouwadvies", !!byText(".hero-teaser", "Opbouwadvies"));

// Voorbeeldresultaat (statisch — geen backend, geen credits)
check("voorbeeldsectie aanwezig", !!byText(".showcase h2", "ingevulde concept"));
check("3 voorbeeld-tabs", $$(".showcase .preview-tabs button").length === 3);
check("opbouwadvies (tab 1) toont schema-einddatum 21-04-2025", !!byText(".showcase", "21-04-2025"));
click($$(".showcase .preview-tabs button")[1]);
await wait(40);
check("PvA-tab toont AG140-formulier", !!byText(".showcase", "AG140"));
click($$(".showcase .preview-tabs button")[2]);
await wait(40);
check("bericht-tab toont disclaimer-slotzin", !!byText(".showcase", "document van jullie beiden"));

// Tool opent op de upload-stap; geen demo meer
click(byText("button", "Probeer de PvA-invuller"));
await wait(50);
check("tool opent op stap 1 (upload)", !!byText("h1", "Upload de terugkoppeling"));
check("geen voorbeeldcasus-knop meer", !byText(".example-link", "voorbeeldcasus"));

console.log(failures === 0 ? "\nAlle checks geslaagd." : `\n${failures} check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

/* Smoke-test: rendert de startpagina in jsdom en controleert de belangrijkste
   onderdelen. De PvA-invuller staat niet meer op de site. */

import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { setTimeout as wait } from "timers/promises";

// Laadt de site in een verse jsdom.
function laad() {
  const dom = new JSDOM(`<!DOCTYPE html><html lang="nl"><body><div id="root"></div></body></html>`, {
    url: "https://poortwachtercheck.nl/",
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
  const run = (file) => window.eval(readFileSync(file, "utf8"));
  run("node_modules/react/umd/react.development.js");
  run("node_modules/react-dom/umd/react-dom.development.js");
  run("app.js");
  return window;
}

const window = laad();
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
check("geen link meer naar de invuller", $$('a[href*="plan-van-aanpak-invullen"]').length === 0 && !byText("a", "Plan van aanpak invullen"));
check("WIA-brief op week 88, niet 87", window.document.body.textContent.includes("week 88") && !window.document.body.textContent.includes("week 87"));
check("voet noemt 'geen onderdeel van UWV'", !!byText(".footer", "geen onderdeel van UWV"));
check("geen UWV-balk en geen 'Direct naar' meer", !$$(".melding").length && !byText("h2", "Direct naar"));

// Privacyverklaring opent als overlay
click(byText("a", "Privacyverklaring"));
await wait(40);
check("privacyverklaring opent", !!byText("h1", "Privacyverklaring"));

console.log(failures === 0 ? "\nAlle checks geslaagd." : `\n${failures} check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

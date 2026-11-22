/* Smoke-test: rendert de startpagina in jsdom en controleert de belangrijkste
   onderdelen. */

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
check("startpagina heeft 3 pakketten", $$("#tarieven .pakket").length === 3);
check("geen snelle check meer, en geen links ernaartoe", !window.document.getElementById("checklist") && !$$('a[href="#checklist"]').length && !$$(".check-rij").length);
check("inhoudelijke controle staat in de hero en bij de dossiercheck", !!byText(".hero .lead", "inhoudelijk kloppen") && !!byText("#tarieven .pakket li", "Inhoudelijke controle van alle niet-medische stukken"));
check("aanvraag gaat per mail", decodeURIComponent($$("#contact a")[0].getAttribute("href")).includes("Kennismaking dossiercheck"));
check("geen link meer naar de invuller", $$('a[href*="plan-van-aanpak-invullen"]').length === 0 && !byText("a", "Plan van aanpak invullen"));
check("WIA-brief op week 88, niet 87", window.document.body.textContent.includes("week 88") && !window.document.body.textContent.includes("week 87"));
check("geen UWV-balk en geen 'Direct naar' meer", !$$(".melding").length && !byText("h2", "Direct naar"));
check("foto van Chris bij 'over mij'", $$('.over-mij img[src="img/chris-schepers.jpg"]').length === 1);
check("blok voor werknemers met prijs incl. btw", !!byText("#werknemers h2", "WIA-aanvraag eraan") && !!byText("#werknemers .pakket-sub", "inclusief btw"));
check("werknemer vraagt aan per mail", decodeURIComponent(window.document.querySelector("#werknemers .pakket a").getAttribute("href")).includes("Meekijken als werknemer"));

// Privacyverklaring opent als overlay
click(byText("a", "Privacyverklaring"));
await wait(40);
check("privacyverklaring opent", !!byText("h1", "Privacyverklaring"));
check("privacybalk toont het woordmerk, geen schild-icoon", !!byText(".tool-bar .brand", "Poortwachtercheck") && !$$(".tool-bar .mark").length);

console.log(failures === 0 ? "\nAlle checks geslaagd." : `\n${failures} check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

/* Smoke-test: rendert de startpagina in jsdom en controleert de belangrijkste
   onderdelen, en daarna de vooraf gerenderde HTML-pagina's en de sitemap. */

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

// Vooraf gerenderde pagina's (build.mjs): de tekst staat in de HTML zelf.
const html = (f) => readFileSync(f, "utf8");
const ldVan = (h) => JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(h)[1]);
const index = html("index.html");
check("startpagina staat vooraf in de HTML", index.includes("compleet naar UWV") && index.includes("Inhoudelijke controle van alle niet-medische stukken") && index.includes('<div id="root"><div class="site">'));
const ldHome = ldVan(index)["@graph"];
check("JSON-LD op de startpagina: dienst, persoon met LinkedIn, FAQ", ldHome.some((x) => x["@type"] === "ProfessionalService" && x.areaServed) && ldHome.some((x) => x["@type"] === "Person" && x.sameAs?.length) && ldHome.some((x) => x["@type"] === "FAQPage" && x.mainEntity.length >= 8));
check("werkgebied heel Nederland staat op de pagina", index.includes("In heel Nederland."));
const ARTIKEL_SLUGS = ["eerstejaarsevaluatie", "eindevaluatie", "administratieve-loonsanctie", "wia-aanvraag-werknemer"];
for (const slug of ARTIKEL_SLUGS) {
  const h = html(`${slug}/index.html`);
  const desc = /<meta name="description" content="([^"]*)"/.exec(h)?.[1] || "";
  check(`pagina /${slug}/: h1, canonical, artikel-schema, beschrijving <= 160`,
    /<h1>[^<]+<\/h1>/.test(h) && h.includes(`<link rel="canonical" href="https://poortwachtercheck.nl/${slug}/"`) &&
    ldVan(h)["@graph"].some((x) => x["@type"] === "Article") && desc.length > 50 && desc.length <= 160 && !h.includes("app.js"));
}
const sitemap = html("sitemap.xml");
check("sitemap noemt de startpagina en alle uitlegpagina's", sitemap.includes("<loc>https://poortwachtercheck.nl/</loc>") && ARTIKEL_SLUGS.every((s) => sitemap.includes(`/${s}/</loc>`)));
check("startpagina linkt naar de uitlegpagina's", ARTIKEL_SLUGS.every((s) => index.includes(`href="/${s}/"`)));

console.log(failures === 0 ? "\nAlle checks geslaagd." : `\n${failures} check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

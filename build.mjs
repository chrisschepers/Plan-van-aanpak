import * as esbuild from "esbuild";
import { mkdirSync, writeFileSync } from "fs";
import { pathToFileURL } from "url";

/* Build in twee stappen:
   1. src/client.jsx → app.js: de startpagina in de browser (React en ReactDOM
      komen als UMD-globals van unpkg).
   2. src/server.jsx → .build/server.mjs, en daarmee alle pagina's vooraf naar
      HTML: index.html (die app.js daarna overneemt) en <slug>/index.html per
      uitlegpagina (zonder JavaScript). Plus sitemap.xml.
   Alles wat hier wordt geschreven, wordt meegecommit; CI controleert dat een
   verse build niets verandert. */

const SITE = "https://poortwachtercheck.nl";
const jsx = { jsx: "transform", jsxFactory: "React.createElement", jsxFragment: "React.Fragment", bundle: true };

await esbuild.build({ ...jsx, entryPoints: ["src/client.jsx"], outfile: "app.js", format: "iife", target: ["es2019"], logLevel: "info" });
await esbuild.build({ ...jsx, entryPoints: ["src/termijnen-client.jsx"], outfile: "termijnen.js", format: "iife", target: ["es2019"], logLevel: "info" });
await esbuild.build({ ...jsx, entryPoints: ["src/server.jsx"], outfile: ".build/server.mjs", format: "esm", platform: "node", logLevel: "warning" });

const React = (await import("react")).default;
globalThis.React = React;
const { renderToString, renderToStaticMarkup } = await import("react-dom/server");
const s = await import(pathToFileURL(".build/server.mjs").href + "?t=" + Date.now());

const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ld = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

// React en ReactDOM vast op versie, met SRI-hash. Bij een upgrade: nieuwe
// sha384 berekenen (openssl dgst -sha384 -binary bestand | openssl base64 -A).
const REACT_SCRIPTS = `<script defer crossorigin="anonymous" src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"
  integrity="sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z"></script>
<script defer crossorigin="anonymous" src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"
  integrity="sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1"></script>`;

function pagina({ pad, titel, ogTitel, beschrijving, type, jsonld, body, app, eiland }) {
  if (beschrijving.length > 160) throw new Error(`Beschrijving van ${pad} is ${beschrijving.length} tekens (max 160)`);
  const url = SITE + pad;
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(titel)}</title>
<meta name="description" content="${esc(beschrijving)}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="Poortwachtercheck" />
<meta property="og:title" content="${esc(ogTitel)}" />
<meta property="og:description" content="${esc(beschrijving)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="nl_NL" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(ogTitel)}" />
<meta name="twitter:description" content="${esc(beschrijving)}" />
<meta name="twitter:image" content="${SITE}/og.png" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/styles.css" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<script type="application/ld+json">${ld(jsonld)}</script>
${app || eiland ? REACT_SCRIPTS + "\n" : ""}${eiland ? `<script defer src="${eiland}"></script>\n` : ""}</head>
<body>
${app ? `<div id="root">${body}</div>\n<script defer src="/app.js"></script>` : body}
</body>
</html>
`;
}

const paginas = [];

// Startpagina: vooraf gerenderd, daarna overgenomen door app.js.
writeFileSync("index.html", pagina({
  pad: "/",
  titel: "Casemanager verzuim: je re-integratieverslag compleet naar UWV",
  ogTitel: "Je re-integratieverslag compleet naar UWV",
  beschrijving: "Is je werknemer bijna twee jaar ziek? Ik loop het verzuimdossier na, ook inhoudelijk, zodat het re-integratieverslag klopt. Vaste prijs, heel Nederland.",
  type: "website",
  jsonld: s.homeJsonLd(),
  body: renderToString(React.createElement(s.App)),
  app: true,
}));
paginas.push("/");

// Uitlegpagina's: statische HTML.
for (const a of s.ARTIKELEN) {
  mkdirSync(a.slug, { recursive: true });
  writeFileSync(`${a.slug}/index.html`, pagina({
    pad: `/${a.slug}/`,
    titel: `${a.seoTitel} | Poortwachtercheck`,
    ogTitel: a.seoTitel,
    beschrijving: a.beschrijving,
    type: "article",
    jsonld: s.artikelJsonLd(a),
    body: renderToStaticMarkup(React.createElement(s.Artikel, { artikel: a })),
    app: false,
  }));
  paginas.push(`/${a.slug}/`);
}

// Termijnen berekenen: vooraf gerenderd, het rekenblok wordt overgenomen door termijnen.js.
{
  const t = s.TERMIJNEN_PAGINA;
  mkdirSync(t.slug, { recursive: true });
  writeFileSync(`${t.slug}/index.html`, pagina({
    pad: `/${t.slug}/`,
    titel: `${t.seoTitel} | Poortwachtercheck`,
    ogTitel: t.seoTitel,
    beschrijving: t.beschrijving,
    type: "article",
    jsonld: s.artikelJsonLd(t),
    body: renderToString(React.createElement(s.TermijnenPagina, { bijgewerkt: s.BIJGEWERKT })),
    eiland: "/termijnen.js",
  }));
  paginas.push(`/${t.slug}/`);
}

writeFileSync("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paginas.map((p) => `  <url>\n    <loc>${SITE}${p}</loc>\n    <lastmod>${s.DATUM}</lastmod>\n  </url>`).join("\n")}
</urlset>
`);

console.log(`  ${paginas.length} pagina's vooraf gerenderd: ${paginas.join(", ")}`);

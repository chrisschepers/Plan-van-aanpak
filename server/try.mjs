/* Lokaal uitproberen hoe de bot een terugkoppeling interpreteert — zonder de
   site/Railway. Print de gestructureerde extractie (functioneel, gefilterd).

   Gebruik:
     export ANTHROPIC_API_KEY=sk-ant-...
     node try.mjs samples/terugkoppeling-01.txt
     node try.mjs samples/terugkoppeling-03.txt  functieomschrijving.txt
*/

import { readFileSync } from "fs";
import { extractFields } from "./extract.js";

const [, , file, foFile] = process.argv;

if (!file) {
  console.error("Gebruik: node try.mjs <terugkoppeling.txt> [functieomschrijving.txt]");
  console.error("Voorbeelden staan in de map samples/.");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Zet eerst je sleutel: export ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

const text = readFileSync(file, "utf8");
const fo = foFile ? readFileSync(foFile, "utf8") : "";

console.error(`\nVerwerken: ${file}${fo ? "  (+ functieomschrijving)" : ""}\nModel: ${process.env.PVA_MODEL || "claude-opus-4-8"}\n`);

const data = await extractFields([{ type: "text", text }], fo);
console.log(JSON.stringify(data, null, 2));

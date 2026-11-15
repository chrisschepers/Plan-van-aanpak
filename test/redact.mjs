/* Test: deterministische BSN-redactie (elfproef) vóór de AI-call. */
import { redactBSN, isBSN } from "../server/redact.js";

let failures = 0;
const check = (n, c) => { console.log(`${c ? "✓" : "✗"} ${n}`); if (!c) failures++; };

// 111222333 is een geldige test-BSN (doorstaat de elfproef).
check("geldige BSN herkend", isBSN("111222333") === true);
check("ongeldig 9-cijferig getal niet als BSN", isBSN("123456789") === false);
check("enkel nullen geen BSN", isBSN("000000000") === false);
check("te kort geen BSN", isBSN("11122233") === false);

check("geldige BSN wordt geredigeerd", redactBSN("BSN: 111222333 in de tekst") === "BSN: [BSN GEFILTERD] in de tekst");
check("ongeldig getal blijft staan", redactBSN("factuur 123456789 euro") === "factuur 123456789 euro");
check("bedrag/telefoon ongemoeid", redactBSN("bel 0612345678 of betaal 1500") === "bel 0612345678 of betaal 1500");
check("meerdere BSN's geredigeerd", redactBSN("111222333 en 111222333") === "[BSN GEFILTERD] en [BSN GEFILTERD]");
check("BSN met punten (3-3-3)", redactBSN("BSN 111.222.333 hier") === "BSN [BSN GEFILTERD] hier");
check("BSN met punten (4-2-3)", redactBSN("nr 1112.22.333 ok") === "nr [BSN GEFILTERD] ok");
check("BSN met spaties (3-3-3)", redactBSN("zie 111 222 333 end") === "zie [BSN GEFILTERD] end");
check("gegroepeerd maar geen geldige BSN blijft staan", redactBSN("123 456 789 hier") === "123 456 789 hier");
check("gewone tekst ongemoeid", redactBSN("geen nummers hier") === "geen nummers hier");
check("leeg/null veilig", redactBSN("") === "" && redactBSN(null) === null);

console.log(failures === 0 ? "\nAlle redact-checks geslaagd." : `\n${failures} redact-check(s) gefaald.`);
process.exit(failures === 0 ? 0 : 1);

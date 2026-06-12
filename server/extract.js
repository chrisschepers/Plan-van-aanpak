/* AI-extractie met Claude. Leest de terugkoppeling van de bedrijfsarts en geeft
   gestructureerde, functionele gegevens terug — medische informatie en BSN worden
   nooit overgenomen (kernregels uit het kennisdocument Agentprompt PvA v2).
   Het opbouwschema wordt NIET hier berekend; de rekenmotor in de frontend doet dat
   deterministisch uit de teruggegeven uitgangspunten (hybride aanpak). */

import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.PVA_MODEL || "claude-opus-4-8";

const SYSTEM = `Je bent een assistent die uit de terugkoppeling van een bedrijfsarts uitsluitend de FUNCTIONELE gegevens haalt voor een Plan van Aanpak (Wet verbetering poortwachter). Je werkt zorgvuldig en neemt feiten letterlijk over.

HARDE REGELS (nooit overtreden):
- MEDISCH FILTER: neem nooit medische informatie over — geen diagnoses, ziektebeelden, klachten, symptomen, behandelingen, medicatie, of de (medische/privé) oorzaak van het verzuim. Niet overnemen, niet parafraseren, niet samenvatten. Bij twijfel: niet overnemen.
- BSN: verwerk nooit een burgerservicenummer. Staat er een BSN in de input, negeer het.
- Wél overnemen (functioneel): belastbaarheid en functionele mogelijkheden in werktermen, inzetbare uren, opbouwritme, prognose uitsluitend in werkhervattingstermen, en het advies van de bedrijfsarts over werk(aanpassingen).

VELDREGELS:
- Datumnotatie voor tekstvelden: DD-MM-JJJJ. Voor 'reken.startDateISO': JJJJ-MM-DD.
- Ontbreekt een gegeven of twijfel je, gebruik een lege string "" (voor 'reken'-getallen: gebruik 0).
- Neem namen, datums en uren letterlijk over zoals ze in de input staan.

OPBOUW (reken): leid de uitgangspunten voor het opbouwschema af:
- contractHours: contracturen per week (geheel getal).
- startHours: start-uren per week volgens de bedrijfsarts (bv. 2 dagdelen × 4 uur = 8).
- weeklyIncrease: wekelijkse uitbreiding in uren (alleen als de arts een wekelijks ritme noemt; anders 0).
- startDateISO: startdatum opbouw (JJJJ-MM-DD), anders "".
Verzin geen ritme dat de arts niet noemt.

BRONNEN: geef per functioneel veld een kort, letterlijk citaat uit de input waarop je het baseert (voor menselijke controle). Leeg laten ("") als het veld ontbreekt.

Geef uitsluitend het gevraagde JSON-object terug.`;

const str = { type: "string" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    functie: str,
    contracturen: str,
    eersteZiektedag: str,
    geboortedatum: str,
    einddatumDienstverband: str,
    belastbaarheid: str,
    opbouwtempo: str,
    startdatumOpbouw: str,
    werkaanpassing: str,
    prognose: str,
    spreekuurdatum: str,
    reken: {
      type: "object",
      additionalProperties: false,
      properties: {
        contractHours: { type: "integer" },
        startHours: { type: "integer" },
        weeklyIncrease: { type: "integer" },
        startDateISO: str,
      },
      required: ["contractHours", "startHours", "weeklyIncrease", "startDateISO"],
    },
    bronnen: {
      type: "object",
      additionalProperties: false,
      properties: {
        functie: str, contracturen: str, eersteZiektedag: str,
        belastbaarheid: str, opbouwtempo: str, startdatumOpbouw: str,
        werkaanpassing: str, prognose: str,
      },
      required: ["functie", "contracturen", "eersteZiektedag", "belastbaarheid", "opbouwtempo", "startdatumOpbouw", "werkaanpassing", "prognose"],
    },
  },
  required: [
    "functie", "contracturen", "eersteZiektedag", "geboortedatum",
    "einddatumDienstverband", "belastbaarheid", "opbouwtempo",
    "startdatumOpbouw", "werkaanpassing", "prognose",
    "spreekuurdatum", "reken", "bronnen",
  ],
};

const INSTRUCTION =
  "Haal uit de bovenstaande terugkoppeling van de bedrijfsarts de functionele gegevens voor het Plan van Aanpak. Houd je strikt aan het medisch filter en de BSN-regel.";

const client = new Anthropic(); // leest ANTHROPIC_API_KEY uit de omgeving

/**
 * @param {Array} sourceBlocks  content-blocks: een PDF-document of een tekstblok
 * @returns {Promise<object>} gevalideerde extractie
 */
export async function extractFields(sourceBlocks) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    messages: [
      { role: "user", content: [...sourceBlocks, { type: "text", text: INSTRUCTION }] },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("Geen tekstantwoord van het model");
  return JSON.parse(textBlock.text);
}

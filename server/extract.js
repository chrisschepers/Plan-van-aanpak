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

TAAKSUGGESTIE: is er een functieomschrijving meegegeven, stel dan in 'taaksuggestie' in lopende tekst 1–3 concrete aangepaste taken voor die binnen de afgegeven belastbaarheid en werkaanpassing passen (bv. lichtere of afgebakende taken). Schrijf alleen de taken zelf, zonder disclaimer (die voegt de applicatie toe). Geen functieomschrijving meegegeven → laat 'taaksuggestie' leeg ("").

SIGNALEN: zet elk signaal op true ALLEEN als de terugkoppeling dit duidelijk aangeeft, anders false (de applicatie koppelt hieraan de juiste Werkwijzer-adviezen):
- geenBenutbareMogelijkheden: de bedrijfsarts geeft aan dat er op dit moment geen benutbare arbeidsmogelijkheden zijn.
- duurzaamGeenMogelijkheden: duurzaam geen mogelijkheden én geen herstelverwachting.
- marginaleMogelijkheden: zeer beperkte/marginale belastbaarheid (slechts enkele uren of taken).
- arbeidstherapeutisch: werken op arbeidstherapeutische basis (zonder loonwaarde) wordt genoemd.
- stagnatie: de opbouw loopt achter op schema, de hervatting is instabiel, of er is uitval/terugval.
- arbeidsconflict: er is sprake van een arbeidsconflict of verstoorde arbeidsverhouding.
- belastbaarheidNaEerstejaars: de belastbaarheid ontstaat pas (ruim) na ongeveer een jaar verzuim.
- gewijzigdeBelastbaarheidSpoor2: de belastbaarheid is gewijzigd terwijl een tweede-spoortraject loopt.

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
    taaksuggestie: str,
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
    signalen: {
      type: "object",
      additionalProperties: false,
      properties: {
        geenBenutbareMogelijkheden: { type: "boolean" },
        duurzaamGeenMogelijkheden: { type: "boolean" },
        marginaleMogelijkheden: { type: "boolean" },
        arbeidstherapeutisch: { type: "boolean" },
        stagnatie: { type: "boolean" },
        arbeidsconflict: { type: "boolean" },
        belastbaarheidNaEerstejaars: { type: "boolean" },
        gewijzigdeBelastbaarheidSpoor2: { type: "boolean" },
      },
      required: ["geenBenutbareMogelijkheden", "duurzaamGeenMogelijkheden", "marginaleMogelijkheden", "arbeidstherapeutisch", "stagnatie", "arbeidsconflict", "belastbaarheidNaEerstejaars", "gewijzigdeBelastbaarheidSpoor2"],
    },
  },
  required: [
    "functie", "contracturen", "eersteZiektedag", "geboortedatum",
    "einddatumDienstverband", "belastbaarheid", "opbouwtempo",
    "startdatumOpbouw", "werkaanpassing", "prognose",
    "spreekuurdatum", "taaksuggestie", "reken", "bronnen", "signalen",
  ],
};

const INSTRUCTION =
  "Haal uit de bovenstaande terugkoppeling van de bedrijfsarts de functionele gegevens voor het Plan van Aanpak. Houd je strikt aan het medisch filter en de BSN-regel.";

const client = new Anthropic(); // leest ANTHROPIC_API_KEY uit de omgeving

/**
 * @param {Array} sourceBlocks  content-blocks: een PDF-document of een tekstblok
 * @param {string} [functieomschrijving]  optionele functieomschrijving (werkgever)
 * @returns {Promise<object>} gevalideerde extractie
 */
export async function extractFields(sourceBlocks, functieomschrijving = "") {
  const content = [...sourceBlocks];
  if (functieomschrijving && functieomschrijving.trim()) {
    content.push({ type: "text", text: `Functieomschrijving van de werknemer (aangeleverd door de werkgever):\n${functieomschrijving.trim()}` });
  }
  content.push({ type: "text", text: INSTRUCTION });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: SYSTEM,
    output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) throw new Error("Geen tekstantwoord van het model");
  return JSON.parse(textBlock.text);
}

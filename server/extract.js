/* AI-extractie met Claude. Leest de terugkoppeling van de bedrijfsarts en geeft
   gestructureerde, functionele gegevens terug — medische informatie en BSN worden
   nooit overgenomen (kernregels uit het kennisdocument Agentprompt PvA v2).
   Het opbouwschema wordt NIET hier berekend; de rekenmotor in de frontend doet dat
   deterministisch uit de teruggegeven uitgangspunten (hybride aanpak). */

import Anthropic from "@anthropic-ai/sdk";
import { reconcile } from "./reconcile.js";

const MODEL = process.env.PVA_MODEL || "claude-opus-4-8";
// Self-consistency: aantal onafhankelijke extracties dat parallel draait en via
// meerderheidsstem wordt gecombineerd. 1 = uit. Hoger = stabieler, maar duurder.
const SAMPLES = Math.max(1, parseInt(process.env.PVA_SAMPLES || "3", 10));

const SYSTEM = `Je bent een assistent die uit de terugkoppeling van een bedrijfsarts uitsluitend de FUNCTIONELE gegevens haalt voor een Plan van Aanpak (Wet verbetering poortwachter). Je werkt zorgvuldig en neemt feiten letterlijk over.

STAP 0 — INPUTVALIDATIE (doe dit vóór de extractie en leg het vast in 'inputvalidatie'):
- Documenttype herkennen: bepaal of het hoofddocument een terugkoppeling/spreekuurverslag van de bedrijfsarts of een probleemanalyse is. Is het iets anders (bijv. een FML/functionele-mogelijkhedenlijst, verzuimprotocol, arbeidsovereenkomst, loonstrook of willekeurige brief), zet dan 'inputvalidatie.geschikt' op false, vul 'inputvalidatie.documenttype' met wat je herkent en 'inputvalidatie.toelichting' met kort wat er nodig is (een terugkoppeling of advies van de bedrijfsarts). Laat in dat geval álle overige velden leeg ("") en de 'reken'-getallen 0; verzin geen gegevens.
- Is het wél een terugkoppeling/probleemanalyse: zet 'inputvalidatie.geschikt' op true, 'inputvalidatie.documenttype' op wat je herkent, en 'inputvalidatie.toelichting' op "".
- Meerdere terugkoppelingen of spreekuurdata: gebruik de meest recente en zet die datum (DD-MM-JJJJ) in 'inputvalidatie.meestRecenteSpreekuur' (anders "").
- Tegenstrijdige gegevens (bijv. twee verschillende contracturen): gebruik die gegevens niet (laat het betreffende veld leeg) en zet een korte omschrijving per tegenstrijdigheid in 'inputvalidatie.tegenstrijdigheden' (anders een lege lijst).

HARDE REGELS (nooit overtreden):
- MEDISCH FILTER: neem nooit medische informatie over — geen diagnoses, ziektebeelden, klachten, symptomen, behandelingen, medicatie, of de (medische/privé) oorzaak van het verzuim. Niet overnemen, niet parafraseren, niet samenvatten. Bij twijfel: niet overnemen.
- BSN: verwerk nooit een burgerservicenummer. Staat er een BSN in de input, negeer het.
- Wél overnemen (functioneel): belastbaarheid en functionele mogelijkheden in werktermen, inzetbare uren, opbouwritme, prognose uitsluitend in werkhervattingstermen, en het advies van de bedrijfsarts over werk(aanpassingen).

VELDREGELS:
- Datumnotatie voor tekstvelden: DD-MM-JJJJ. Voor 'reken.startDateISO': JJJJ-MM-DD.
- Ontbreekt een gegeven of twijfel je, gebruik een lege string "" (voor 'reken'-getallen: gebruik 0).
- Neem namen, datums en uren letterlijk over zoals ze in de input staan.
- naam: de naam van de werknemer (voorletters en achternaam) zoals die in de terugkoppeling staat. Een naam is geen medisch gegeven en mag wél worden overgenomen. Geen BSN. Leeg laten ("") als de naam ontbreekt.
- naamBedrijfsarts: de naam van de bedrijfsarts/arbo-arts die de terugkoppeling heeft opgesteld (bv. "drs. A. Heijmans"). Leeg laten ("") als die ontbreekt.
- aanpassingWerkplek: een concreet genoemde aanpassing van de werkplek of werkomstandigheden (bv. ergonomische/aangepaste werkplek, thuiswerken, prikkelarme ruimte). Alleen overnemen als de terugkoppeling dit letterlijk noemt; anders "".
- aanpassingWerktijden: een concreet genoemde aanpassing van werktijden of rooster (bv. flexibele begintijd, geen nachtdiensten, opbouw in de ochtend). Alleen overnemen als dit letterlijk wordt genoemd; anders "".

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
- marginaleMogelijkheden: de belastbaarheid is marginaal: maximaal circa 2 uur per dag (of slechts enkele uren per week, bv. 2×2 uur) inzetbaar én zonder uitzicht op opbouw op korte termijn. Noemt de bedrijfsarts wél een opbouwperspectief (bv. een tempo, of dat het tempo op een vervolgconsult wordt bepaald), dan is dit signaal false.
- volledigInzetbaar: de werknemer is (weer) volledig inzetbaar voor het eigen werk in de eigen uren / heeft geen functionele beperkingen door ziekte. Dit speelt bv. bij een arbeidsconflict zonder ziekte. Bij een (gedeeltelijke) opbouw of resterende beperkingen is dit signaal false.
- arbeidstherapeutisch: werken op arbeidstherapeutische basis (zonder loonwaarde) wordt genoemd.
- stagnatie: de opbouw loopt achter op schema, de hervatting is instabiel, of er is uitval/terugval.
- arbeidsconflict: er is sprake van een arbeidsconflict of verstoorde arbeidsverhouding.
- belastbaarheidNaEerstejaars: de belastbaarheid ontstaat pas (ruim) na ongeveer een jaar verzuim.
- gewijzigdeBelastbaarheidSpoor2: de belastbaarheid is gewijzigd terwijl een tweede-spoortraject loopt.
- herstelVerwachtBinnen3Maanden: de bedrijfsarts verwacht volledig herstel/volledige werkhervatting binnen circa 3 maanden.
- noRiskMogelijk: de bedrijfsarts geeft aan dat mogelijk een no-riskpolis of vangnetregeling (Ziektewet) van toepassing is, of noemt de no-riskstatus van de werknemer expliciet. Zet dit alleen op true bij een duidelijke aanwijzing in de terugkoppeling; neem nooit de medische reden over.

De belastbaarheidstoestanden sluiten elkaar uit: kies er hooguit één van
geenBenutbareMogelijkheden/duurzaamGeenMogelijkheden, marginaleMogelijkheden of
volledigInzetbaar. Is er een gewone (gedeeltelijke) opbouw, dan staan die drie
alle op false.

Geef uitsluitend het gevraagde JSON-object terug.`;

const str = { type: "string" };
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    inputvalidatie: {
      type: "object",
      additionalProperties: false,
      properties: {
        documenttype: str,
        geschikt: { type: "boolean" },
        toelichting: str,
        meestRecenteSpreekuur: str,
        tegenstrijdigheden: { type: "array", items: str },
      },
      required: ["documenttype", "geschikt", "toelichting", "meestRecenteSpreekuur", "tegenstrijdigheden"],
    },
    naam: str,
    naamBedrijfsarts: str,
    functie: str,
    contracturen: str,
    eersteZiektedag: str,
    geboortedatum: str,
    einddatumDienstverband: str,
    belastbaarheid: str,
    opbouwtempo: str,
    startdatumOpbouw: str,
    werkaanpassing: str,
    aanpassingWerkplek: str,
    aanpassingWerktijden: str,
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
        herstelVerwachtBinnen3Maanden: { type: "boolean" },
        volledigInzetbaar: { type: "boolean" },
        noRiskMogelijk: { type: "boolean" },
      },
      required: ["geenBenutbareMogelijkheden", "duurzaamGeenMogelijkheden", "marginaleMogelijkheden", "arbeidstherapeutisch", "stagnatie", "arbeidsconflict", "belastbaarheidNaEerstejaars", "gewijzigdeBelastbaarheidSpoor2", "herstelVerwachtBinnen3Maanden", "volledigInzetbaar", "noRiskMogelijk"],
    },
  },
  required: [
    "inputvalidatie",
    "naam", "naamBedrijfsarts",
    "functie", "contracturen", "eersteZiektedag", "geboortedatum",
    "einddatumDienstverband", "belastbaarheid", "opbouwtempo",
    "startdatumOpbouw", "werkaanpassing", "aanpassingWerkplek", "aanpassingWerktijden", "prognose",
    "spreekuurdatum", "taaksuggestie", "reken", "bronnen", "signalen",
  ],
};

const INSTRUCTION =
  "Voer eerst Stap 0 (inputvalidatie) uit en leg het resultaat vast in 'inputvalidatie'. Haal daarna uit de bovenstaande terugkoppeling van de bedrijfsarts de functionele gegevens voor het Plan van Aanpak. Houd je strikt aan het medisch filter en de BSN-regel.";

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

  // Eén onafhankelijke extractie (parsed JSON of een fout).
  const oneSample = async () => {
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
  };

  // Self-consistency: draai SAMPLES extracties parallel en combineer ze via
  // meerderheidsstem (server/reconcile.js). Mislukte runs worden genegeerd zolang
  // er minstens één slaagt.
  const settled = await Promise.allSettled(Array.from({ length: SAMPLES }, oneSample));
  const oks = settled.filter((s) => s.status === "fulfilled").map((s) => s.value);
  if (!oks.length) {
    const reason = settled.find((s) => s.status === "rejected");
    throw (reason && reason.reason) || new Error("Extractie mislukt");
  }
  const data = reconcile(oks);

  // Harde regel, niet afhankelijk van prompt-gehoorzaamheid: zonder meegegeven
  // functieomschrijving komt er nooit een taaksuggestie in de output.
  if (!functieomschrijving || !functieomschrijving.trim()) data.taaksuggestie = "";
  return data;
}

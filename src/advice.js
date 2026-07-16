/* Adviesmotor — volgt de Agentprompt PvA v2 (kennisdocument).
   Adviezen op basis van: verzuimweek (eerste ziektedag), leeftijd (geboortedatum)
   en ziek-uit-dienst (einddatum dienstverband). Paragraafverwijzingen = Werkwijzer
   Poortwachter. Datums in de cards: DD-MM-JJJJ (jaar erbij omdat 104 weken twee
   kalenderjaren beslaat); het opbouwschema/PvA volgt de DD-MM-notatie. */

import { getVal, isMissing } from "./casedata.js";
import { fullRecoveryDate } from "./engine.js";

function parseNL(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}
function fmtNL(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`;
}
function addWeeks(d, w) { const x = new Date(d); x.setDate(x.getDate() + w * 7); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function addYears(d, y) { const x = new Date(d); x.setFullYear(x.getFullYear() + y); return x; }
function weeksBetween(a, b) { return Math.floor((b - a) / (7 * 864e5)); }
function yearsBetween(from, to) {
  let y = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) y--;
  return y;
}

const AOW_JAREN = 67;
const AOW_MAANDEN = 3; // indicatief (67 jaar + 3 maanden); exacte AOW-leeftijd opvragen bij SVB
function aowDatum(gebd) { const d = addYears(gebd, AOW_JAREN); d.setMonth(d.getMonth() + AOW_MAANDEN); return d; }

/** Automatisch berekende waarden uit de gegevens (alleen-lezen weergave). */
export function computeDerived(fields) {
  const eersteZ = parseNL(getVal(fields, "eersteZ"));
  const gebd = parseNL(getVal(fields, "geboortedatum"));
  return {
    aow: gebd ? fmtNL(aowDatum(gebd)) : "",
    eindeWacht: eersteZ ? fmtNL(addWeeks(eersteZ, 104)) : "",
  };
}

// Adviestijdlijn (Agentprompt v2). weekTo: 999 = open einde.
export const TIMELINE = [
  { from: 0,  to: 8,   title: "Plan van Aanpak op tijd",            body: "Stel het Plan van Aanpak uiterlijk in week 8 op (2 weken na de probleemanalyse)." },
  { from: 40, to: 42,  title: "42e-weeksmelding bij UWV",           body: "Doe de 42e-weeksmelding bij UWV; te laat melden riskeert een boete tot € 515." },
  { from: 45, to: 999, title: "Inzetbaarheidsprofiel (IZP/LAB)",    body: "Laat de bedrijfsarts een Inzetbaarheidsprofiel (IZP/LAB) opstellen t.b.v. een arbeidsdeskundig onderzoek." },
  { from: 46, to: 52,  title: "Arbeidsdeskundig onderzoek & eerstejaarsevaluatie", body: "Plan het arbeidsdeskundig onderzoek en de eerstejaarsevaluatie (opschudmoment); beoordeel of spoor 2 tijdig moet starten." },
  { from: 52, to: 58,  title: "Spoor 2 tijdig starten",             body: "Spoor 2 moet uiterlijk 6 weken na de eerstejaarsevaluatie zijn gestart, tenzij er binnen 3 maanden concreet perspectief is op structurele werkhervatting binnen de eigen organisatie (Werkwijzer 4.3.1)." },
  { from: 52, to: 999, title: "Bewaak spoor 2",                     body: "Bewaak dat spoor 2 daadwerkelijk loopt naast spoor 1, zolang volledige terugkeer niet zeker is." },
  { from: 87, to: 93,  title: "Eindevaluatie & WIA-aanvraag",       body: "Laat de bedrijfsarts een Actueel oordeel opstellen, vul samen de Eindevaluatie in en maak het re-integratieverslag compleet; werknemer vraagt uiterlijk week 93 WIA aan." },
];

// Volledige poortwachter-tijdlijn (overzicht). who = wat de werkgever moet (laten) doen.
export const POORTWACHTER = [
  { week: 1,   mijlpaal: "Ziekmelding",                       actie: "Meld de werknemer ziek bij de arbodienst/bedrijfsarts en leg de eerste ziektedag vast." },
  { week: 6,   mijlpaal: "Probleemanalyse",                   actie: "De bedrijfsarts stelt de Probleemanalyse op (uiterlijk week 6)." },
  { week: 8,   mijlpaal: "Plan van Aanpak",                   actie: "Stel samen met de werknemer het Plan van Aanpak op (binnen 2 weken na de Probleemanalyse)." },
  { week: 42,  mijlpaal: "42e-weeksmelding bij UWV",          actie: "Meld het langdurig verzuim bij UWV (verplicht in week 42)." },
  { week: 52,  mijlpaal: "Eerstejaarsevaluatie (opschudmoment)", actie: "Evalueer het eerste jaar met de werknemer; beoordeel of het tweede spoor moet starten." },
  { week: 58,  mijlpaal: "Tweede spoor uiterlijk gestart",    actie: "Start zo nodig het tweede spoor (uiterlijk 6 weken na de eerstejaarsevaluatie), tenzij er concreet perspectief is op terugkeer in de eigen organisatie." },
  { week: 87,  mijlpaal: "WIA-aanvraag mogelijk",             actie: "Laat de bedrijfsarts een Actueel oordeel opstellen en maak het re-integratieverslag (RIV) compleet." },
  { week: 93,  mijlpaal: "WIA uiterlijk aanvragen",           actie: "De werknemer vraagt uiterlijk week 93 de WIA-uitkering aan; lever het volledige RIV mee." },
  { week: 104, mijlpaal: "Einde wachttijd",                   actie: "Einde van de 2 jaar loondoorbetaling; de WIA-beoordeling bepaalt het vervolg." },
];

/** Volledige poortwachter-termijnen met berekende datums (vanaf eerste ziektedag). */
export function poortwachterTermijnen(fields) {
  const eersteZ = parseNL(getVal(fields, "eersteZ"));
  return POORTWACHTER.map((m) => ({
    ...m,
    datum: eersteZ ? fmtNL(addWeeks(eersteZ, m.week)) : "",
  }));
}

/**
 * Chronologische verzuim-tijdlijn ("x-as") voor de visuele weergave.
 * Anker = eerste ziektedag; vaste Poortwachter-mijlpalen; optioneel een
 * WAZO-verlofblok dat de wachttijd pauzeert (mijlpalen ná de verlofstart
 * schuiven mee, einde wachttijd schuift op); eindpunt-markers (einde
 * dienstverband, AOW); en een loondoorbetaling-baan (cao-afhankelijk).
 *
 * Bewust NIET opgenomen (besluiten Chris): vervroegde IVA (ethiek), loonsanctie
 * (niet voor de hand liggend), 4-wekenregel/samentelling (niet uit een
 * terugkoppeling af te leiden).
 *
 * @param {object} fields  veldenmodel (zoals in de tool)
 * @param {{wazo?: object}} [opts]  optioneel een computeWazo()-resultaat
 * @returns {null | {anker, eindeWachttijd, events: Array, banen: Array}}
 */
export function computeTijdlijn(fields, { wazo = null } = {}) {
  const eersteZ = parseNL(getVal(fields, "eersteZ"));
  if (!eersteZ) return null; // zonder eerste ziektedag geen anker
  const gebd = parseNL(getVal(fields, "geboortedatum"));
  const einddienst = parseNL(getVal(fields, "einddatum"));
  const wazoDagen = wazo ? wazo.totaalDagen : 0;
  const wazoStart = wazo ? parseNL(wazo.zwangerschapsverlof.start) : null;

  // De wachttijd pauzeert tijdens WAZO-verlof: datums vanaf de verlofstart schuiven op.
  const verschuif = (d) => (wazoStart && d >= wazoStart ? addDays(d, wazoDagen) : d);
  const wkVan = (d) => Math.round((d - eersteZ) / (7 * 864e5));

  const events = POORTWACHTER.map((m) => {
    const nominaal = addWeeks(eersteZ, m.week);
    const datum = verschuif(nominaal);
    return {
      id: `pw-${m.week}`, type: "mijlpaal", categorie: "poortwachter",
      week: wkVan(datum), datum: fmtNL(datum), titel: m.mijlpaal, sub: m.actie,
      verschoven: !!(wazoStart && nominaal >= wazoStart),
    };
  });

  if (wazo) {
    const eind = parseNL(wazo.bevallingsverlof.eind);
    const splitDatum = wazo.zwangerschapsverlof.eind; // overgang zwangerschaps- → bevallingsverlof = (vermoedelijke) bevallingsdatum
    events.push({
      id: "wazo", type: "verlof", categorie: "wazo",
      week: wkVan(wazoStart), datum: wazo.zwangerschapsverlof.start,
      totWeek: wkVan(eind), totDatum: wazo.bevallingsverlof.eind,
      titel: "WAZO-verlof (zwangerschap/bevalling)",
      sub: `${wazo.totaalWeken} wk — wachttijd pauzeert (bij dezelfde ziekteoorzaak vóór en ná het verlof)`,
      split: { week: wkVan(parseNL(splitDatum)), datum: splitDatum, label: wazo.gepland ? "uitgerekend" : "bevallen" },
    });
  }

  if (einddienst) {
    events.push({
      id: "zud", type: "eindpunt", categorie: "zud",
      week: wkVan(einddienst), datum: fmtNL(einddienst),
      titel: "Einde dienstverband",
      sub: "Bij een tijdelijk contract dat tijdens ziekte afloopt: mogelijk ziek uit dienst (Ziektewet/UWV).",
    });
  }

  const eindeWachtDatum = verschuif(addWeeks(eersteZ, 104));
  if (gebd) {
    const aow = aowDatum(gebd);
    if (aow <= addYears(eindeWachtDatum, 1)) { // alleen tonen als de AOW dicht bij de as ligt
      events.push({
        id: "aow", type: "eindpunt", categorie: "aow",
        week: wkVan(aow), datum: fmtNL(aow),
        titel: "AOW-leeftijd (indicatief)",
        sub: "Het traject vervalt rond de AOW-leeftijd; dan geldt een kortere termijn.",
      });
    }
  }

  events.sort((a, b) => a.week - b.week);

  const eindeWachtWeek = wkVan(eindeWachtDatum);
  return {
    anker: { week: 0, datum: fmtNL(eersteZ), titel: "Eerste ziektedag" },
    eindeWachttijd: { week: eindeWachtWeek, datum: fmtNL(eindeWachtDatum), verschovenDoorWazo: !!wazo },
    events,
    banen: [{
      id: "loondoorbetaling", titel: "Loondoorbetaling",
      vanWeek: 0, totWeek: eindeWachtWeek,
      vanDatum: fmtNL(eersteZ), totDatum: fmtNL(eindeWachtDatum),
      // Loondoorbetaling in twee jaren: het wettelijk minimum is 70% per jaar;
      // veel cao's vullen jaar 1 aan tot 100% en betalen jaar 2 vaak 70%.
      segmenten: [
        { vanWeek: 0, totWeek: Math.min(52, eindeWachtWeek), label: "Jaar 1 · cao-afhankelijk (vaak 100%)" },
        ...(eindeWachtWeek > 52 ? [{ vanWeek: 52, totWeek: eindeWachtWeek, label: "Jaar 2 · meestal 70%" }] : []),
      ],
      noot: "Wettelijk minimum 70% per jaar; veel cao's vullen jaar 1 aan tot 100% en betalen vanaf jaar 2 vaak 70%.",
    }],
  };
}

// Voorwaardelijke Werkwijzer-adviezen, afgevuurd op signaalwoorden die de AI detecteert.
// De teksten komen letterlijk in het begeleidend bericht; daarom geformuleerd als
// direct advies (de situatie is op dat moment al vastgesteld).
// `body` = volledige tekst (catalogus); `kort` = één-regelige variant voor de bullet-lijst
// in het begeleidend bericht.
export const SIGNAAL_ADVIES = {
  geenBenutbareMogelijkheden: { level: "risk", title: "Geen benutbare mogelijkheden (GBM)",
    body: "De bedrijfsarts geeft aan dat er op dit moment geen benutbare arbeidsmogelijkheden zijn. Forceer dan geen re-integratieactiviteiten: de bedrijfsarts houdt de vinger aan de pols — plan vervolgconsulten en leg elke terugkoppeling vast in het verzuimdossier. Duurt deze situatie de volle twee jaar, dan volstaat een beperkt re-integratieverslag (Werkwijzer 5.9, 3.1).",
    kort: "Geen benutbare mogelijkheden: forceer geen re-integratie, plan vervolgconsulten en leg elke terugkoppeling vast in het verzuimdossier (Werkwijzer 5.9)." },
  noRiskMogelijk: { level: "risk", title: "Mogelijk no-riskpolis — meld bij UWV (UWV beoordeelt)",
    body: "De bedrijfsarts geeft aan dat mogelijk een no-riskpolis van toepassing is. Meld de werknemer in dat geval ziek bij UWV met de classificatie dat hij/zij onder de no-riskpolis van de Ziektewet valt; UWV beoordeelt vervolgens of er daadwerkelijk sprake is van een no-risksituatie. Doe die ziekteaangifte uiterlijk binnen 6 weken; ontdek je pas later dat no-risk speelt, geef dat dan binnen 2 dagen door — de uitkering wordt dan met hooguit één jaar terugwerkende kracht toegekend. Bij no-risk vergoedt UWV via de Ziektewet (een deel van) je loonkosten tijdens de ziekte; in het eerste ziektejaar kun je UWV bovendien verzoeken de uitkering te verhogen van 70% tot maximaal het loon dat je moet doorbetalen. Leg in je dossier alleen vast dát no-risk van toepassing is, nooit waarom (die reden is medisch of privé).",
    kort: "Mogelijk no-risk: meld de werknemer ziek bij UWV met de classificatie 'valt onder de no-riskpolis van de Ziektewet' — UWV beoordeelt of no-risk geldt; bij no-risk vergoedt UWV een deel van je loonkosten." },
  // (Geen 'duurzaam geen mogelijkheden'-advies: een vervroegde IVA-aanvraag wordt
  //  bewust NIET geautomatiseerd geadviseerd — dat ethische oordeel hoort bij mens/
  //  bedrijfsarts. Het signaal blijft bestaan en stuurt 'geen benutbare mogelijkheden'.)
  marginaleMogelijkheden: { level: "attention", title: "Marginale mogelijkheden",
    body: "De belastbaarheid is op dit moment zeer beperkt (marginale mogelijkheden). Lever extra inspanning om juist die geringe mogelijkheden bij de eigen werkgever te benutten — in taken, uren en begeleiding; het tweede spoor is hier niet snel aan de orde (Werkwijzer 5.8)." },
  arbeidstherapeutisch: { level: "attention", title: "Arbeidstherapeutisch werken — begrenzen",
    body: "Er wordt (deels) op arbeidstherapeutische basis gewerkt. Begrens dit in tijd en bouw door naar uren mét loonwaarde; te lang arbeidstherapeutisch werken zonder loonwaarde is een grond om het Plan van Aanpak bij te stellen (Werkwijzer 3.2.4).",
    kort: "Arbeidstherapeutisch werken: begrens dit in tijd en bouw door naar uren mét loonwaarde (Werkwijzer 3.2.4)." },
  stagnatie: { level: "attention", title: "Stagnatie / hervatting instabiel",
    body: "De opbouw loopt achter op schema of de hervatting is instabiel. Stel het Plan van Aanpak bij; komen werkgever en werknemer er samen niet uit, vraag dan een deskundigenoordeel aan bij UWV (Werkwijzer 3.2.4, 5.4).",
    kort: "Opbouw stagneert of hervatting is instabiel: stel het Plan van aanpak bij; samen er niet uit? Vraag een deskundigenoordeel bij UWV (Werkwijzer 5.4)." },
  arbeidsconflict: { level: "risk", title: "Arbeidsconflict genoemd",
    body: "Er speelt een arbeidsconflict of verstoorde arbeidsverhouding. Zet mediation of een gesprek onder begeleiding in; een ziekmelding is geen oplossing voor een conflict (Werkwijzer 5.3).",
    kort: "Er speelt een arbeidsconflict: zet mediation of een begeleid gesprek in; een ziekmelding is geen oplossing voor een conflict (Werkwijzer 5.3)." },
  belastbaarheidNaEerstejaars: { level: "attention", title: "Belastbaarheid ontstaat pas na de eerstejaarsevaluatie",
    body: "De belastbaarheid ontstaat pas na de eerstejaarsevaluatie. Houd dan maximaal 8 weken aan tussen het vaststellen van de belastbaarheid en de start van de activiteiten: 2 weken voor bijstelling van het Plan van Aanpak en 6 weken tot uitvoering (Werkwijzer 4.3.2).",
    kort: "Belastbaarheid ontstaat pas na de eerstejaarsevaluatie: houd daarna maximaal 8 weken aan tot de start van de activiteiten (Werkwijzer 4.3.2)." },
  gewijzigdeBelastbaarheidSpoor2: { level: "attention", title: "Gewijzigde belastbaarheid terwijl spoor 2 loopt",
    body: "De belastbaarheid is gewijzigd terwijl het tweede-spoortraject loopt. Informeer het re-integratiebureau hier direct over (Werkwijzer 4.3.4).",
    kort: "Belastbaarheid gewijzigd terwijl spoor 2 loopt: informeer het re-integratiebureau direct (Werkwijzer 4.3.4)." },
  volledigInzetbaar: { level: "attention", title: "Volledige werkhervatting — let op de 4-wekenregel",
    body: "De werknemer is (weer) volledig inzetbaar. Houd rekening met de 4-wekenregel: meldt de werknemer zich binnen vier weken na de hersteldatum opnieuw ziek, dan worden de verzuimperioden als één doorlopend verzuim gezien — de eerste ziektedag schuift niet op en de wachttijd van 104 weken loopt door. Meld volledig herstel daarom pas als de werkhervatting echt stabiel is.",
    kort: "Weer volledig inzetbaar: let op de 4-wekenregel — meld volledig herstel pas als de werkhervatting echt stabiel is (anders loopt de wachttijd door)." },
};

// Dit signaal geeft geen eigen advies-alinea: het bepaalt mede welke
// re-integratieverslag-variant geldt bij ziek-uit-dienst (zie hieronder).
export const ZUD_MODIFIER_SIGNALEN = ["herstelVerwachtBinnen3Maanden"];

/**
 * @returns {Array<{level:'deadline'|'risk'|'attention'|'flag', title, body, deadlines?}>}
 */
export function computeAdvice(fields, reportDate, signalen = {}, opts = {}) {
  const advies = [];
  const eersteZ = parseNL(getVal(fields, "eersteZ"));
  const gebd = parseNL(getVal(fields, "geboortedatum"));
  const einddienst = parseNL(getVal(fields, "einddatum"));
  const peil = parseNL(reportDate) || new Date();
  const eindeWacht = eersteZ ? addWeeks(eersteZ, 104) : null;

  // ---- Altijd-adviezen ----
  advies.push({
    level: "deadline",
    title: "Altijd",
    body: "Leg de terugkoppeling vast in het verzuimdossier; geef daadwerkelijk invulling aan de afgegeven arbeidsmogelijkheden; en stel het Plan van Aanpak bij zodra de belastbaarheid wijzigt.",
    kort: "Leg de terugkoppeling vast in het verzuimdossier, geef de afgegeven mogelijkheden daadwerkelijk invulling en stel het Plan van aanpak bij zodra de belastbaarheid wijzigt.",
  });

  // No-risk is een SIGNAAL-advies (zie SIGNAAL_ADVIES.noRiskMogelijk): het komt
  // alleen in het bericht als de bedrijfsarts aangeeft dat het mogelijk speelt.

  // ---- Tijdlijn op verzuimweek ----
  if (eersteZ) {
    const verzuimweek = Math.max(0, weeksBetween(eersteZ, peil));
    const venster = verzuimweek + 8; // nu t/m 8 weken vooruit
    const actueel = TIMELINE.filter((t) => t.from <= venster && t.to >= verzuimweek);
    advies.push({
      level: "deadline",
      title: `Procesadviezen — verzuimweek ${verzuimweek}`,
      body: "Acties die nu of binnen 8 weken spelen, gerekend vanaf de eerste ziektedag:",
      deadlines: actueel.map((t) => ({
        title: t.title,
        date: `wk ${t.from}${t.to !== 999 && t.to !== t.from ? "–" + t.to : "+"} · ${fmtNL(addWeeks(eersteZ, t.from))}`,
        who: t.body,
      })),
    });
  } else {
    advies.push({
      level: "flag",
      title: "Eerste ziektedag ontbreekt",
      body: "Geef de eerste ziektedag door, dan stem ik de procesadviezen af op de verzuimduur.",
    });
  }

  // ---- Leeftijdsregels (geboortedatum) ----
  // Eindigt een tijdelijk contract vóór de WIA-poort (ziek uit dienst), dan is de
  // werknemer geen 2 jaar ziek bij deze werkgever en zijn de WIA-poort-/spoor 2-
  // leeftijdsregels niet aan de orde — die slaan we dan over.
  const zudActief = !!(einddienst && eindeWacht && einddienst < eindeWacht);
  if (gebd && eindeWacht && !zudActief) {
    const leeftijdEW = yearsBetween(gebd, eindeWacht);
    const aow = aowDatum(gebd);
    if (aow <= addYears(eindeWacht, 1)) {
      advies.push({
        level: "attention",
        title: "Geen tweede spoor nodig — AOW binnen 1 jaar na de WIA-poort (Werkwijzer 5.14)",
        body: `De werknemer bereikt rond ${fmtNL(aow)} de AOW-leeftijd — dat is binnen één jaar na het einde van de wachttijd (de WIA-poort, ${fmtNL(eindeWacht)}). Daarom hóeft een tweede-spoortraject niet te worden ingezet, mits werkgever én werknemer hier beiden mee instemmen; leg die instemming schriftelijk vast. (AOW-datum indicatief — controleer bij de SVB.)`,
        kort: `Tweede spoor is niet verplicht: de werknemer bereikt rond ${fmtNL(aow)} de AOW-leeftijd (binnen 1 jaar na de WIA-poort). Leg de wederzijdse instemming schriftelijk vast (Werkwijzer 5.14).`,
      });
    }
    const venster0109_2025 = new Date(2025, 8, 1);
    const venster0109_2027 = new Date(2027, 8, 1);
    if (leeftijdEW >= 60 && eindeWacht >= venster0109_2025 && eindeWacht <= venster0109_2027) {
      advies.push({
        level: "attention",
        title: "60-plusser — vereenvoudigde WIA-beoordeling",
        body: `De werknemer is bij het einde van de wachttijd (${fmtNL(eindeWacht)}) ${leeftijdEW} jaar. Meld bij het WIA-venster (week 87–93): er bestaat een vereenvoudigde WIA-beoordeling voor 60-plussers, zonder verzekeringsarts; beide partijen moeten ermee instemmen. (Geldig voor einde wachttijd t/m 01-09-2027.)`,
        kort: "60-plusser: er bestaat een vereenvoudigde WIA-beoordeling (zonder verzekeringsarts) bij het WIA-venster (week 87–93); beide partijen moeten instemmen.",
      });
    }
  } else if (!gebd && !zudActief) {
    advies.push({
      level: "flag",
      title: "Geboortedatum ontbreekt",
      body: "Geef de geboortedatum door; voor oudere werknemers gelden uitzonderingen rond spoor 2 (AOW) en de WIA-beoordeling (60-plus).",
    });
  }

  // ---- Ziek uit dienst (einddatum dienstverband) ----
  if (einddienst && eersteZ) {
    if (eindeWacht && einddienst < eindeWacht) {
      const ziekteWeken = Math.max(0, weeksBetween(eersteZ, einddienst));
      const herstel3mnd = !!(signalen && signalen.herstelVerwachtBinnen3Maanden);
      let riv;
      if (ziekteWeken < 6) riv = "Geen re-integratieverslag nodig; doe alleen een ziek-uit-dienstmelding bij UWV, uiterlijk op de laatste werkdag.";
      // Grens inclusief: UWV accepteert een verkort verslag tot en met 10 weken
      // verzuim (Regeling procesgang; naslagwerk 2026: "6-10 weken → verkort").
      else if (ziekteWeken <= 10) riv = "Verkort re-integratieverslag, uiterlijk op de laatste dag van het dienstverband.";
      else if (herstel3mnd) riv = "Verkort re-integratieverslag volstaat (de bedrijfsarts verwacht volledig herstel binnen 3 maanden), uiterlijk op de laatste dag van het dienstverband.";
      else riv = "Volledig re-integratieverslag (probleemanalyse, PvA + bijstellingen, evaluaties, actueel oordeel), uiterlijk op de laatste dag.";
      advies.push({
        level: "risk",
        title: "Ziek uit dienst — tijdelijk contract dat tijdens ziekte afloopt (Werkwijzer 5.5–5.7)",
        body: `Het tijdelijke contract eindigt op ${fmtNL(einddienst)} (ziekteduur op die datum ± ${ziekteWeken} weken). Ga er niet automatisch van uit dat het contract niet wordt verlengd. Laat je het tijdelijke contract van rechtswege aflopen (dus niet verlengen), dan geldt het volgende: ${riv} Ben je voornemens niet te verlengen, meld de werknemer dan óp de laatste dag van het dienstverband ziek uit dienst bij UWV (Ziektewet) — een veel eerdere aangifte is niet toegestaan en te laat melden riskeert een boete tot € 515 — en geef hem een kopie van het verslag. Lever tot de laatste dag dezelfde re-integratie-inspanningen; wordt herstel vóór de einddatum niet verwacht, richt je dan vooral op spoor 2 en overweeg een participatieverzoek bij UWV.`,
        kort: `Tijdelijk contract loopt tijdens ziekte af (${fmtNL(einddienst)}): bij niet-verlengen uiterlijk op de laatste dag ziek uit dienst melden bij UWV. ${riv}`,
      });
    } else {
      advies.push({
        level: "attention",
        title: "Einddatum dienstverband na einde wachttijd",
        body: `Het dienstverband eindigt op ${fmtNL(einddienst)}, na het einde van de wachttijd. De gebruikelijke re-integratieverplichtingen gedurende de eerste 104 weken blijven van toepassing.`,
        kort: `Dienstverband eindigt ${fmtNL(einddienst)}, ná het einde van de wachttijd: de re-integratieverplichtingen in de eerste 104 weken blijven gelden.`,
      });
    }
  }
  // Geen einddatum doorgegeven → uitgaan van een vast contract; hierover niets melden.

  // ---- Zwangerschap / WAZO-verlof (handmatig ingevoerd; opts.wazo) ----
  if (opts.wazo && eersteZ) {
    const w = opts.wazo;
    const eindeVerschoven = fmtNL(addDays(addWeeks(eersteZ, 104), w.totaalDagen));
    advies.push({
      level: "risk",
      title: "Zwangerschap — WAZO-verlof verschuift de wachttijd",
      body: `Het zwangerschaps- en bevallingsverlof (WAZO, ${w.totaalWeken} weken) pauzeert de loondoorbetaling en de 104-wekentermijn; de einde-wachttijd schuift daardoor op naar ${eindeVerschoven}. Let op: dit doortellen over het verlof heen geldt alleen als de ziekteoorzaak ná het bevallingsverlof dezelfde is als ervóór — is de oorzaak anders, dan start ná het verlof een nieuwe eerste ziektedag (en een nieuwe wachttijd). Komt het verzuim voort uit de zwangerschap of bevalling, dan valt het onder de Ziektewet (vangnet, art. 29a ZW): meld dat bij UWV, dan vergoedt UWV (een deel van) je loonkosten via ziekengeld. Leg in je dossier alleen vast dát het zwangerschaps-/bevallingsgerelateerd is, nooit de medische details.`,
      kort: `Zwangerschap: het WAZO-verlof (${w.totaalWeken} wk) pauzeert de wachttijd — einde wachttijd schuift op naar ${eindeVerschoven} (alleen bij dezelfde ziekteoorzaak vóór en ná het verlof; anders start een nieuwe wachttijd). Is het verzuim zwangerschaps-/bevallingsgerelateerd, meld dat dan bij UWV (Ziektewet-vangnet, art. 29a ZW): UWV vergoedt dan een deel van je loonkosten.`,
    });
  }

  // ---- Voorwaardelijke adviezen op signaalwoorden (door de AI gedetecteerd) ----
  const verzuimweek = eersteZ ? Math.max(0, weeksBetween(eersteZ, peil)) : 0;
  for (const key of Object.keys(SIGNAAL_ADVIES)) {
    if (!signalen || !signalen[key]) continue;
    if (key === "marginaleMogelijkheden") {
      // De opmerking 'spoor 2 is niet snel aan de orde' speelt pas rond het eerste
      // ziektejaar. Bij een paar weken verzuim laten we die bewust weg.
      const rondJaar = eersteZ && verzuimweek >= 46;
      advies.push({
        level: "attention",
        title: "Marginale mogelijkheden",
        body: rondJaar
          ? "De belastbaarheid is op dit moment zeer beperkt (marginale mogelijkheden). Lever extra inspanning om juist die geringe mogelijkheden bij de eigen werkgever te benutten — in taken, uren en begeleiding. Gezien de duur van het verzuim is het tweede spoor hier voorlopig niet snel aan de orde (Werkwijzer 5.8); beoordeel dit rond de eerstejaarsevaluatie opnieuw."
          : "De belastbaarheid is op dit moment zeer beperkt (marginale mogelijkheden). Lever extra inspanning om juist die geringe mogelijkheden bij de eigen werkgever te benutten — in taken, uren en begeleiding, en bouw uit zodra de belastbaarheid dat toelaat.",
        kort: rondJaar
          ? "Marginale mogelijkheden: benut juist die geringe mogelijkheden bij de eigen werkgever (taken, uren, begeleiding); tweede spoor voorlopig niet aan de orde (Werkwijzer 5.8)."
          : "Marginale mogelijkheden: benut juist die geringe mogelijkheden bij de eigen werkgever (taken, uren, begeleiding) en bouw uit zodra de belastbaarheid dat toelaat.",
      });
      continue;
    }
    advies.push(SIGNAAL_ADVIES[key]);
  }

  return advies;
}

function ensureDot(s) { s = String(s).trim(); return s && !/[.!?]$/.test(s) ? s + "." : s; }

/** Kernzinnen van het begeleidend bericht (belastbaarheid + opbouw + werkaanpassing).
 *  Robuust bij waarden die hele zinnen zijn; geen [INVULLEN] in de tekst. */
export function berichtKern(fields, schema, schemaZelfOpgesteld, opbouwReden = "") {
  const naam = getVal(fields, "naam");
  const werknemer = isMissing(naam) ? "de werknemer" : naam;
  const belast = getVal(fields, "belast");
  const opbouw = getVal(fields, "opbouw");
  const start = getVal(fields, "start");
  const beperking = getVal(fields, "beperking");
  const startD = schema[0] ? schema[0].date : "";
  const eindD = schema.length ? fullRecoveryDate(schema) : "";
  const fromH = schema[0] ? schema[0].hours : 0;
  const toH = schema.length ? schema[schema.length - 1].hours : 0;

  const zinnen = [];
  if (!isMissing(belast)) zinnen.push(ensureDot(`De bedrijfsarts beschrijft de belastbaarheid van ${werknemer} als volgt: ${belast}`));
  if (opbouwReden) {
    zinnen.push(ensureDot(opbouwReden));
  } else if (schema.length >= 2) {
    if (schemaZelfOpgesteld) {
      zinnen.push(`De bedrijfsarts heeft geen concreet opbouwtempo gespecificeerd. Op basis van de afgegeven mogelijkheden is een opbouwschema opgesteld dat vanaf ${startD} tweewekelijks met één uur per werkdag oploopt van ${fromH} naar ${toH} uur; volledige werkhervatting is daarmee voorzien rond ${eindD}.`);
    } else {
      zinnen.push(`De geadviseerde opbouw start op ${isMissing(start) ? startD : start} en loopt op van ${fromH} naar ${toH} uur${isMissing(opbouw) ? "" : ` (${opbouw.toLowerCase()})`}; volledige werkhervatting is voorzien rond ${eindD}.`);
    }
  }
  if (!isMissing(beperking)) zinnen.push(ensureDot(`Houd rekening met de werkaanpassing: ${beperking}`));
  // Houdbaarheid van dit advies: een terugkoppeling is een momentopname.
  const volgend = getVal(fields, "volgendSpreekuur");
  zinnen.push(isMissing(volgend)
    ? "Dit advies is gebaseerd op de huidige terugkoppeling; stel het Plan van Aanpak bij na elk volgend spreekuur van de bedrijfsarts."
    : `Het volgende spreekuur bij de bedrijfsarts staat gepland op ${volgend}; loop dit advies daarna opnieuw na en stel het Plan van Aanpak bij als de belastbaarheid is gewijzigd.`);
  return zinnen;
}

/**
 * Werknemersversie van het begeleidend bericht — eenvoudige taal (taalniveau
 * B1: korte zinnen, geen jargon). Het PvA is een document van werkgever én
 * werknemer samen; deze brief legt de werknemer uit wat het plan is, wat er
 * gaat gebeuren, wat er van hem/haar wordt verwacht en welke rechten er zijn.
 * Deterministisch uit de gecontroleerde velden — geen AI.
 * @returns {Array<{type:'h'|'p'|'bullets', text?:string, items?:string[]}>}
 */
export function werknemerBrief(fields, schema, reportDate, { signalen = {}, opbouwReden = "" } = {}) {
  const geenOpbouw = !!opbouwReden || schema.length === 0;
  const beperking = getVal(fields, "beperking");
  const volgend = getVal(fields, "volgendSpreekuur");
  const startD = schema[0] ? schema[0].date : "";
  const eindD = schema.length ? schema[schema.length - 1].date : "";
  const fromH = schema[0] ? schema[0].hours : 0;
  const toH = schema.length ? schema[schema.length - 1].hours : 0;

  const blokken = [];
  blokken.push({ type: "p", text: `Je bent op dit moment ziekgemeld. Samen met jou willen we werken aan je herstel en aan je terugkeer naar het werk. In deze brief lees je wat er nu gaat gebeuren. Bij deze brief hoort een voorstel: het Plan van Aanpak, gemaakt na het advies van de bedrijfsarts van ${reportDate}.` });

  blokken.push({ type: "h", text: "Wat is een Plan van Aanpak?" });
  blokken.push({ type: "p", text: "De wet vraagt dat werkgever en werknemer sámen afspraken maken over de terugkeer naar werk. Die afspraken staan in het Plan van Aanpak. Dit plan is van jullie samen: het geldt pas als jullie het allebei hebben ondertekend. Je mag er ook je eigen mening in zetten." });
  blokken.push({ type: "p", text: "In het plan staat géén medische informatie. Wat je precies hebt, blijft privé tussen jou en de bedrijfsarts. Je hoeft het je werkgever niet te vertellen." });

  blokken.push({ type: "h", text: "Wat gaat er gebeuren?" });
  if (!geenOpbouw && schema.length >= 2) {
    blokken.push({ type: "p", text: `De bedrijfsarts heeft gekeken naar wat je nu al kunt. Het voorstel: je begint op ${startD} met ${fromH} uur per week. Daarna ga je stap voor stap meer uren werken. Als alles goed gaat, werk je rond ${eindD} weer je volledige ${toH} uur. Gaat het sneller of juist langzamer? Dan passen we het schema samen aan.` });
  } else if (signalen && signalen.volledigInzetbaar) {
    blokken.push({ type: "p", text: "De bedrijfsarts geeft aan dat je weer volledig aan het werk kunt in je eigen uren. In het plan leggen we vast hoe we dat samen goed laten verlopen." });
  } else {
    blokken.push({ type: "p", text: "Op dit moment is werken nog niet mogelijk, of maar heel beperkt. Er is daarom nog geen opbouwschema. De bedrijfsarts kijkt bij je volgende afspraak opnieuw wat er kan. Je hoeft nu dus niets te forceren." });
  }
  if (!isMissing(beperking)) {
    blokken.push({ type: "p", text: `Er wordt rekening gehouden met: ${String(beperking).toLowerCase()}.` });
  }
  blokken.push({ type: "p", text: isMissing(volgend)
    ? "De bedrijfsarts nodigt je uit voor een volgende afspraak. Ga daar altijd naartoe — ook als het goed gaat."
    : `Je volgende afspraak bij de bedrijfsarts is op ${volgend}. Ga daar altijd naartoe — ook als het goed gaat.` });

  blokken.push({ type: "h", text: "Wat verwachten we van jou?" });
  blokken.push({ type: "bullets", items: [
    "Werk mee aan de afspraken in het plan, zo goed als je kunt.",
    "Ga naar de afspraken met de bedrijfsarts.",
    "Gaat iets beter of juist slechter? Geef het snel door — dan passen we het plan samen aan.",
    "Onderteken het plan pas als je het begrijpt en het ermee eens bent.",
  ] });

  blokken.push({ type: "h", text: "Ben je het ergens niet mee eens?" });
  blokken.push({ type: "p", text: "Bespreek het eerst met je werkgever of leidinggevende. Komen jullie er samen niet uit? Dan kun je bij UWV een 'deskundigenoordeel' aanvragen: een onafhankelijke deskundige van UWV kijkt dan mee. Meer informatie vind je op https://www.uwv.nl." });

  blokken.push({ type: "p", text: "Lees het plan rustig door. Heb je vragen? Stel ze gerust — we doen dit samen." });
  return blokken;
}

function eersteZin(s) { return String(s || "").split(/(?<=[.!?])\s/)[0]; }
function bulletTekst(a) { return a.kort || eersteZin(a.body); }

/**
 * Selecteert de praktische kernpunten voor het begeleidend bericht als korte
 * bullet-lijst (max ~4–5). Volgorde: Altijd → eerstvolgende 1–2 procesacties →
 * alle risk-adviezen (worden nooit weggelaten) → attention-adviezen tot de cap.
 * Input-nudges (flags) en het no-risk-advies (brief:false) blijven eruit; die
 * laatste blijft wél in computeAdvice voor de adviescatalogus.
 * @returns {{bullets: string[], termijnRef: boolean}}
 */
export function adviceBullets(fields, reportDate, signalen = {}, opts = {}) {
  const advies = computeAdvice(fields, reportDate, signalen, opts);
  const inBrief = advies.filter((a) => a.brief !== false && a.level !== "flag");

  const altijd = inBrief.find((a) => a.title === "Altijd");
  const proces = inBrief.find((a) => a.deadlines && a.deadlines.length);
  const risks = inBrief.filter((a) => a.level === "risk" && a !== altijd);
  const attentions = inBrief.filter((a) => a.level === "attention");

  const CAP = 5; // zachte bovengrens; risk-adviezen tellen wél mee maar vallen nooit weg
  const bullets = [];
  if (altijd) bullets.push(bulletTekst(altijd));
  if (proces) for (const d of proces.deadlines.slice(0, 2)) bullets.push(d.who);
  for (const a of risks) bullets.push(bulletTekst(a)); // nooit weglaten
  for (const a of attentions) {
    if (bullets.length >= CAP) break;
    bullets.push(bulletTekst(a));
  }
  return { bullets, termijnRef: !!proces };
}

/** Splitst lopende tekst in segmenten {type:'text'|'url'|'email', value}, zodat de
 *  preview (HTML <a>) en de .docx-export (ExternalHyperlink) links klikbaar maken.
 *  Trailing leestekens (.,;:!?) blijven buiten de link. */
export function splitLinks(text) {
  const s = String(text == null ? "" : text);
  const re = /(https?:\/\/[^\s)]*[^\s).,;:!?])|([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
  const parts = [];
  let last = 0, m;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: s.slice(last, m.index) });
    parts.push(m[1] ? { type: "url", value: m[1] } : { type: "email", value: m[2] });
    last = re.lastIndex;
  }
  if (last < s.length) parts.push({ type: "text", value: s.slice(last) });
  return parts;
}

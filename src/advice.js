/* Adviesmotor — volgt de Agentprompt PvA v2 (kennisdocument).
   Adviezen op basis van: verzuimweek (eerste ziektedag), leeftijd (geboortedatum)
   en ziek-uit-dienst (einddatum dienstverband). Paragraafverwijzingen = Werkwijzer
   Poortwachter. Datums in de cards: DD-MM-JJJJ (jaar erbij omdat 104 weken twee
   kalenderjaren beslaat); het opbouwschema/PvA volgt de DD-MM-notatie. */

import { getVal } from "./casedata.js";

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
function addYears(d, y) { const x = new Date(d); x.setFullYear(x.getFullYear() + y); return x; }
function weeksBetween(a, b) { return Math.floor((b - a) / (7 * 864e5)); }
function yearsBetween(from, to) {
  let y = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) y--;
  return y;
}

const AOW_LEEFTIJD = 67; // indicatief; exacte AOW-leeftijd opvragen bij SVB

/** Automatisch berekende waarden uit de gegevens (alleen-lezen weergave). */
export function computeDerived(fields) {
  const eersteZ = parseNL(getVal(fields, "eersteZ"));
  const gebd = parseNL(getVal(fields, "geboortedatum"));
  return {
    aow: gebd ? fmtNL(addYears(gebd, AOW_LEEFTIJD)) : "",
    eindeWacht: eersteZ ? fmtNL(addWeeks(eersteZ, 104)) : "",
  };
}

// Adviestijdlijn (Agentprompt v2). weekTo: 999 = open einde.
const TIMELINE = [
  { from: 0,  to: 8,   title: "Plan van Aanpak op tijd",            body: "Stel het Plan van Aanpak uiterlijk in week 8 op (2 weken na de probleemanalyse)." },
  { from: 40, to: 42,  title: "42e-weeksmelding bij UWV",           body: "Doe de 42e-weeksmelding bij UWV." },
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

// Voorwaardelijke Werkwijzer-adviezen, afgevuurd op signaalwoorden die de AI detecteert.
const SIGNAAL_ADVIES = {
  geenBenutbareMogelijkheden: { level: "risk", title: "Geen benutbare mogelijkheden (GBM)",
    body: "Forceer nu geen re-integratieactiviteiten. De bedrijfsarts houdt de vinger aan de pols: plan vervolgconsulten en leg elke terugkoppeling vast. Duurt de GBM-situatie de volle 2 jaar, dan volstaat een beperkt re-integratieverslag (Werkwijzer 5.9, 3.1)." },
  duurzaamGeenMogelijkheden: { level: "risk", title: "Duurzaam geen mogelijkheden — overweeg vervroegde IVA",
    body: "Is er duurzaam geen benutbare mogelijkheid én geen herstelverwachting, wijs dan op een vervroegde IVA-aanvraag (mogelijk tot week 68 van het verzuim)." },
  marginaleMogelijkheden: { level: "attention", title: "Marginale mogelijkheden",
    body: "Lever extra inspanning om de geringe mogelijkheden bij de eigen werkgever te benutten (taken, uren, begeleiding). Het tweede spoor is hierbij niet snel aan de orde (Werkwijzer 5.8)." },
  arbeidstherapeutisch: { level: "attention", title: "Arbeidstherapeutisch werken — begrenzen",
    body: "Begrens werken op arbeidstherapeutische basis in tijd en bouw door naar uren mét loonwaarde. Te lang arbeidstherapeutisch zonder loonwaarde is een grond om het Plan van Aanpak bij te stellen (Werkwijzer 3.2.4)." },
  stagnatie: { level: "attention", title: "Stagnatie / hervatting instabiel",
    body: "Stel het Plan van Aanpak bij. Loopt de re-integratie vast en komen werkgever en werknemer er samen niet uit, vraag dan een deskundigenoordeel aan bij UWV (Werkwijzer 3.2.4, 5.4)." },
  arbeidsconflict: { level: "risk", title: "Arbeidsconflict genoemd",
    body: "Zet mediation of een gesprek onder begeleiding in. Een ziekmelding is geen oplossing voor een conflict (Werkwijzer 5.3)." },
  belastbaarheidNaEerstejaars: { level: "attention", title: "Belastbaarheid ontstaat pas na de eerstejaarsevaluatie",
    body: "Houd maximaal 8 weken aan tussen het vaststellen van de belastbaarheid en de start van de activiteiten: 2 weken voor bijstelling van het PvA en 6 weken tot uitvoering (Werkwijzer 4.3.2)." },
  gewijzigdeBelastbaarheidSpoor2: { level: "attention", title: "Gewijzigde belastbaarheid terwijl spoor 2 loopt",
    body: "Informeer het re-integratiebureau direct over de gewijzigde belastbaarheid (Werkwijzer 4.3.4)." },
};

/**
 * @returns {Array<{level:'deadline'|'risk'|'attention'|'flag', title, body, deadlines?}>}
 */
export function computeAdvice(fields, reportDate, signalen = {}) {
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
  });

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
  if (gebd && eindeWacht) {
    const leeftijdEW = yearsBetween(gebd, eindeWacht);
    const aow = addYears(gebd, AOW_LEEFTIJD);
    if (aow <= addYears(eindeWacht, 1)) {
      advies.push({
        level: "attention",
        title: "Geen tweede spoor nodig — AOW binnen 1 jaar na de WIA-poort (Werkwijzer 5.14)",
        body: `De werknemer bereikt rond ${fmtNL(aow)} de AOW-leeftijd — dat is binnen één jaar na het einde van de wachttijd (de WIA-poort, ${fmtNL(eindeWacht)}). Daarom hóeft een tweede-spoortraject niet te worden ingezet, mits werkgever én werknemer hier beiden mee instemmen; leg die instemming schriftelijk vast. (AOW-datum indicatief — controleer bij de SVB.)`,
      });
    }
    const venster0109_2025 = new Date(2025, 8, 1);
    const venster0109_2027 = new Date(2027, 8, 1);
    if (leeftijdEW >= 60 && eindeWacht >= venster0109_2025 && eindeWacht <= venster0109_2027) {
      advies.push({
        level: "attention",
        title: "60-plusser — vereenvoudigde WIA-beoordeling",
        body: `De werknemer is bij het einde van de wachttijd (${fmtNL(eindeWacht)}) ${leeftijdEW} jaar. Meld bij het WIA-venster (week 87–93): er bestaat een vereenvoudigde WIA-beoordeling voor 60-plussers, zonder verzekeringsarts; beide partijen moeten ermee instemmen. (Geldig voor einde wachttijd t/m 01-09-2027.)`,
      });
    }
  } else if (!gebd) {
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
      let riv;
      if (ziekteWeken < 6) riv = "Geen re-integratieverslag nodig; doe alleen een ziek-uit-dienstmelding bij UWV, uiterlijk op de laatste werkdag.";
      else if (ziekteWeken <= 10) riv = "Verkort re-integratieverslag, uiterlijk op de laatste dag van het dienstverband.";
      else riv = "Volledig re-integratieverslag (probleemanalyse, PvA + bijstellingen, evaluaties, actueel oordeel), uiterlijk op de laatste dag.";
      advies.push({
        level: "risk",
        title: "Ziek uit dienst — tijdelijk contract eindigt tijdens ziekte (Werkwijzer 5.5–5.7)",
        body: `Het dienstverband eindigt op ${fmtNL(einddienst)}; ziekteduur op die datum is ± ${ziekteWeken} weken. ${riv} Geef het ziek-uit-dienstgaan door aan UWV (Ziektewet) en geef de werknemer een kopie van het verslag. Lever dezelfde re-integratie-inspanningen tot de laatste dag en richt je op spoor 2 als herstel vóór de einddatum niet wordt verwacht. (Uitzondering: eigenrisicodrager Ziektewet — afwijkende afspraken.)`,
      });
    } else {
      advies.push({
        level: "attention",
        title: "Einddatum dienstverband na einde wachttijd",
        body: `Het dienstverband eindigt op ${fmtNL(einddienst)}, na het einde van de wachttijd. De gebruikelijke re-integratieverplichtingen gedurende de eerste 104 weken blijven van toepassing.`,
      });
    }
  } else if (!einddienst) {
    advies.push({
      level: "flag",
      title: "Einddatum dienstverband ontbreekt",
      body: "Bij een tijdelijk contract: geef de einddatum door. Eindigt het contract tijdens de ziekte, dan bepaalt de ziekteduur op de einddatum welk re-integratieverslag nodig is (geen / verkort / volledig) en gelden Ziektewet-regels.",
    });
  }

  // ---- Voorwaardelijke adviezen op signaalwoorden (door de AI gedetecteerd) ----
  for (const key of Object.keys(SIGNAAL_ADVIES)) {
    if (signalen && signalen[key]) advies.push(SIGNAAL_ADVIES[key]);
  }

  return advies;
}

/** Zet de adviezen om naar lopende alinea's voor het begeleidend bericht. */
export function adviceParagraphs(fields, reportDate, signalen = {}) {
  const advies = computeAdvice(fields, reportDate, signalen);
  const alineas = [];
  for (const a of advies) {
    if (a.deadlines && a.deadlines.length) {
      const punten = a.deadlines.map((d) => d.who).join(" ");
      alineas.push(`${a.body} ${punten}`);
    } else {
      alineas.push(a.body);
    }
  }
  return alineas;
}

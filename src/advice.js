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

/**
 * @returns {Array<{level:'deadline'|'risk'|'attention'|'flag', title, body, deadlines?}>}
 */
export function computeAdvice(fields, reportDate) {
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
        title: "AOW binnen 1 jaar na einde wachttijd — spoor 2 (Werkwijzer 5.14)",
        body: `De werknemer bereikt rond ${fmtNL(aow)} de AOW-leeftijd (indicatief — controleer bij de SVB). Van een tweede-spoortraject mag worden afgezien, mits werkgever én werknemer hier beiden mee instemmen; leg die instemming schriftelijk vast.`,
      });
    }
    const venster0109_2025 = new Date(2025, 8, 1);
    const venster0109_2027 = new Date(2027, 8, 1);
    if (leeftijdEW >= 60 && eindeWacht >= venster0109_2025 && eindeWacht <= venster0109_2027) {
      advies.push({
        level: "attention",
        title: "60-plusser — vereenvoudigde WIA-beoordeling",
        body: `De werknemer is rond het einde van de wachttijd (${fmtNL(eindeWacht)}) ${leeftijdEW} jaar. Meld bij het WIA-venster (week 87–93): er bestaat een vereenvoudigde WIA-beoordeling voor 60-plussers, zonder verzekeringsarts; beide partijen moeten ermee instemmen.`,
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

  return advies;
}

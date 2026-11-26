/* Termijnen berekenen: de werkgever vult de eerste ziektedag in en ziet alle
   termijnen van de Wet verbetering poortwachter met datum, op volgorde.
   build.mjs rendert de pagina vooraf (zonder datums, met weeknummers);
   termijnen-client.jsx neemt alleen het rekenblok over in de browser.
   Er wordt niets opgeslagen of verstuurd. */

import { Nav, Footer } from "./landing.jsx";
import { mailto, CONTACT_MAIL } from "./merk.jsx";

const { useState } = React;

export const TERMIJNEN_SLUG = "termijnen-berekenen";

/* Weektelling: de eerste ziektedag is dag 1 van week 1.
   begin(n) = eerste dag van week n, eind(n) = laatste dag van week n. */
const DAG = 86400000;
const begin = (start, n) => new Date(start.getTime() + (n - 1) * 7 * DAG);
const eind = (start, n) => new Date(start.getTime() + (n * 7 - 1) * DAG);

const MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
// Vaste notatie (geen toLocaleDateString), zodat elke browser hetzelfde toont.
export const datumTekst = (d) => `${DAGEN[d.getUTCDay()]} ${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

export function leesDatum(waarde) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(waarde || "");
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}

/* Voetnoot bij de stappen waar ik bij kan helpen. */
const hulp = (onderwerp) => ({ onderwerp, href: mailto(onderwerp, "Ik heb een vraag over de termijnen van de Wet poortwachter.\n\nEerste ziektedag:\nBedrijfsnaam en plaats:\nTelefoonnummer:") });

/* De termijnen. `wanneer` geeft { tekst, datum } voor een eerste ziektedag.
   `uitgebreid: true` = alleen in de uitgebreide weergave. */
export const TERMIJNEN = [
  {
    week: "Week 1", titel: "Ziekmelding bij de bedrijfsarts of arbodienst", kern: "Melden bij bedrijfsarts of arbodienst; het dossier begint.",
    uitleg: "Meld je werknemer binnen een week ziek bij de bedrijfsarts of arbodienst. Het verzuimdossier begint op de eerste ziektedag.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 1) }),
  },
  {
    week: "Week 6", titel: "Probleemanalyse", kern: "Bedrijfsarts: mogelijkheden, belemmeringen en advies.",
    uitleg: "De bedrijfsarts beschrijft wat je werknemer nog kan, wat terugkeer in de weg staat en wat het advies is.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 6) }),
  },
  {
    week: "Week 6 tot 68", titel: "Vervroegde IVA-aanvraag (mogelijk)", kern: "Bij geen of nauwelijks kans op herstel.", uitgebreid: true,
    uitleg: "Is er geen of nauwelijks kans op herstel, dan kan je werknemer eerder een IVA-uitkering aanvragen. Dat kan tot en met week 68.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 68), van: begin(s, 6) }),
  },
  {
    week: "Week 8", titel: "Plan van aanpak", kern: "Doel en afspraken vastleggen, casemanager aanwijzen.", link: "/plan-van-aanpak/",
    uitleg: "Werkgever en werknemer leggen samen het doel en de afspraken vast, op basis van het advies van de bedrijfsarts. Wijs ook een casemanager aan.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 8) }),
    hulp: hulp("Plan van aanpak"),
  },
  {
    week: "Vanaf week 8", titel: "Voortgang bespreken en het plan bijstellen", kern: "Minstens eens per zes weken; bijstellen en vastleggen.", uitgebreid: true,
    uitleg: "Bespreek regelmatig, minstens eens per zes weken, hoe het gaat. Verandert de situatie, stel het plan van aanpak dan bij en leg dat vast. Loopt het vast, dan kan een deskundigenoordeel bij UWV helpen.",
    wanneer: () => null,
  },
  {
    week: "Rond week 40", titel: "Arbeidsdeskundig onderzoek (aanbevolen)", kern: "Wat kan nog, bij jou of elders?", uitgebreid: true,
    uitleg: "Is volledige terugkeer in het eigen werk niet in zicht, laat dan vóór de eerstejaarsevaluatie onderzoeken wat er nog wel kan, bij jou of elders. Dat geeft een stevige basis voor spoor 1 en spoor 2.",
    wanneer: (s) => ({ tekst: "rond", datum: begin(s, 40) }),
    hulp: hulp("Arbeidsdeskundig onderzoek"),
  },
  {
    week: "Week 42", titel: "42e-weeksmelding bij UWV", kern: "Melden dat je werknemer nog ziek is.",
    uitleg: "Meld bij UWV dat je werknemer nog ziek is. Doe dat uiterlijk in de 42e week.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 42) }),
  },
  {
    week: "Week 46 tot 52", titel: "Eerstejaarsevaluatie", kern: "Terugkijken en het doel voor jaar twee kiezen.", link: "/eerstejaarsevaluatie/",
    uitleg: "Kijk samen terug op het eerste jaar en kies het doel voor het tweede jaar.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 52), van: begin(s, 46) }),
    hulp: hulp("Eerstejaarsevaluatie"),
  },
  {
    week: "Week 58", titel: "Spoor 2 inzetten", kern: "Werk zoeken bij een andere werkgever.",
    uitleg: "Is er geen zicht op passend werk in je eigen organisatie, dan moet uiterlijk zes weken na de eerstejaarsevaluatie het tweede spoor lopen: werk zoeken bij een andere werkgever.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 58) }),
    hulp: hulp("Spoor 2"),
  },
  {
    week: "Rond week 88", titel: "Brief van UWV over de WIA-aanvraag", kern: "Start met het compleet maken van het verslag.",
    uitleg: "UWV stuurt je werknemer een brief met de uitnodiging om de WIA-uitkering aan te vragen. Tijd om het re-integratieverslag compleet te maken.",
    wanneer: (s) => ({ tekst: "rond", datum: begin(s, 88) }),
    hulp: hulp("Re-integratieverslag"),
  },
  {
    week: "Vóór de aanvraag", titel: "Actueel oordeel en eindevaluatie", kern: "Bedrijfsarts en daarna samen de eindevaluatie.", link: "/eindevaluatie/", uitgebreid: true,
    uitleg: "De bedrijfsarts schrijft het actueel oordeel. Daarna vullen werkgever en werknemer samen de eindevaluatie in.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 91) }),
    hulp: hulp("Eindevaluatie"),
  },
  {
    week: "Week 91 tot 93", titel: "WIA-aanvraag met het volledige re-integratieverslag", kern: "Uiterlijk in week 93 bij UWV.", link: "/wia-aanvraag-werknemer/",
    uitleg: "Je werknemer vraagt de WIA-uitkering aan, met het complete re-integratieverslag. Dat moet uiterlijk in week 93 bij UWV zijn.",
    wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 93), van: begin(s, 91) }),
    hulp: hulp("Re-integratieverslag week 93"),
  },
  {
    week: "Week 104", titel: "Einde loondoorbetaling", kern: "De WIA-uitkering kan de dag erna ingaan.",
    uitleg: "Na 104 weken stopt de loondoorbetaling, tenzij UWV een loonsanctie oplegt. De WIA-uitkering kan de dag erna ingaan.",
    wanneer: (s) => ({ tekst: "laatste dag", datum: eind(s, 104) }),
  },
];

/* Ziek uit dienst: wat je dan aanlevert, afhankelijk van de week van uitdiensttreding. */
export const UIT_DIENST = [
  {
    week: "Vóór week 6", titel: "Alleen een vragenlijst",
    uitleg: "Gaat je werknemer vóór de zesde ziekteweek uit dienst, dan vult de werknemer bij de Ziektewet-aanvraag alleen een vragenlijst in.",
    wanneer: (s) => ({ tekst: "tot en met", datum: eind(s, 5) }),
  },
  {
    week: "Week 6 tot 10", titel: "Verkort re-integratieverslag",
    uitleg: "Gaat je werknemer uit dienst tussen week 6 en week 10, dan lever je het verkorte re-integratieverslag aan.",
    wanneer: (s) => ({ tekst: "tot en met", datum: eind(s, 10), van: begin(s, 6) }),
  },
  {
    week: "Vanaf week 10", titel: "Volledig re-integratieverslag",
    uitleg: "Gaat je werknemer na de tiende week uit dienst, dan lever je het volledige re-integratieverslag aan, met een eindevaluatie.",
    wanneer: (s) => ({ tekst: "vanaf", datum: begin(s, 11) }),
    hulp: hulp("Re-integratieverslag bij uitdiensttreding"),
  },
];

function Termijn({ t, start, vandaag }) {
  const w = start ? t.wanneer(start) : null;
  const voorbij = w && vandaag && w.datum < vandaag;
  return (
    <li className={"termijn" + (voorbij ? " termijn--voorbij" : "")}>
      <div className="termijn-wanneer">
        <span className="termijn-week">{t.week}</span>
        {w && (
          <span className="termijn-datum">
            {w.van ? <>{datumTekst(w.van)} tot en met {datumTekst(w.datum)}</> : <>{w.tekst} {datumTekst(w.datum)}</>}
            {voorbij && <span className="termijn-status"> · voorbij</span>}
          </span>
        )}
      </div>
      <div className="termijn-wat">
        <h3>{t.link ? <a href={t.link}>{t.titel}</a> : t.titel}</h3>
        <p>{t.uitleg}</p>
        {t.hulp && (
          <p className="termijn-hulp">
            Vragen hierover? Ik help je graag met begeleiding en ondersteuning. <a href={t.hulp.href}>Stuur een bericht</a>.
          </p>
        )}
      </div>
    </li>
  );
}


/* Stroomschema voor de pdf (alleen zichtbaar bij afdrukken): een doorgaande
   lijn met de termijnen er om en om naast. */
function Stroomschema({ lijst, start, uitgebreid }) {
  const items = lijst.filter((t) => t.wanneer(start));
  return (
    <section className="stroom" aria-hidden="true">
      <header className="stroom-kop">
        <p className="stroom-merk">Poortwachtercheck</p>
        <h2>Termijnen Wet verbetering poortwachter</h2>
        <p className="stroom-sub">Eerste ziektedag: <strong>{datumTekst(start)}</strong> · {uitgebreid ? "uitgebreide" : "vereenvoudigde"} weergave</p>
      </header>
      <ol className="stroom-lijn">
        <li className="stroom-item stroom-item--start">
          <span className="stroom-punt" />
          <div className="stroom-kaart"><span className="stroom-week">Dag 1</span><strong>Eerste ziektedag</strong><span className="stroom-datum">{datumTekst(start)}</span></div>
        </li>
        {items.map((t, i) => {
          const w = t.wanneer(start);
          return (
            <li key={t.titel} className={"stroom-item" + (i % 2 ? " stroom-item--links" : " stroom-item--rechts") + (t.hulp ? " stroom-item--hulp" : "")}>
              <span className="stroom-punt" />
              <div className="stroom-kaart">
                <span className="stroom-week">{t.week}</span>
                <strong>{t.titel}</strong>
                <span className="stroom-datum">{w.van ? <>{datumTekst(w.van)} – {datumTekst(w.datum)}</> : <>{w.tekst} {datumTekst(w.datum)}</>}</span>
                {t.kern && <span className="stroom-kern">{t.kern}</span>}
              </div>
            </li>
          );
        })}
      </ol>
      {uitgebreid && (
        <div className="stroom-uitdienst">
          <strong>Ziek uit dienst?</strong>
          {UIT_DIENST.map((t) => <span key={t.titel}><b>{t.week}:</b> {t.titel.toLowerCase()}</span>)}
        </div>
      )}
      <footer className="stroom-voet">
        <p><span className="stroom-teken" /> Hulp nodig bij deze stap? Chris Schepers, casemanager verzuim, begeleidt en ondersteunt je graag: {CONTACT_MAIL} · poortwachtercheck.nl</p>
        <p>De datums zijn een richtlijn, gerekend vanaf de eerste ziektedag als dag 1. Het oordeel ligt altijd bij UWV.</p>
      </footer>
    </section>
  );
}

const vandaagUTC = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
};

export function TermijnenTool() {
  const [waarde, setWaarde] = useState("");
  const [uitgebreid, setUitgebreid] = useState(false);
  const start = leesDatum(waarde);
  const vandaag = start ? vandaagUTC() : null;
  const lijst = TERMIJNEN.filter((t) => uitgebreid || !t.uitgebreid);

  return (
    <div className="termijnen">
      <form className="termijnen-invoer" onSubmit={(e) => e.preventDefault()}>
        <div className="veld">
          <label htmlFor="eerste-ziektedag">Eerste ziektedag</label>
          <input id="eerste-ziektedag" type="date" value={waarde} onChange={(e) => setWaarde(e.target.value)} />
        </div>
        <fieldset className="weergave">
          <legend>Weergave</legend>
          <label><input type="radio" name="weergave" checked={!uitgebreid} onChange={() => setUitgebreid(false)} /> Vereenvoudigd</label>
          <label><input type="radio" name="weergave" checked={uitgebreid} onChange={() => setUitgebreid(true)} /> Uitgebreid</label>
        </fieldset>
      </form>

      <p className="termijnen-status" aria-live="polite">
        {start
          ? <>Termijnen bij een eerste ziektedag op {datumTekst(start)}.</>
          : <>Vul de eerste ziektedag in, dan zie je bij elke stap de datum.</>}
      </p>

      <ol className="termijnen-lijst">
        {lijst.map((t) => <Termijn key={t.titel} t={t} start={start} vandaag={vandaag} />)}
      </ol>

      {uitgebreid && (
        <section className="termijnen-uitdienst" aria-labelledby="uitdienst-kop">
          <h2 id="uitdienst-kop">Gaat je werknemer ziek uit dienst?</h2>
          <p>Wat je dan aan UWV aanlevert, hangt af van de week waarin het dienstverband eindigt.</p>
          <ol className="termijnen-lijst">
            {UIT_DIENST.map((t) => <Termijn key={t.titel} t={t} start={start} vandaag={null} />)}
          </ol>
        </section>
      )}

      {start && <Stroomschema lijst={lijst} start={start} uitgebreid={uitgebreid} />}

      {start && (
        <p className="termijnen-print">
          <button type="button" className="btn btn--quiet" onClick={() => window.print()}>Afdrukken of opslaan als pdf</button>
        </p>
      )}
    </div>
  );
}

export const TERMIJNEN_PAGINA = {
  slug: TERMIJNEN_SLUG,
  kort: "Termijnen berekenen",
  seoTitel: "Wet poortwachter termijnen berekenen vanaf de eerste ziektedag",
  beschrijving: "Vul de eerste ziektedag in en zie alle termijnen van de Wet poortwachter met datum: probleemanalyse, plan van aanpak, eerstejaarsevaluatie, spoor 2 en WIA.",
  h1: "Wet poortwachter: termijnen berekenen",
  lead: "Vul de eerste ziektedag van je werknemer in. Je ziet dan alle termijnen van de Wet verbetering poortwachter met de datum erbij, op volgorde.",
};

export function TermijnenPagina({ bijgewerkt }) {
  const p = TERMIJNEN_PAGINA;
  return (
    <div className="site">
      <Nav basis="/" />
      <main>
        <article className="artikel artikel--breed">
          <header className="container artikel-kop">
            <nav className="kruimel" aria-label="Kruimelpad">
              <a href="/">Poortwachtercheck</a> <span aria-hidden="true">/</span> <span>{p.kort}</span>
            </nav>
            <h1>{p.h1}</h1>
            <p className="lead">{p.lead}</p>
            <p className="artikel-meta">
              Door <a href="/#contact">Chris Schepers</a>, arbeidsdeskundige i.o. Bijgewerkt op{" "}
              <time dateTime={bijgewerkt.iso}>{bijgewerkt.tekst}</time>.
            </p>
          </header>
          <div className="container" id="termijnen-root"><TermijnenTool /></div>
          <div className="container artikel-tekst termijnen-noot">
            <h2>Goed om te weten</h2>
            <p>
              De datums zijn een richtlijn. Ze rekenen vanaf de eerste ziektedag als dag 1 van week 1. Was je werknemer
              tussendoor korter dan vier weken beter, dan tellen de ziekteperiodes bij elkaar op en schuiven de datums op.
              Een termijn die net in het weekend valt, schuift niet mee.
            </p>
            <p>
              Op tijd zijn is niet genoeg. UWV kijkt aan het eind vooral of er genoeg is gedaan om je werknemer weer aan het
              werk te helpen, en of dat goed is vastgelegd. Het oordeel ligt altijd bij UWV.
            </p>
            <p>
              Er wordt niets opgeslagen of verstuurd: de datums worden alleen in je eigen browser uitgerekend. Wil je weten
              wat er bij elke stap in het dossier moet staan? Lees <a href="/wet-poortwachter/">alle stappen van de Wet poortwachter</a>.
            </p>
          </div>
        </article>
      </main>
      <Footer basis="/" />
    </div>
  );
}

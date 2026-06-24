/* Landing page sections */

import { I, CASE, INITIAL_FIELDS } from "./data.jsx";
import { computeSchema } from "./engine.js";
import { AdviesPreview, PvaPreview, BerichtPreview } from "./previews.jsx";

const { useState } = React;

function Nav({ onOpenTool, session, onOpenLogin, onLogout, onOpenAccount }) {
  const email = session && session.user ? session.user.email : "";
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="brand" href="#top">
          <span className="mark">{I.doc}</span>
          <span>planvanaanpak<span className="tld">invuller.nl</span></span>
        </a>
        <nav className="nav-links">
          <a href="#hoe">Hoe het werkt</a>
          <a href="#aanpak">Aanpak</a>
          <a href="#privacy">Privacy</a>
          <a href="#faq">Veelgestelde vragen</a>
        </nav>
        <div className="nav-cta">
          {session
            ? <span className="nav-account"><button className="btn btn-quiet" onClick={onOpenAccount} title={email}>Mijn account</button><button className="btn btn-quiet" onClick={onLogout}>Uitloggen</button></span>
            : <button className="btn btn-quiet" onClick={onOpenLogin}>Inloggen</button>}
          <button className="btn btn-primary" onClick={onOpenTool}>Probeer de invuller</button>
        </div>
      </div>
    </header>
  );
}

function Hero({ onOpenTool }) {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="reveal">
          <span className="eyebrow"><span className="dot"></span>Wet verbetering poortwachter</span>
          <h1>Het concept Plan van Aanpak, automatisch ingevuld.</h1>
          <p className="lead">
            Upload de terugkoppeling van de bedrijfsarts. Je krijgt een ingevuld
            concept-PvA, een opbouwadvies en een begeleidend bericht terug — jij
            controleert en stelt vast. Geen overtypen meer.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onOpenTool}>
              Probeer de PvA-invuller {I.arrowRight}
            </button>
            <a className="btn btn-ghost btn-lg" href="#demo">Demo aanvragen</a>
          </div>
          <div className="hero-trust">
            <span>{I.shield} AVG / DPIA-proof</span>
            <span>{I.server} EER-hosting</span>
            <span>{I.lock} Geen training op klantdata</span>
          </div>
        </div>
        <div className="hero-visual reveal">
          <HeroTeaser />
        </div>
      </div>
    </section>
  );
}

// Subtiele hero-teaser: een echt-ogend stukje resultaat (opbouwadvies) i.p.v. een
// schematisch plaatje. Puur client-side, geen backend.
function HeroTeaser() {
  const schema = computeSchema(CASE);
  return (
    <div className="hero-teaser">
      <div className="ht-bar"><span className="ht-dot"></span>Concept · automatisch ingevuld</div>
      <div className="ht-title">Opbouwadvies — J. de Vries</div>
      <table className="ht-table"><tbody>
        {schema.slice(0, 5).map((r, i) => (
          <tr key={i}><td>{r.date}</td><td>{r.hours} uur/week</td><td className="ht-pct">{r.pct}%</td></tr>
        ))}
      </tbody></table>
      <a className="ht-link" href="#voorbeeld">Bekijk het volledige voorbeeld {I.arrowRight}</a>
    </div>
  );
}

// Statische voorbeeldcasus (J. de Vries) voor het showcase-blok — rendert de
// bestaande preview-componenten client-side; geen backend en geen credits.
const VOORBEELD_FUNCTIE = "Administratief medewerker: postverwerking, gegevensinvoer, factuurcontrole, archiefbeheer en telefonische klantvragen.";
const VOORBEELD_TAAK = "lichte administratieve taken zoals gegevensinvoer en het ordenen van dossiers, in blokken van beperkte duur met afwisseling tussen zitten en staan, en zonder taken met piekbelasting of strakke deadlines";
function voorbeeldCasus() {
  return {
    fields: INITIAL_FIELDS, schema: computeSchema(CASE), reportDate: CASE.reportDate,
    functieomschrijving: VOORBEELD_FUNCTIE, taaksuggestie: VOORBEELD_TAAK,
    signalen: {}, schemaZelfOpgesteld: false, opbouwReden: "",
  };
}

function Showcase() {
  const [tab, setTab] = useState(0);
  const c = voorbeeldCasus();
  const tabs = [
    { t: "Opbouwadvies", el: <AdviesPreview fields={c.fields} schema={c.schema} reportDate={c.reportDate} schemaZelfOpgesteld={c.schemaZelfOpgesteld} opbouwReden={c.opbouwReden} /> },
    { t: "Plan van Aanpak", el: <PvaPreview fields={c.fields} schema={c.schema} functieomschrijving={c.functieomschrijving} opbouwReden={c.opbouwReden} signalen={c.signalen} /> },
    { t: "Begeleidend bericht", el: <BerichtPreview fields={c.fields} schema={c.schema} reportDate={c.reportDate} taaksuggestie={c.taaksuggestie} signalen={c.signalen} schemaZelfOpgesteld={c.schemaZelfOpgesteld} opbouwReden={c.opbouwReden} /> },
  ];
  return (
    <section className="section showcase" id="voorbeeld">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow"><span className="dot"></span>Voorbeeldresultaat</span>
          <h2>Zo ziet het ingevulde concept eruit</h2>
          <p>Automatisch gegenereerd uit een fictieve terugkoppeling — geen echte gegevens.</p>
        </div>
        <div className="showcase-frame reveal">
          <div className="preview-tabs">
            {tabs.map((tb, i) => (
              <button key={i} className={tab === i ? "active" : ""} onClick={() => setTab(i)}>
                <span className="tnum">{i + 1}</span><span className="txt">{tb.t}</span>
              </button>
            ))}
          </div>
          <div className="showcase-doc">{tabs[tab].el}</div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  { n: 1, icon: I.upload, t: "Upload", d: "Sleep de terugkoppeling van de bedrijfsarts erin — PDF of Word." },
  { n: 2, icon: I.sparkles, t: "Automatisch invullen", d: "De tool leest de functionele gegevens uit en bouwt het concept op." },
  { n: 3, icon: I.eye, t: "Controleren", d: "Per veld zie je de bronpassage. Jij corrigeert en vult ontbrekende velden aan." },
  { n: 4, icon: I.download, t: "Downloaden", d: "Stel vast en download het resultaat als Word-document." },
];

function HowItWorks() {
  return (
    <section className="section" id="hoe">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow"><span className="dot"></span>Hoe het werkt</span>
          <h2>Van terugkoppeling naar concept in vier stappen</h2>
          <p>Eén document erin, een gecontroleerd concept eruit. Jij houdt de regie.</p>
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <div className="step reveal" key={s.n}>
              <div className="line"></div>
              <div className="num">{s.n}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const USPS = [
  { icon: I.clock, accent: false, t: "Bespaart tijd", d: "Geen overtypen meer uit de terugkoppeling. Een concept-PvA dat normaal een half uur kost, staat er in minuten — inclusief opbouwschema." },
  { icon: I.filter, accent: true, t: "Privacy by design", d: "Medische en bijzondere gegevens worden er juist uitgefilterd. Alleen functionele gegevens — belastbaarheid, uren, prognose — komen in het PvA." },
  { icon: I.eye, accent: false, t: "Mens in de loop", d: "Per veld tonen we de bronpassage uit het document, zodat je alles in één oogopslag kunt controleren vóór vaststellen." },
  { icon: I.shield, accent: true, t: "AVG / DPIA-proof", d: "Verwerkersovereenkomst, EER-hosting en DPIA beschikbaar. We trainen geen modellen op jouw klantdata." },
];

function USP() {
  return (
    <section className="section tint">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow"><span className="dot"></span>Waarom deze tool</span>
          <h2>Sneller klaar, zonder concessies aan privacy</h2>
        </div>
        <div className="usp">
          {USPS.map((u, i) => (
            <div className={"usp-card card reveal" + (u.accent ? " accent" : "")} key={i}>
              <span className="ico">{u.icon}</span>
              <div>
                <h3>{u.t}</h3>
                <p>{u.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Hybrid() {
  return (
    <section className="section" id="aanpak">
      <div className="wrap">
        <div className="sec-head reveal" style={{ maxWidth: 720 }}>
          <span className="eyebrow"><span className="dot"></span>Wat je krijgt</span>
          <h2>Eén document erin — praktisch advies en het invulwerk eruit</h2>
          <p>
            Je uploadt de terugkoppeling van de bedrijfsarts. Daaruit krijg je praktische
            adviezen over de volgende stappen, én het administratieve werk al ingevuld:
            een concept-Plan van Aanpak, een opbouwschema en een begeleidend bericht.
          </p>
        </div>
        <div className="hybrid reveal">
          <div className="hybrid-col ai">
            <span className="tag">Praktische adviezen</span>
            <h3>Weten wat je nu moet doen</h3>
            <p>Concrete adviezen die passen bij deze situatie: welke stappen en termijnen eraan komen en waar je op moet letten — zoals de no-riskpolis of een ziekmelding uit dienst.</p>
            <ul>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--navy)" } })}<span>Wat er nu speelt en wanneer</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--navy)" } })}<span>Aandachtspunten die vaak gemist worden</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--navy)" } })}<span>Afgestemd op deze terugkoppeling</span></li>
            </ul>
          </div>
          <div className="hybrid-col engine">
            <span className="tag">Administratieve ondersteuning</span>
            <h3>Het invulwerk is al gedaan</h3>
            <p>Je hoeft niets meer over te typen. Je krijgt een ingevuld concept-Plan van Aanpak (het UWV-formulier), een opbouwschema met datums en uren, een begeleidend bericht en een tijdlijn van het hele verzuim — klaar om samen met je werknemer vast te stellen.</p>
            <ul>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--accent-700)" } })}<span>Ingevuld concept-Plan van Aanpak (UWV-formulier)</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--accent-700)" } })}<span>Opbouwschema met datums en uren</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--accent-700)" } })}<span>Begeleidend bericht, klaar om te delen</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--accent-700)" } })}<span>Tijdlijn van het verzuim — alle mijlpalen tot einde wachttijd</span></li>
            </ul>
          </div>
        </div>
        <p className="reveal" style={{ marginTop: 20, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
          Medische gegevens blijven er bewust buiten en cijfers worden niet verzonnen, maar volgens vaste regels berekend.
        </p>
      </div>
    </section>
  );
}

const COMP = [
  { icon: I.scale, t: "Wet verbetering poortwachter", d: "Het concept volgt de structuur van het wettelijke Plan van Aanpak." },
  { icon: I.filter, t: "Privacy by design", d: "Bijzondere persoonsgegevens worden niet overgenomen in het PvA." },
  { icon: I.doc, t: "Verwerkersovereenkomst", d: "Standaard verwerkersovereenkomst beschikbaar voor je organisatie." },
  { icon: I.shield, t: "DPIA beschikbaar", d: "Data protection impact assessment op te vragen voor je inkoop." },
];

function Compliance({ onOpenPrivacy }) {
  return (
    <section className="section tint" id="privacy">
      <div className="wrap compliance">
        <div className="reveal">
          <span className="eyebrow"><span className="dot"></span>Vertrouwen & compliance</span>
          <h2 style={{ fontSize: "clamp(27px,3.2vw,38px)", marginTop: 14 }}>Gebouwd voor gevoelige gegevens</h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 18, marginTop: 14 }}>
            Werken met verzuim betekent werken met bijzondere persoonsgegevens. Daarom
            is privacy hier geen sluitstuk, maar het uitgangspunt.
          </p>
          <div className="comp-list">
            {COMP.map((c, i) => (
              <div className="comp-item" key={i}>
                <span className="ico">{c.icon}</span>
                <div>
                  <h4>{c.t}</h4>
                  <p>{c.d}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-quiet" style={{ marginTop: 22 }}
            onClick={(e) => { e.preventDefault(); onOpenPrivacy && onOpenPrivacy(); }}>
            Lees de privacyverklaring & AI-transparantie {I.arrowRight}
          </button>
          <p className="comp-disclaimer">
            De tool levert een <strong>concept</strong>; jij stelt het samen met je werknemer vast.
            Ben je <strong>eigenrisicodrager</strong> voor de Ziektewet of de WGA, dan gelden
            aanvullende of afwijkende regels — ga in dat geval niet af op de gegenereerde adviezen
            en raadpleeg je eigen verzuim- of arbospecialist.
          </p>
        </div>
        <div className="badge-stack reveal">
          <div className="badge">
            <span className="ico" style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,.12)", display: "grid", placeItems: "center" }}>{I.server}</span>
            <div>
              <div className="big">EER-hosting</div>
              <div className="sub">Verwerking en opslag binnen de Europese Economische Ruimte.</div>
            </div>
          </div>
          <div className="badge alt">
            <span className="ico" style={{ width: 46, height: 46, borderRadius: 12, background: "var(--accent-50)", color: "var(--accent-700)", display: "grid", placeItems: "center" }}>{I.lock}</span>
            <div>
              <div className="big" style={{ color: "var(--navy-900)" }}>Geen modeltraining</div>
              <div className="sub">Je documenten worden nooit gebruikt om modellen te trainen.</div>
            </div>
          </div>
          <div className="badge alt">
            <span className="ico" style={{ width: 46, height: 46, borderRadius: 12, background: "var(--navy-50)", color: "var(--navy)", display: "grid", placeItems: "center" }}>{I.clock}</span>
            <div>
              <div className="big" style={{ color: "var(--navy-900)" }}>Korte bewaartermijn</div>
              <div className="sub">Bestanden worden na verwerking automatisch verwijderd.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Welke gegevens komen wél en niet in het Plan van Aanpak?", a: "Alleen functionele gegevens: belastbaarheid, inzetbare uren, werkaanpassingen en prognose. Medische informatie zoals diagnose, klachten of behandeling wordt herkend en juist niet overgenomen — die hoort niet thuis in een Plan van Aanpak." },
  { q: "Wie is verwerkingsverantwoordelijke?", a: "Jij, als werkgever, blijft verwerkingsverantwoordelijke voor de re-integratiegegevens. Wij zijn verwerker en handelen uitsluitend in jouw opdracht, vastgelegd in een verwerkersovereenkomst." },
  { q: "Hoe lang worden mijn documenten bewaard?", a: "Het geüploade bestand en de tussenresultaten worden uitsluitend bewaard zolang nodig om jouw concept te genereren, en daarna automatisch verwijderd. Het eindresultaat beheer je zelf in je eigen systemen." },
  { q: "Wordt er met mijn data een model getraind?", a: "Nee. Je documenten en gegevens worden nooit gebruikt om AI-modellen te trainen of te verbeteren. Verwerking vindt plaats binnen de EER." },
  { q: "Wat doet de tool nadrukkelijk níet?", a: "De tool stelt geen Plan van Aanpak vast en neemt geen beslissingen. Het levert een concept dat je verplicht zelf controleert, corrigeert en vaststelt. Het vervangt geen bedrijfsarts, casemanager of arbeidsdeskundige." },
  { q: "Kan ik de gegenereerde tekst aanpassen?", a: "Ja. Elk veld is bewerkbaar en ontbrekende velden markeren we duidelijk als [INVULLEN]. Pas aan wat nodig is en download daarna het definitieve Word-document." },
];

function Faq() {
  const [open, setOpen] = React.useState(0);
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow"><span className="dot"></span>Veelgestelde vragen</span>
          <h2>Helder over privacy en verantwoordelijkheid</h2>
        </div>
        <div className="faq">
          {FAQS.map((f, i) => (
            <div className={"faq-item reveal" + (open === i ? " open" : "")} key={i}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {f.q}<span className="chev">{I.chevDown}</span>
              </button>
              <div className="faq-a" style={{ maxHeight: open === i ? 240 : 0 }}>
                <div className="faq-a-inner">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand({ onOpenTool }) {
  return (
    <section className="section" id="demo">
      <div className="wrap">
        <div className="cta-band reveal">
          <h2>Probeer de PvA-invuller met een voorbeeldcasus</h2>
          <p>Bekijk in een paar minuten hoe upload, controle en download werken — met de voorbeeldcasus J. de Vries. Geen account nodig.</p>
          <div className="hero-cta">
            <button className="btn btn-accent btn-lg" onClick={onOpenTool}>Start de demo {I.arrowRight}</button>
            <a className="btn btn-ghost btn-lg" href="mailto:demo@planvanaanpakinvuller.nl">Plan een demo met ons</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ onOpenPrivacy }) {
  const openPrivacy = (e) => { e.preventDefault(); onOpenPrivacy && onOpenPrivacy(); };
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <a className="brand" href="#top" style={{ marginBottom: 14 }}>
              <span className="mark">{I.doc}</span>
              <span>planvanaanpak<span className="tld">invuller.nl</span></span>
            </a>
            <p style={{ fontSize: 14.5, maxWidth: "34ch", color: "rgba(255,255,255,.6)" }}>
              Concept Plannen van Aanpak invullen volgens de Wet verbetering
              poortwachter — privacy by design, mens in de loop.
            </p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#hoe">Hoe het werkt</a>
            <a href="#aanpak">Hybride aanpak</a>
            <a href="#demo">Demo aanvragen</a>
          </div>
          <div>
            <h4>Vertrouwen</h4>
            <a href="#privacy">Privacy & AVG</a>
            <a href="#privacyverklaring" onClick={openPrivacy}>Privacyverklaring &amp; AI</a>
            <a href="mailto:contact@planvanaanpakinvuller.nl?subject=Verwerkersovereenkomst">Verwerkersovereenkomst</a>
            <a href="mailto:contact@planvanaanpakinvuller.nl?subject=DPIA%20opvragen">DPIA opvragen</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="mailto:contact@planvanaanpakinvuller.nl">contact@planvanaanpakinvuller.nl</a>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>planvanaanpakinvuller.nl</span>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>KVK-nummer volgt</span>
          </div>
        </div>
        <div className="footer-bot">
          <span>© 2026 planvanaanpakinvuller.nl · KVK-nummer volgt</span>
          <span>Verwerking binnen de EER · Geen training op klantdata</span>
        </div>
      </div>
    </footer>
  );
}

export function Landing({ onOpenTool, onOpenPrivacy, session, onOpenLogin, onLogout, onOpenAccount }) {
  return (
    <div className="site">
      <Nav onOpenTool={onOpenTool} session={session} onOpenLogin={onOpenLogin} onLogout={onLogout} onOpenAccount={onOpenAccount} />
      <Hero onOpenTool={onOpenTool} />
      <HowItWorks />
      <Showcase />
      <USP />
      <Hybrid />
      <Compliance onOpenPrivacy={onOpenPrivacy} />
      <Faq />
      <CtaBand onOpenTool={onOpenTool} />
      <Footer onOpenPrivacy={onOpenPrivacy} />
    </div>
  );
}


/* Landing page sections */

import { I } from "./data.jsx";

function Nav({ onOpenTool, session, onOpenLogin, onLogout }) {
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
            ? <span className="nav-account"><span className="who" title={email}>{email || "Ingelogd"}</span><button className="btn btn-quiet" onClick={onLogout}>Uitloggen</button></span>
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
          <HeroDiagram />
        </div>
      </div>
    </section>
  );
}

function HeroDiagram() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center" }}>
      <div className="doc-card">
        <div className="doc-head">
          <span className="ico" style={{ background: "var(--flag-bg)", color: "var(--flag-text)" }}>{I.doc}</span>
          Terugkoppeling bedrijfsarts
        </div>
        <div className="skline w85"></div>
        <div className="skline hl w70"></div>
        <div className="skline redact w55"></div>
        <div className="skline hl w90"></div>
        <div className="skline w40"></div>
        <div className="skline redact w70"></div>
        <div className="skline hl w55"></div>
      </div>
      <div className="flow-arrow">{I.arrowRight}</div>
      <div className="doc-card" style={{ borderColor: "var(--accent-100)" }}>
        <div className="doc-head">
          <span className="ico" style={{ background: "var(--accent-50)", color: "var(--accent-700)" }}>{I.check}</span>
          Concept Plan van Aanpak
        </div>
        <div className="skline w90"></div>
        <div className="skline w70"></div>
        <div className="skline w85"></div>
        <div style={{ display: "flex", gap: 6, margin: "12px 0 6px" }}>
          <div className="pill pill-ok" style={{ fontSize: 11 }}><span className="pdot"></span>Ingevuld</div>
          <div className="pill pill-amber" style={{ fontSize: 11 }}>Bron getoond</div>
        </div>
        <div className="skline w55"></div>
        <div className="skline w70"></div>
      </div>
    </div>
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
          <span className="eyebrow"><span className="dot"></span>Hybride aanpak</span>
          <h2>AI extraheert, een vaste rekenmotor bouwt</h2>
          <p>
            Het taalmodel leest alleen de feiten uit de terugkoppeling. Het rekenwerk —
            het opbouwschema, de data, de percentages — doet een vaste rekenmotor.
            Voorspelbaar en controleerbaar, zonder verzinsels.
          </p>
        </div>
        <div className="hybrid reveal">
          <div className="hybrid-col ai">
            <span className="tag">Stap A · AI-extractie</span>
            <h3>Leest de functionele feiten uit</h3>
            <p>Het model herkent waar belastbaarheid, uren en prognose staan en haalt die gestructureerd op — met verwijzing naar de bronpassage.</p>
            <ul>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--navy)" } })}<span>Herkent functionele gegevens in PDF of Word</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--navy)" } })}<span>Filtert medische en bijzondere gegevens eruit</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--navy)" } })}<span>Bewaart per veld de exacte bronpassage</span></li>
            </ul>
          </div>
          <div className="hybrid-col engine">
            <span className="tag">Stap B · Rekenmotor</span>
            <h3>Bouwt het schema volgens vaste regels</h3>
            <p>Een deterministische motor zet de uitgangspunten om in een opbouwschema met data en herstelpercentages. Zelfde input, zelfde uitkomst.</p>
            <ul>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--accent-700)" } })}<span>Berekent data, uren en percentages exact</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--accent-700)" } })}<span>Geen gegenereerde cijfers of aannames</span></li>
              <li>{React.cloneElement(I.checkSm, { style: { color: "var(--accent-700)" } })}<span>Volledig herleidbaar en reproduceerbaar</span></li>
            </ul>
          </div>
        </div>
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

export function Landing({ onOpenTool, onOpenPrivacy, session, onOpenLogin, onLogout }) {
  return (
    <div className="site">
      <Nav onOpenTool={onOpenTool} session={session} onOpenLogin={onOpenLogin} onLogout={onLogout} />
      <Hero onOpenTool={onOpenTool} />
      <HowItWorks />
      <USP />
      <Hybrid />
      <Compliance onOpenPrivacy={onOpenPrivacy} />
      <Faq />
      <CtaBand onOpenTool={onOpenTool} />
      <Footer onOpenPrivacy={onOpenPrivacy} />
    </div>
  );
}


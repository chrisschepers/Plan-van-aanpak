/* Startpagina: de dossiercheck van het re-integratieverslag (Poortwachtercheck). */

import { I } from "./data.jsx";
import { Merk, MERK, CONTACT_MAIL, mailto, naarInvuller } from "./merk.jsx";

const { useState } = React;

function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Merk />
        <nav className="nav-links">
          <a href={naarInvuller()}>{I.doc} Plan van aanpak invullen</a>
          <a href="#contact">{I.mail} Contact</a>
        </nav>
      </div>
      <Melding />
    </header>
  );
}

// Smalle balk onder de kop: de opbouw lijkt op die van een overheidssite, dus
// moet meteen duidelijk zijn dat dit een zelfstandige dienst is.
export function Melding() {
  return (
    <div className="melding">
      <div className="wrap">{I.info}<span><strong>Zelfstandige dienst.</strong> Poortwachtercheck is geen onderdeel van UWV.</span></div>
    </div>
  );
}

const DIRECT = [
  { t: "Dossier laten nakijken", h: "#contact" },
  { t: "Zelf de snelle check doen", h: "#checklist" },
  { t: "Data berekenen vanaf de eerste ziektedag", h: "#data" },
  { t: "Werkwijze", h: "#werkwijze" },
  { t: "Tarieven", h: "#tarieven" },
  { t: "Veelgestelde vragen", h: "#faq" },
];

function DirectNaar() {
  return (
    <section className="section smal" id="direct">
      <div className="wrap">
        <h2 className="kop">Direct naar</h2>
        <div className="direct">
          {DIRECT.map((d, i) => <a key={i} href={d.h}><span>{d.t}</span>{I.arrowRight}</a>)}
          <a href={naarInvuller()}><span>Plan van aanpak invullen</span>{I.arrowRight}</a>
        </div>
      </div>
    </section>
  );
}

// Voorbeeld van wat een dossiercheck oplevert: één blik op wat er is en wat mist.
const VOORBEELD = [
  { t: "Probleemanalyse", ok: true },
  { t: "Plan van aanpak, ondertekend", ok: true },
  { t: "Eerstejaarsevaluatie", ok: false, n: "ontbreekt" },
  { t: "Actueel oordeel bedrijfsarts", ok: true },
  { t: "Eindevaluatie", ok: false, n: "handtekening werknemer mist" },
];

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-grid">
        <div className="reveal">
          <div className="kop-balk">
            <h1>Je re-integratieverslag compleet naar UWV</h1>
            <p className="lead lead-breed">
              Is je werknemer bijna twee jaar ziek? Ik kom langs, loop het verzuimdossier na
              en zorg dat het verslag volledig en ondertekend klaarligt.
            </p>
          </div>
          <div className="hero-cta">
            <a className="btn btn-primary btn-lg" href="#contact">Dossier laten nakijken</a>
            <a className="btn btn-ghost btn-lg" href="#checklist">Doe zelf de snelle check</a>
          </div>
          <div className="hero-trust">
            <span>{I.checkSm} Vaste prijs per dossier</span>
            <span>{I.building} Bij jou op locatie</span>
            <span>{I.lock} Medische stukken blijven bij de bedrijfsarts</span>
          </div>
        </div>
        <div className="hero-visual reveal">
          <div className="dossier-kaart">
            <div className="dk-kop"><span className="ht-dot"></span>Voorbeeld van een dossiercheck</div>
            <ul>
              {VOORBEELD.map((v, i) => (
                <li key={i} className={v.ok ? "ok" : "mis"}>
                  <span className="dk-ico">{v.ok ? I.checkSm : I.x}</span>
                  <span className="dk-t">{v.t}</span>
                  {!v.ok && <span className="pill pill-flag">{v.n}</span>}
                </li>
              ))}
            </ul>
            <div className="dk-voet">2 punten om te herstellen vóór de WIA-aanvraag</div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CIJFERS = [
  { g: "ruim 4.000", t: "loonsancties legde UWV op in 2024" },
  { g: "± 45%", t: "daarvan was administratief: het verslag was niet compleet" },
  { g: "3 + 6 weken", t: "kost herstel al snel: 3 weken beoordeling door UWV, daarna loopt het loon nog 6 weken door" },
];

function Probleem() {
  return (
    <section className="section tint" id="waarom">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow"><span className="dot"></span>Waarom dit ertoe doet</span>
          <h2>Een ontbrekend stuk kan maanden loon kosten</h2>
          <p>
            UWV kijkt eerst of het re-integratieverslag compleet is, en pas daarna naar de
            inhoud. Mist er een onderdeel of een handtekening, dan volgt een administratieve
            loonsanctie: je betaalt het loon langer door, tot het verslag in orde is.
          </p>
        </div>
        <div className="cijfers">
          {CIJFERS.map((c, i) => (
            <div className="cijfer card reveal" key={i}>
              <div className="cijfer-g">{c.g}</div>
              <p>{c.t}</p>
            </div>
          ))}
        </div>
        <p className="bron reveal">
          Cijfers: <a href="https://uwvjaarverslag.nl/external/asset/download/project/f9b7da0a-03ec-0000-58b5-7efa5990235f/name/uwv-kwantitatieve-Informatie-2025T3%202.0.pdf" target="_blank" rel="noopener">UWV, kwantitatieve informatie</a>.
          Herstel en doorlooptijd: <a href="https://www.rijksoverheid.nl/documenten/publicaties/2024/09/30/werkproces-uwv-toetsen-riv-en-opleggen-loonsanctie" target="_blank" rel="noopener">werkproces UWV toetsen re-integratieverslag</a>.
          Dit soort sanctie is te voorkomen, omdat het om volledigheid gaat en niet om een oordeel over de re-integratie.
        </p>
      </div>
    </section>
  );
}

// Onderdelen van het re-integratieverslag. Aanvinken = aanwezig (of niet van toepassing).
const ONDERDELEN = [
  { id: "pa", t: "Probleemanalyse van de bedrijfsarts", s: "Rond week 6, plus latere bijstellingen" },
  { id: "pva", t: "Plan van aanpak", s: "Rond week 8, door jou en je werknemer ondertekend" },
  { id: "bij", t: "Bijstellingen en evaluaties van het plan van aanpak", s: "Elke keer dat de situatie veranderde" },
  { id: "ej", t: "Eerstejaarsevaluatie", s: "Rond week 52" },
  { id: "ad", t: "Arbeidsdeskundig onderzoek en verslagen tweede spoor", s: "Als die er zijn geweest" },
  { id: "ao", t: "Actueel oordeel van de bedrijfsarts", s: "Opgesteld voor de eindevaluatie" },
  { id: "ee", t: "Eindevaluatie", s: "Door jou en je werknemer ingevuld en ondertekend" },
  { id: "wn", t: "Oordeel van je werknemer", s: "Zijn of haar eigen kijk op de re-integratie" },
  { id: "med", t: "Medische informatie is door de bedrijfsarts verstuurd", s: "Rechtstreeks naar UWV of je werknemer; jij krijgt die niet te zien" },
];

function fmt(d) {
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}
function plusWeken(iso, w) {
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d)) return null;
  d.setDate(d.getDate() + w * 7);
  return d;
}

const MOMENTEN = [
  { w: 87, t: "UWV stuurt je werknemer de WIA-brief", s: "Het moment om de eindevaluatie te starten" },
  { w: 91, t: "Verslag klaar en bij je werknemer", s: "Eindevaluatie gedaan, alles ondertekend" },
  { w: 93, t: "Uiterste datum WIA-aanvraag", s: "Je werknemer dient de aanvraag met het verslag in" },
  { w: 104, t: "Einde van de twee jaar", s: "De loondoorbetaling stopt, tenzij UWV een sanctie oplegt" },
];

function Checklist() {
  const [aan, setAan] = useState({});
  const [dag, setDag] = useState("");
  const wissel = (id) => setAan((a) => ({ ...a, [id]: !a[id] }));
  const mist = ONDERDELEN.filter((o) => !aan[o.id]);
  const begonnen = mist.length < ONDERDELEN.length;
  const data = dag ? MOMENTEN.map((m) => ({ ...m, d: plusWeken(dag, m.w) })).filter((m) => m.d) : [];

  const tekst = [
    "Ik wil graag mijn verzuimdossier laten nakijken.",
    "",
    dag ? "Eerste ziektedag: " + fmt(new Date(dag + "T12:00:00")) : "Eerste ziektedag:",
    "",
    "Dit ontbreekt volgens de snelle check:",
    ...(mist.length ? mist.map((o) => "- " + o.t) : ["- niets, ik wil een controle voor de zekerheid"]),
    "",
    "Bedrijfsnaam en plaats:",
    "Telefoonnummer:",
  ].join("\n");

  return (
    <section className="section" id="checklist">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow"><span className="dot"></span>Snelle check</span>
          <h2>Wat hoort er in het re-integratieverslag?</h2>
          <p>Vink aan wat je al hebt, of wat in jouw situatie niet speelt. Je ziet meteen wat er nog mist. Er wordt niets opgeslagen of verstuurd.</p>
        </div>
        <div className="check-grid">
          <div className="check-lijst card reveal">
            {ONDERDELEN.map((o) => (
              <label className={"check-rij" + (aan[o.id] ? " aan" : "")} key={o.id}>
                <input type="checkbox" checked={!!aan[o.id]} onChange={() => wissel(o.id)} />
                <span className="check-vak">{I.checkSm}</span>
                <span>
                  <span className="check-t">{o.t}</span>
                  <span className="check-s">{o.s}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="check-zij">
            <div className={"check-uitkomst card reveal" + (begonnen && !mist.length ? " goed" : "")}>
              {!begonnen && <React.Fragment><h3>Nog niets aangevinkt</h3><p>Loop de lijst door met het dossier erbij.</p></React.Fragment>}
              {begonnen && mist.length > 0 && (
                <React.Fragment>
                  <h3>Nog {mist.length} {mist.length === 1 ? "onderdeel" : "onderdelen"} te regelen</h3>
                  <ul>{mist.map((o) => <li key={o.id}>{o.t}</li>)}</ul>
                </React.Fragment>
              )}
              {begonnen && !mist.length && <React.Fragment><h3>De lijst is compleet</h3><p>Controleer nog of elke handtekening en datum erop staat. Dat is waar het vaak misgaat.</p></React.Fragment>}
              <a className="btn btn-primary" href={mailto("Dossiercheck aanvragen", tekst)}>Stuur dit en vraag een dossiercheck aan</a>
              <p className="check-klein">Opent je mailprogramma met deze lijst erin. Zet er geen medische gegevens bij.</p>
            </div>
            <div className="check-data card reveal" id="data">
              <label htmlFor="eerste-dag">Eerste ziektedag</label>
              <input id="eerste-dag" type="date" value={dag} onChange={(e) => setDag(e.target.value)} />
              {data.length > 0
                ? <ul>{data.map((m) => (
                    <li key={m.w}><span className="cd-d">{fmt(m.d)}</span><span className="cd-t">Week {m.w}: {m.t}</span><span className="cd-s">{m.s}</span></li>
                  ))}</ul>
                : <p className="check-klein">Vul de datum in en je ziet wanneer het verslag klaar moet zijn.</p>}
            </div>
          </div>
        </div>
        <p className="bron reveal">
          Deze lijst is een hulpmiddel en geen volledige toets. Welke stukken precies nodig zijn,
          hangt af van het verloop van het verzuim. De data schuiven op als de wachttijd is verlengd.
        </p>
      </div>
    </section>
  );
}

const STAPPEN = [
  { t: "Kennismaken", d: "We bellen kort. Je hoort wat ik nodig heb en wat het kost. De prijs staat vooraf vast." },
  { t: "Dossier nalopen", d: "Ik kom langs en loop het dossier na aan de hand van een vaste lijst: elk onderdeel, elke datum en elke handtekening." },
  { t: "Aanvullen", d: "Je krijgt een lijst met wat ontbreekt. Als je dat wilt, help ik met de eindevaluatie en met het bijwerken van de stukken." },
  { t: "Verzendklaar", d: "Het verslag ligt compleet en ondertekend klaar voor je werknemer, op tijd voor de WIA-aanvraag." },
];

function Werkwijze() {
  return (
    <section className="section tint" id="werkwijze">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow"><span className="dot"></span>Werkwijze</span>
          <h2>Van losse stukken naar een compleet verslag</h2>
          <p>Het beste moment is ruim vóór week 87. Dan is er nog tijd om iets te herstellen.</p>
        </div>
        <div className="steps">
          {STAPPEN.map((s, i) => (
            <div className="step reveal" key={i}>
              <div className="line"></div>
              <div className="num">{i + 1}</div>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PAKKETTEN = [
  {
    naam: "Dossiercheck", prijs: "vanaf € 450", sub: "per dossier, excl. btw",
    d: "Je wilt weten of het verslag compleet is.",
    punten: ["Bezoek op locatie", "Controle van elk onderdeel, elke datum en handtekening", "Heldere lijst met wat ontbreekt en wat je moet doen"],
  },
  {
    naam: "Compleet verzorgd", prijs: "vanaf € 950", sub: "per dossier, excl. btw", uitgelicht: true,
    d: "Je wilt dat het geregeld wordt.",
    punten: ["Alles uit de dossiercheck", "Hulp bij de eindevaluatie en het bijwerken van de stukken", "Bewaken dat de bedrijfsarts de medische informatie verstuurt", "Het verslag verzendklaar voor je werknemer"],
  },
  {
    naam: "Contact met UWV", prijs: "in overleg", sub: "als aanvulling",
    d: "Je wilt een vast aanspreekpunt als UWV vragen heeft.",
    punten: ["Met een machtiging van jou als werkgever", "Ik beantwoord aanvullende vragen over het dossier", "Jij blijft op de hoogte van elk contact"],
  },
];

function Tarieven() {
  return (
    <section className="section" id="tarieven">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow"><span className="dot"></span>Tarieven</span>
          <h2>Een vaste prijs per dossier</h2>
          <p>Geen uurtje-factuurtje. Je weet vooraf wat het kost, en dat is een fractie van één maand doorbetaald loon.</p>
        </div>
        <div className="pakketten">
          {PAKKETTEN.map((p, i) => (
            <div className={"pakket card reveal" + (p.uitgelicht ? " uitgelicht" : "")} key={i}>
              {p.uitgelicht && <span className="pill pill-ok">Alles geregeld</span>}
              <h3>{p.naam}</h3>
              <p className="pakket-d">{p.d}</p>
              <div className="pakket-prijs">{p.prijs}</div>
              <div className="pakket-sub">{p.sub}</div>
              <ul>{p.punten.map((x, j) => <li key={j}>{I.checkSm}<span>{x}</span></li>)}</ul>
              <a className={"btn " + (p.uitgelicht ? "btn-primary" : "btn-ghost")} href={mailto(p.naam + " aanvragen")}>Aanvragen</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const AFSPRAKEN = [
  { icon: I.lock, t: "Ik zie geen medische stukken", d: "Die horen bij de bedrijfsarts. Ik bewaak alleen dat hij ze op tijd naar UWV of je werknemer stuurt." },
  { icon: I.scale, t: "Ik beloof geen uitkomst", d: "Ik zorg dat het verslag compleet is. Of de re-integratie inhoudelijk voldoende was, beoordeelt UWV." },
  { icon: I.doc, t: "Afspraken staan op papier", d: "Je krijgt een verwerkersovereenkomst. Voor contact met UWV teken je een machtiging." },
  { icon: I.shield, t: "Zorgvuldig met het dossier", d: "Ik gebruik de gegevens alleen voor deze opdracht en bewaar ze niet langer dan nodig." },
];

function Afspraken() {
  return (
    <section className="section tint" id="afspraken">
      <div className="wrap compliance">
        <div className="reveal">
          <span className="eyebrow"><span className="dot"></span>Wat je van mij mag verwachten</span>
          <h2 style={{ fontSize: "clamp(27px,3.2vw,38px)", marginTop: 14 }}>Duidelijk over wat ik wel en niet doe</h2>
          <div className="comp-list">
            {AFSPRAKEN.map((c, i) => (
              <div className="comp-item" key={i}>
                <span className="ico">{c.icon}</span>
                <div><h4>{c.t}</h4><p>{c.d}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="over-mij reveal">
          <span className="tag">Wie er langskomt</span>
          <h3>Casemanager verzuim, in opleiding tot arbeidsdeskundige</h3>
          <p>
            Ik werk als casemanager met werkgevers en werknemers bij langdurig verzuim. Ik
            weet waar een dossier op vastloopt en waar UWV op let.
          </p>
          <p>
            Je schakelt mij in voor het laatste stuk: de eindevaluatie en het verslag. Dat
            kan ook als je al een arbodienst hebt.
          </p>
          <a className="btn btn-accent" href="#contact">Plan een kennismaking</a>
        </div>
      </div>
    </section>
  );
}

function InvullerBand() {
  return (
    <section className="section" id="invuller">
      <div className="wrap">
        <div className="invuller-band reveal">
          <div>
            <span className="eyebrow"><span className="dot"></span>Staat je werknemer pas kort ziek?</span>
            <h2>Begin het dossier goed: laat het plan van aanpak invullen</h2>
            <p>
              Upload de terugkoppeling van de bedrijfsarts. Je krijgt een ingevuld concept
              van het UWV-formulier, een opbouwschema en een tijdlijn met alle termijnen.
            </p>
          </div>
          <a className="btn btn-primary btn-lg" href={naarInvuller()}>Plan van aanpak invullen {I.arrowRight}</a>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  { q: "Wat is een administratieve loonsanctie?", a: "UWV toetst eerst of het re-integratieverslag compleet is. Ontbreekt er een verplicht onderdeel, dan kan UWV de re-integratie niet beoordelen en moet je het loon langer doorbetalen. Die verlenging stopt pas nadat je het ontbrekende hebt aangeleverd en UWV dat heeft beoordeeld." },
  { q: "Wanneer schakel ik je in?", a: "Het liefst rond week 80 tot 87 van het verzuim. Dan is er nog tijd om iets te herstellen voordat je werknemer de WIA aanvraagt. Later kan ook, maar dan is de ruimte kleiner. Eerder mag altijd, bijvoorbeeld bij de eerstejaarsevaluatie." },
  { q: "Ik heb al een arbodienst. Heeft dit dan zin?", a: "Ja. De arbodienst levert de bedrijfsarts en vaak een deel van de begeleiding, maar de werkgever blijft verantwoordelijk voor een compleet verslag. Ik kijk als tweede paar ogen of alles er is." },
  { q: "Zie je medische gegevens?", a: "Nee. Het medische deel gaat van de bedrijfsarts rechtstreeks naar UWV of naar je werknemer. Ik controleer alleen of dat is gebeurd." },
  { q: "Garandeer je dat er geen loonsanctie komt?", a: "Nee, en dat kan niemand eerlijk beloven. Ik zorg dat het verslag compleet is, zodat een sanctie om een ontbrekend stuk niet nodig is. Of de re-integratie zelf voldoende was, is een inhoudelijk oordeel van UWV over twee jaar verzuim." },
  { q: "Ik ben werknemer. Kan ik je ook inschakelen?", a: "Ja. Als werknemer heb je hetzelfde belang: met een compleet verslag kan UWV je WIA-aanvraag zonder vertraging behandelen. Ik loop met je na wat je van je werkgever moet krijgen." },
  { q: "In welke regio werk je?", a: "Dat hoor je bij de kennismaking. Is een bezoek niet praktisch, dan kan de controle ook op afstand, met stukken zonder medische informatie." },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section tint" id="faq">
      <div className="wrap">
        <div className="sec-head center reveal">
          <span className="eyebrow"><span className="dot"></span>Veelgestelde vragen</span>
          <h2>Goed om te weten</h2>
        </div>
        <div className="faq">
          {FAQS.map((f, i) => (
            <div className={"faq-item reveal" + (open === i ? " open" : "")} key={i}>
              <button className="faq-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
                {f.q}<span className="chev">{I.chevDown}</span>
              </button>
              <div className="faq-a" style={{ maxHeight: open === i ? 320 : 0 }}>
                <div className="faq-a-inner">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const tekst = "Ik wil graag een kennismaking over mijn verzuimdossier.\n\nEerste ziektedag:\nBedrijfsnaam en plaats:\nTelefoonnummer:";
  return (
    <section className="section" id="contact">
      <div className="wrap">
        <div className="cta-band reveal">
          <h2>Laat je dossier nakijken voordat UWV het doet</h2>
          <p>Stuur een bericht met de eerste ziektedag en je telefoonnummer. Ik bel je terug voor een korte kennismaking. Zet geen medische gegevens in je bericht.</p>
          <div className="hero-cta">
            <a className="btn btn-accent btn-lg" href={mailto("Kennismaking dossiercheck", tekst)}>{I.mail} Stuur een bericht</a>
            <a className="btn btn-ghost btn-lg" href="#checklist">Eerst zelf de check doen</a>
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
            <Merk style={{ marginBottom: 14 }} />
            <p style={{ fontSize: 14.5, maxWidth: "34ch", color: "rgba(255,255,255,.6)" }}>
              Controle en begeleiding van het re-integratieverslag, zodat het compleet naar UWV gaat.
            </p>
          </div>
          <div>
            <h4>Dienst</h4>
            <a href="#checklist">Snelle check</a>
            <a href="#werkwijze">Werkwijze</a>
            <a href="#tarieven">Tarieven</a>
          </div>
          <div>
            <h4>Hulpmiddelen</h4>
            <a href={naarInvuller()}>Plan van aanpak invullen</a>
            <a href="#privacyverklaring" onClick={openPrivacy}>Privacyverklaring</a>
            <a href={mailto("Verwerkersovereenkomst")}>Verwerkersovereenkomst</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href={"mailto:" + CONTACT_MAIL}>{CONTACT_MAIL}</a>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>Schepers Digital</span>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>KVK 42107874</span>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>Btw NL004512417B86</span>
          </div>
        </div>
        <div className="footer-bot">
          <span>© 2026 {MERK} · onderdeel van Schepers Digital · KVK 42107874</span>
          <span>Zelfstandige dienst, geen onderdeel van UWV · Geen garantie op de uitkomst van de toets</span>
        </div>
      </div>
    </footer>
  );
}

export function Landing({ onOpenPrivacy }) {
  return (
    <div className="site">
      <Nav />
      <Hero />
      <DirectNaar />
      <Probleem />
      <Checklist />
      <Werkwijze />
      <Tarieven />
      <Afspraken />
      <InvullerBand />
      <Faq />
      <Contact />
      <Footer onOpenPrivacy={onOpenPrivacy} />
    </div>
  );
}

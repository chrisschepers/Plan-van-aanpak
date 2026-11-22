/* Startpagina: de dossiercheck van het re-integratieverslag (Poortwachtercheck). */

import { I } from "./iconen.jsx";
import { Merk, MERK, CONTACT_MAIL, mailto } from "./merk.jsx";

const { useState } = React;

function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <Merk />
        <nav className="nav-links">
          <a href="#werkwijze">Werkwijze</a>
          <a href="#tarieven">Tarieven</a>
          <a href="#faq">Vragen</a>
          <a href="#contact">Contact</a>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap hero-enkel">
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
          <p className="hero-noot">
            Vaste prijs per dossier. Ik kom bij je op locatie. Medische stukken blijven bij de bedrijfsarts.
          </p>
        </div>
      </div>
    </section>
  );
}

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
        <p className="cijfers-tekst reveal">
          In 2024 legde UWV ruim 4.000 loonsancties op. Bij ongeveer 45% daarvan was het verslag
          gewoon niet compleet. Herstellen kost al snel drie weken beoordeling door UWV, en daarna
          loopt het loon nog zes weken door.
        </p>
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
  { w: 88, t: "UWV stuurt je werknemer de WIA-brief", s: "Het moment om de eindevaluatie te starten" },
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
          <p>Het beste moment is ruim vóór week 88. Dan is er nog tijd om iets te herstellen.</p>
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
    naam: "Compleet verzorgd", prijs: "vanaf € 950", sub: "per dossier, excl. btw",
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
            <div className="pakket card reveal" key={i}>
              <h3>{p.naam}</h3>
              <p className="pakket-d">{p.d}</p>
              <div className="pakket-prijs">{p.prijs}</div>
              <div className="pakket-sub">{p.sub}</div>
              <ul>{p.punten.map((x, j) => <li key={j}>{x}</li>)}</ul>
              <a className="btn btn-ghost" href={mailto(p.naam + " aanvragen")}>Aanvragen</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const WERKNEMER_PUNTEN = [
  "We lopen samen na of je alle stukken van je werkgever hebt gekregen.",
  "Je weet wat er nog moet gebeuren en wat je daarvoor aan je werkgever vraagt.",
  "Ik help je om je eigen mening in de eindevaluatie op papier te zetten.",
  "Je weet wat je kunt verwachten van de gesprekken bij UWV.",
];

function Werknemers() {
  const tekst = "Ik wil graag dat je meekijkt met mijn re-integratieverslag.\n\nEerste ziektedag:\nWoonplaats:\nTelefoonnummer:";
  return (
    <section className="section" id="werknemers">
      <div className="wrap">
        <div className="sec-head reveal">
          <span className="eyebrow"><span className="dot"></span>Voor werknemers</span>
          <h2>Ben je zelf ziek en komt de WIA-aanvraag eraan?</h2>
          <p>
            Je werkgever maakt het re-integratieverslag en dat gaat mee met je WIA-aanvraag. Mist er iets, dan
            kan UWV je aanvraag nog niet beoordelen. Ik kijk met je mee, zodat je weet waar je staat.
          </p>
        </div>
        <div className="werknemers-grid">
          <div className="reveal">
            <ul className="werknemers-lijst">{WERKNEMER_PUNTEN.map((x, i) => <li key={i}>{x}</li>)}</ul>
            <p className="werknemers-noot">
              Ik help nooit werkgever en werknemer in hetzelfde dossier. Medische stukken hoef ik niet te zien,
              dus zet die ook niet in je bericht. Heb je een conflict met je werkgever, dan verwijs ik je naar een jurist.
            </p>
          </div>
          <div className="pakket card reveal">
            <h3>Meekijken met je verslag</h3>
            <p className="pakket-d">Eén gesprek van anderhalf uur, bij je thuis of met beeldbellen.</p>
            <div className="pakket-prijs">€ 195</div>
            <div className="pakket-sub">inclusief btw</div>
            <a className="btn btn-ghost" href={mailto("Meekijken als werknemer", tekst)}>Vraag het aan</a>
          </div>
        </div>
      </div>
    </section>
  );
}

const AFSPRAKEN = [
  { t: "Ik zie geen medische stukken", d: "Die horen bij de bedrijfsarts. Ik bewaak alleen dat hij ze op tijd naar UWV of je werknemer stuurt." },
  { t: "Ik beloof geen uitkomst", d: "Ik zorg dat het verslag compleet is. Of de re-integratie inhoudelijk voldoende was, beoordeelt UWV." },
  { t: "Afspraken staan op papier", d: "Je krijgt een verwerkersovereenkomst. Voor contact met UWV teken je een machtiging." },
  { t: "Zorgvuldig met het dossier", d: "Ik gebruik de gegevens alleen voor deze opdracht. Kopieën bewaar ik tot UWV over de WIA-aanvraag heeft beslist." },
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
                <div><h4>{c.t}</h4><p>{c.d}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="over-mij reveal">
          <div className="over-kop">
            <img src="img/chris-schepers.jpg" alt="Chris Schepers" width="96" height="96" loading="lazy" />
            <div>
              <h3>Chris Schepers</h3>
              <p className="over-rol">Arbeidsdeskundige i.o.</p>
            </div>
          </div>
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

const FAQS = [
  { q: "Wat is een administratieve loonsanctie?", a: "UWV toetst eerst of het re-integratieverslag compleet is. Ontbreekt er een verplicht onderdeel, dan kan UWV de re-integratie niet beoordelen en moet je het loon langer doorbetalen. Die verlenging stopt pas nadat je het ontbrekende hebt aangeleverd en UWV dat heeft beoordeeld." },
  { q: "Wanneer schakel ik je in?", a: "Het liefst rond week 80 tot 88 van het verzuim. Dan is er nog tijd om iets te herstellen voordat je werknemer de WIA aanvraagt. Later kan ook, maar dan is de ruimte kleiner. Eerder mag altijd, bijvoorbeeld bij de eerstejaarsevaluatie." },
  { q: "Ik heb al een arbodienst. Heeft dit dan zin?", a: "Ja. De arbodienst levert de bedrijfsarts en vaak een deel van de begeleiding, maar de werkgever blijft verantwoordelijk voor een compleet verslag. Ik kijk als tweede paar ogen of alles er is." },
  { q: "Zie je medische gegevens?", a: "Nee. Het medische deel gaat van de bedrijfsarts rechtstreeks naar UWV of naar je werknemer. Ik controleer alleen of dat is gebeurd." },
  { q: "Garandeer je dat er geen loonsanctie komt?", a: "Nee, en dat kan niemand eerlijk beloven. Ik zorg dat het verslag compleet is, zodat een sanctie om een ontbrekend stuk niet nodig is. Of de re-integratie zelf voldoende was, is een inhoudelijk oordeel van UWV over twee jaar verzuim." },
  { q: "Ik ben werknemer. Kan ik je ook inschakelen?", a: "Ja. Als werknemer heb je hetzelfde belang: met een compleet verslag kan UWV je WIA-aanvraag zonder vertraging behandelen. In één gesprek lopen we na wat je van je werkgever moet krijgen. Dat kost € 195 inclusief btw. Ik help nooit werkgever en werknemer in hetzelfde dossier." },
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
            <a className="btn btn-accent btn-lg" href={mailto("Kennismaking dossiercheck", tekst)}>Stuur een bericht</a>
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
            <a href="#werknemers">Voor werknemers</a>
          </div>
          <div>
            <h4>Privacy</h4>
            <a href="#privacyverklaring" onClick={openPrivacy}>Privacyverklaring</a>
            <a href={mailto("Verwerkersovereenkomst")}>Verwerkersovereenkomst</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href={"mailto:" + CONTACT_MAIL}>{CONTACT_MAIL}</a>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>Schepers Digital</span>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>De Vaandeldrager 13, 6921 TK Duiven</span>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>KVK 42107874</span>
            <span style={{ display: "block", padding: "5px 0", fontSize: 15 }}>Btw NL004512417B86</span>
          </div>
        </div>
        <div className="footer-bot">
          <span>© 2026 {MERK} · onderdeel van Schepers Digital · KVK 42107874</span>
          <span>Geen garantie op de uitkomst van de toets</span>
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
      <Probleem />
      <Checklist />
      <Werkwijze />
      <Tarieven />
      <Werknemers />
      <Afspraken />
      <Faq />
      <Contact />
      <Footer onOpenPrivacy={onOpenPrivacy} />
    </div>
  );
}

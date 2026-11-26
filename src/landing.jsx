/* Startpagina: de dossiercheck van het re-integratieverslag (Poortwachtercheck).
   Opbouw (Hallmark-redesign 22-11): masthead, kop met prijsoverzicht, waarom,
   werkwijze, tarieven, werknemers, afspraken, vragen, contact met over mij, colofon. */

import { I } from "./iconen.jsx";
import { Merk, MERK, CONTACT_MAIL, LINKEDIN, mailto } from "./merk.jsx";
import { ARTIKEL_LINKS } from "./artikel-links.js";

const { useState } = React;

// `basis` is "" op de startpagina en "/" op de losse pagina's, zodat de ankers
// daar naar de startpagina wijzen.
export function Nav({ basis = "" }) {
  return (
    <header className="masthead">
      <div className="container masthead-inner">
        <Merk href={basis ? "/" : "#top"} />
        <nav className="masthead-links" aria-label="Hoofdmenu">
          <a href="/termijnen-berekenen/">Termijnen</a>
          <a href={basis + "#werkwijze"}>Werkwijze</a>
          <a href={basis + "#tarieven"}>Tarieven</a>
          <a href={basis + "#faq"}>Vragen</a>
          <a href={basis + "#contact"}>Contact</a>
        </nav>
      </div>
    </header>
  );
}

export const PAKKETTEN = [
  {
    naam: "Dossiercheck", prijs: "vanaf € 450", sub: "per dossier, excl. btw",
    d: "Je wilt weten of het verslag compleet is en klopt.",
    punten: ["Bezoek op locatie", "Controle van elk onderdeel, elke datum en handtekening", "Inhoudelijke controle van alle niet-medische stukken", "Heldere lijst met wat ontbreekt of niet klopt, en wat je moet doen"],
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

// Het overzicht op het eerste scherm: de diensten van deze pagina, met hun prijs.
const OVERZICHT = [
  ...PAKKETTEN.map((p) => ({ naam: p.naam, prijs: p.prijs, btw: p.prijs.startsWith("vanaf") ? "excl. btw" : "", href: "#tarieven" })),
  { naam: "Meekijken als werknemer", prijs: "€ 195", btw: "incl. btw", href: "#werknemers" },
];

function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-kop">
      <div className="container intro-raster reveal">
          <div className="intro">
            <h1 id="hero-kop">Je <span className="nw">re-integratieverslag</span> <br />compleet naar UWV</h1>
            <p className="lead">
              Is je werknemer bijna twee jaar ziek? Als casemanager verzuim kom ik langs en loop ik het
              dossier na volgens de Wet verbetering poortwachter.
              Ik kijk of alles erin zit, en of de niet-medische stukken inhoudelijk kloppen.
            </p>
            <div className="acties">
              <a className="btn" href="#contact">Dossier laten nakijken</a>
              <a className="btn btn--quiet" href="#werkwijze">Zo werk ik</a>
            </div>
            <p className="intro-noot">Vaste prijs per dossier. Ik kom in heel Nederland bij je op locatie. Medische stukken blijven bij de bedrijfsarts.</p>
          </div>
          <nav className="overzicht" aria-label="Diensten en prijzen">
            <ul>
              {OVERZICHT.map((o) => (
                <li key={o.naam}>
                  <a href={o.href}>
                    <span className="overzicht-naam">{o.naam}</span>
                    <span className="overzicht-prijs">{o.prijs}{o.btw && <small>{o.btw}</small>}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
      </div>
    </section>
  );
}

function Probleem() {
  return (
    <section className="section waarom" id="waarom">
      <div className="container">
        <div className="kop-gesplitst">
          <h2>Een ontbrekend stuk kan maanden loon kosten</h2>
          <p>
            UWV kijkt eerst of het re-integratieverslag compleet is, en daarna naar de inhoud.
            Mist er een onderdeel of een handtekening, dan volgt een administratieve loonsanctie:
            je betaalt het loon langer door, tot het verslag in orde is. Vindt UWV dat er te weinig
            aan re-integratie is gedaan, bijvoorbeeld omdat het tweede spoor te laat begon, dan kan
            de loonsanctie oplopen tot een jaar.
          </p>
        </div>
        <div className="cijfers">
          <p className="statement">
            In 2024 legde UWV ruim 4.000 loonsancties op. Bij ongeveer 45% daarvan was het verslag
            niet compleet.
          </p>
          <p className="cijfers-vervolg">
            Herstellen kost dan al snel drie weken beoordeling door UWV, en daarna loopt
            het loon nog zes weken door. Bij de rest ging het om de inhoud van de re-integratie.
          </p>
        </div>
        <div className="waarom-voet">
          <p className="bron">
            Cijfers: <a href="https://uwvjaarverslag.nl/external/asset/download/project/f9b7da0a-03ec-0000-58b5-7efa5990235f/name/uwv-kwantitatieve-Informatie-2025T3%202.0.pdf" target="_blank" rel="noopener">UWV, kwantitatieve informatie</a>.
            Herstel en doorlooptijd: <a href="https://www.rijksoverheid.nl/documenten/publicaties/2024/09/30/werkproces-uwv-toetsen-riv-en-opleggen-loonsanctie" target="_blank" rel="noopener">werkproces UWV toetsen re-integratieverslag</a>.
          </p>
        </div>
      </div>
    </section>
  );
}

const STAPPEN = [
  { t: "Kennismaken", d: "We bellen kort. Je hoort wat ik nodig heb en wat het kost. De prijs staat vooraf vast." },
  { t: "Dossier nalopen", d: "Ik kom langs en loop het dossier na: elk onderdeel, elke datum en elke handtekening. Ook de inhoud van alle niet-medische stukken: klopt het verloop, en is er op tijd bijgestuurd?" },
  { t: "Aanvullen", d: "Je krijgt een lijst met wat ontbreekt of niet klopt, en wat je eraan kunt doen. Als je dat wilt, help ik met de eindevaluatie en met het bijwerken van de stukken." },
  { t: "Verzendklaar", d: "Het verslag ligt compleet en ondertekend klaar voor je werknemer, op tijd voor de WIA-aanvraag." },
];

function Werkwijze() {
  return (
    <section className="section werkwijze" id="werkwijze">
      <div className="container">
        <div className="kop">
          <h2>Van losse stukken naar een compleet verslag</h2>
          <p className="lead">Het beste moment is ruim vóór week 88. Dan is er nog tijd om iets te herstellen.</p>
        </div>
        <ol className="steps">
          {STAPPEN.map((s) => (
            <li className="step" key={s.t}>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Tarieven() {
  return (
    <section className="section tarieven" id="tarieven">
      <div className="container">
        <div className="kop">
          <h2>Een vaste prijs per dossier</h2>
          <p className="lead">Geen uurtje-factuurtje. Je weet vooraf wat het kost, en dat is een fractie van één maand doorbetaald loon.</p>
        </div>
        <div className="pakketten">
          {PAKKETTEN.map((p) => (
            <article className="pakket" key={p.naam}>
              <div className="pakket-naam">
                <h3>{p.naam}</h3>
                <p className="pakket-d">{p.d}</p>
              </div>
              <ul>{p.punten.map((x) => <li key={x}>{x}</li>)}</ul>
              <div className="pakket-koop">
                <p className="pakket-prijs">{p.prijs}</p>
                <p className="pakket-sub">{p.sub}</p>
                <a className="btn btn--quiet" href={mailto(p.naam + " aanvragen")}>Aanvragen</a>
              </div>
            </article>
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
    <section className="section werknemers" id="werknemers">
      <div className="container werknemers-grid">
        <div className="werknemers-tekst">
          <h2>Ben je zelf ziek en komt de WIA-aanvraag eraan?</h2>
          <p className="werknemers-intro">
            Je werkgever maakt het re-integratieverslag en dat gaat mee met je WIA-aanvraag. Mist er iets, dan
            kan UWV je aanvraag nog niet beoordelen. Ik kijk met je mee, zodat je weet waar je staat.
          </p>
          <ul className="werknemers-lijst">{WERKNEMER_PUNTEN.map((x) => <li key={x}>{x}</li>)}</ul>
          <p className="werknemers-noot">
            Ik help nooit werkgever en werknemer in hetzelfde dossier. Medische stukken hoef ik niet te zien,
            dus zet die ook niet in je bericht. Heb je een conflict met je werkgever, dan verwijs ik je naar een jurist.
          </p>
        </div>
        <aside className="pakket aanbod" aria-label="Meekijken met je verslag">
          <h3>Meekijken met je verslag</h3>
          <p className="pakket-d">Eén gesprek van anderhalf uur, bij je thuis of met beeldbellen.</p>
          <p className="pakket-prijs">€ 195</p>
          <p className="pakket-sub">inclusief btw</p>
          <a className="btn" href={mailto("Meekijken als werknemer", tekst)}>Vraag het aan</a>
        </aside>
      </div>
    </section>
  );
}

const AFSPRAKEN = [
  { t: "Ik zie geen medische stukken", d: "Die horen bij de bedrijfsarts. Ik bewaak alleen dat hij ze op tijd naar UWV of je werknemer stuurt." },
  { t: "Ik beloof geen uitkomst", d: "Ik loop ook de inhoud na en wijs je op zwakke plekken. Dat verkleint het risico op een sanctie, maar het oordeel ligt bij UWV." },
  { t: "Afspraken staan op papier", d: "Je krijgt een verwerkersovereenkomst. Voor contact met UWV teken je een machtiging." },
  { t: "Zorgvuldig met het dossier", d: "Ik gebruik de gegevens alleen voor deze opdracht. Kopieën bewaar ik tot UWV over de WIA-aanvraag heeft beslist." },
];

function Afspraken() {
  return (
    <section className="section afspraken" id="afspraken">
      <div className="container">
        <h2>Duidelijk over wat ik wel en niet doe</h2>
        <div className="afspraken-grid">
          {AFSPRAKEN.map((c) => (
            <div className="afspraak" key={c.t}>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export const FAQS = [
  { q: "Wat is een administratieve loonsanctie?", a: "UWV toetst eerst of het re-integratieverslag compleet is. Ontbreekt er een verplicht onderdeel, dan kan UWV de re-integratie niet beoordelen en moet je het loon langer doorbetalen. Die verlenging stopt pas nadat je het ontbrekende hebt aangeleverd en UWV dat heeft beoordeeld.", link: { href: "/administratieve-loonsanctie/", tekst: "Meer over de administratieve loonsanctie" } },
  { q: "Kijk je alleen of alles erin zit?", a: "Nee. Ik loop alle niet-medische stukken ook inhoudelijk na. Kloppen de data en afspraken? Sluit het plan van aanpak aan op het advies van de bedrijfsarts? Is het plan bijgesteld toen de situatie veranderde, en is het tweede spoor op tijd ingezet? Medische stukken blijven bij de bedrijfsarts." },
  { q: "Wanneer schakel ik je in?", a: "Het liefst rond week 80 tot 88 van het verzuim. Dan is er nog tijd om iets te herstellen voordat je werknemer de WIA aanvraagt. Later kan ook, maar dan is de ruimte kleiner. Eerder mag altijd, bijvoorbeeld bij de eerstejaarsevaluatie.", link: { href: "/eerstejaarsevaluatie/", tekst: "Wat er in de eerstejaarsevaluatie hoort" } },
  { q: "Ik heb al een arbodienst. Heeft dit dan zin?", a: "Ja. De arbodienst levert de bedrijfsarts en vaak een deel van de begeleiding, maar de werkgever blijft verantwoordelijk voor een compleet verslag. Ik kijk als tweede paar ogen of alles er is en klopt." },
  { q: "Zie je medische gegevens?", a: "Nee. Het medische deel gaat van de bedrijfsarts rechtstreeks naar UWV of naar je werknemer. Ik controleer alleen of dat is gebeurd." },
  { q: "Garandeer je dat er geen loonsanctie komt?", a: "Nee, en dat kan niemand eerlijk beloven. Ik zorg dat het verslag compleet is en loop alle niet-medische stukken ook inhoudelijk na. Zie ik een zwakke plek, dan hoor je dat op tijd, zodat je nog kunt bijsturen of het goed kunt onderbouwen. Het oordeel ligt bij UWV." },
  { q: "Ik ben werknemer. Kan ik je ook inschakelen?", a: "Ja. Als werknemer heb je hetzelfde belang: met een compleet verslag kan UWV je WIA-aanvraag zonder vertraging behandelen. In één gesprek lopen we na wat je van je werkgever moet krijgen. Dat kost € 195 inclusief btw. Ik help nooit werkgever en werknemer in hetzelfde dossier.", link: { href: "/wia-aanvraag-werknemer/", tekst: "Wat je nodig hebt voor je WIA-aanvraag" } },
  { q: "In welke regio werk je?", a: "In heel Nederland. Ik kom bij je op locatie. Is een bezoek niet praktisch, dan kan de controle ook op afstand, met stukken zonder medische informatie." },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section vragen" id="faq">
      <div className="container faq-grid">
        <h2>Goed om te weten</h2>
        <div className="faq">
          {FAQS.map((f, i) => (
            <div className={"faq-item" + (open === i ? " open" : "")} key={f.q}>
              <button className="faq-q" type="button" onClick={() => setOpen(open === i ? -1 : i)}
                aria-expanded={open === i} aria-controls={"faq-a-" + i}>
                <span>{f.q}</span><span className="chev">{I.chevDown}</span>
              </button>
              <div className="faq-a" id={"faq-a-" + i} hidden={open !== i}>
                <p>{f.a}</p>
                {f.link && <p className="faq-link"><a href={f.link.href}>{f.link.tekst}</a></p>}
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
    <section className="section contact" id="contact">
      <div className="container contact-grid">
        <div className="contact-vraag">
          <h2>Laat je dossier nakijken voordat UWV het doet</h2>
          <p className="lead">
            Stuur een bericht met de eerste ziektedag en je telefoonnummer. Ik bel je terug voor een
            korte kennismaking. Zet geen medische gegevens in je bericht.
          </p>
          <div className="acties">
            <a className="btn" href={mailto("Kennismaking dossiercheck", tekst)}>Stuur een bericht</a>
            <a className="contact-adres" href={"mailto:" + CONTACT_MAIL}>{CONTACT_MAIL}</a>
          </div>
        </div>
        <div className="over-mij">
          <img src="img/chris-schepers.jpg" alt="Chris Schepers" width="400" height="400" loading="lazy" />
          <div className="over-tekst">
            <h3>Chris Schepers</h3>
            <p className="over-rol">Arbeidsdeskundige i.o.</p>
            <p className="over-link"><a href={LINKEDIN} rel="me">Mijn profiel op LinkedIn</a></p>
            <p>
              Ik werk als casemanager met werkgevers en werknemers bij langdurig verzuim. Ik
              weet waar een dossier op vastloopt en waar UWV op let.
            </p>
            <p>
              Je schakelt mij in voor het laatste stuk: de eindevaluatie en het verslag. Dat
              kan ook als je al een arbodienst hebt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer({ onOpenPrivacy, basis = "" }) {
  const openPrivacy = onOpenPrivacy ? (e) => { e.preventDefault(); onOpenPrivacy(); } : undefined;
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-merk">
          <Merk href={basis ? "/" : "#top"} />
          <p>Controle en begeleiding van het re-integratieverslag, zodat het compleet naar UWV gaat.</p>
        </div>
        <nav className="footer-links" aria-label="Voettekst">
          <div className="footer-groep">
            <a href="/termijnen-berekenen/">Termijnen</a>
          <a href={basis + "#werkwijze"}>Werkwijze</a>
            <a href={basis + "#tarieven"}>Tarieven</a>
            <a href={basis + "#werknemers"}>Voor werknemers</a>
          </div>
          <div className="footer-groep">
            {ARTIKEL_LINKS.map((l) => <a key={l.href} href={l.href}>{l.kort}</a>)}
          </div>
          <div className="footer-groep">
            <a href={basis + "#privacyverklaring"} onClick={openPrivacy}>Privacyverklaring</a>
            <a href={mailto("Verwerkersovereenkomst")}>Verwerkersovereenkomst</a>
            <a href={"mailto:" + CONTACT_MAIL}>{CONTACT_MAIL}</a>
          </div>
        </nav>
        <p className="colofon">
          {MERK} is een dienst van Schepers Digital, De Vaandeldrager 13, 6921 TK Duiven.
          KVK 42107874, btw NL004512417B86. Geen garantie op de uitkomst van de toets. © 2026.
        </p>
      </div>
    </footer>
  );
}

export function Landing({ onOpenPrivacy }) {
  return (
    <div className="site">
      <Nav />
      <main>
        <Hero />
        <Probleem />
        <Werkwijze />
        <Tarieven />
        <Werknemers />
        <Afspraken />
        <Faq />
        <Contact />
      </main>
      <Footer onOpenPrivacy={onOpenPrivacy} />
    </div>
  );
}

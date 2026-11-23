/* De losse uitlegpagina's. build.mjs rendert ze vooraf naar <slug>/index.html;
   ze hebben geen JavaScript nodig. Feiten komen van uwv.nl en de Werkwijzer
   Poortwachter van UWV (augustus 2022); de bronnen staan onder elke pagina. */

import { Nav, Footer } from "./landing.jsx";
import { mailto } from "./merk.jsx";
import { ARTIKEL_LINKS } from "./artikel-links.js";

const BIJGEWERKT = { iso: "2026-11-23", tekst: "23 november 2026" };

const BRON = {
  eerstejaars: { tekst: "UWV: Eerstejaarsevaluatie", href: "https://www.uwv.nl/nl/ziek/re-integratie/eerstejaarsevaluatie" },
  week42: { tekst: "UWV: 42e-weeksmelding", href: "https://www.uwv.nl/nl/ziek/re-integratie/42e-weeksmelding" },
  eind: { tekst: "UWV: Eindevaluatie", href: "https://www.uwv.nl/nl/ziek/re-integratie/eindevaluatie" },
  verslag: { tekst: "UWV: Re-integratieverslag", href: "https://www.uwv.nl/nl/ziek/re-integratie/verslag" },
  beoordeling: { tekst: "UWV: Beoordeling re-integratieverslag", href: "https://www.uwv.nl/nl/ziek/re-integratie/beoordeling-re-integratieverslag" },
  wia: { tekst: "UWV: WIA-uitkering aanvragen", href: "https://www.uwv.nl/nl/wia/wia-aanvragen" },
  uitstel: { tekst: "UWV: Uitstel WIA-aanvraag", href: "https://www.uwv.nl/nl/ziek/loondoorbetaling/uitstel-wia-aanvraag" },
  werkwijzer: { tekst: "UWV: Werkwijzer Poortwachter (augustus 2022, pdf)", href: "https://www.uwv.nl/assets-kai/files/70c51464-322e-45e7-8ec2-e6b073cd784d/werkwijzer-poortwachter.pdf" },
  cijfers: { tekst: "UWV: kwantitatieve informatie (pdf)", href: "https://uwvjaarverslag.nl/external/asset/download/project/f9b7da0a-03ec-0000-58b5-7efa5990235f/name/uwv-kwantitatieve-Informatie-2025T3%202.0.pdf" },
};

const WERKGEVER_ACTIE = (onderwerp) => ({
  kop: "Laat het dossier nakijken",
  tekst: "Ik loop het verzuimdossier na, ook de inhoud van alle niet-medische stukken, en je krijgt een lijst met wat ontbreekt of niet klopt. De dossiercheck kost vanaf € 450 per dossier, excl. btw. Medische stukken blijven bij de bedrijfsarts.",
  knop: "Stuur een bericht",
  href: mailto(onderwerp, "Ik wil graag een kennismaking over mijn verzuimdossier.\n\nEerste ziektedag:\nBedrijfsnaam en plaats:\nTelefoonnummer:"),
  meer: { href: "/#tarieven", tekst: "Bekijk de tarieven" },
});

const WERKNEMER_ACTIE = {
  kop: "Kijk samen met mij naar je verslag",
  tekst: "In één gesprek van anderhalf uur, bij je thuis of met beeldbellen, lopen we na of je alles hebt en wat je nog aan je werkgever vraagt. Dat kost € 195 inclusief btw. Ik help nooit werkgever en werknemer in hetzelfde dossier, en medische stukken hoef ik niet te zien.",
  knop: "Vraag het aan",
  href: mailto("Meekijken als werknemer", "Ik wil graag dat je meekijkt met mijn re-integratieverslag.\n\nEerste ziektedag:\nWoonplaats:\nTelefoonnummer:"),
  meer: { href: "/#werknemers", tekst: "Meer over meekijken" },
};

export const ARTIKELEN = [
  {
    slug: "eerstejaarsevaluatie",
    kort: "Eerstejaarsevaluatie",
    seoTitel: "Eerstejaarsevaluatie: brief van UWV, en nu?",
    beschrijving: "Brief van UWV over de eerstejaarsevaluatie gekregen? Wat erin moet, wanneer, wat er met het formulier gebeurt en waarom het tweede spoor nu telt.",
    h1: "Eerstejaarsevaluatie: brief van UWV, en nu?",
    lead: "Na een jaar ziekte kijken werkgever en werknemer samen terug en vooruit. Dat is de eerstejaarsevaluatie. Zo pak je hem aan, en dit wil UWV er later in terugzien.",
    actie: WERKGEVER_ACTIE("Eerstejaarsevaluatie"),
    tweedeActie: WERKNEMER_ACTIE,
    bronnen: [BRON.eerstejaars, BRON.week42, BRON.werkwijzer, BRON.verslag],
    inhoud: (
      <>
        <h2>Waarom je deze brief krijgt</h2>
        <p>
          Is je werknemer 42 weken ziek, dan meld je dat bij UWV: de 42e-weeksmelding. Daarna stuurt UWV je
          een brief over de eerstejaarsevaluatie. Die vul je samen met je werknemer in, rond 52 weken ziekte.
        </p>
        <p>
          Ben je zelf ziek en hoor je dat de eerstejaarsevaluatie eraan komt? Dan gaat het om hetzelfde gesprek.
          Je zit erbij en je mening hoort erin. Onderaan staat wat je als werknemer kunt doen.
        </p>

        <h2>Wat is de eerstejaarsevaluatie?</h2>
        <p>
          Het plan van aanpak wordt tijdens de ziekte regelmatig bijgesteld. De eerstejaarsevaluatie is een
          verplicht moment daarin, na 52 weken. Werkgever en werknemer kijken terug op het eerste jaar en stellen
          de vraag die UWV later ook stelt: zit de re-integratie nog op de goede weg?
        </p>
        <p>
          Jullie kiezen ook hoe het verder gaat: terug in het eigen bedrijf, of werk bij een andere werkgever.
          Dat laatste heet het tweede spoor.
        </p>

        <h2>Wat erin moet</h2>
        <ul>
          <li>Wat werkgever en werknemer in het eerste jaar hebben gedaan om weer aan het werk te gaan.</li>
          <li>Wat dat heeft opgeleverd.</li>
          <li>Wat de bedrijfsarts zegt over wat je werknemer wel en niet kan.</li>
          <li>Welke afspraken uit het plan van aanpak veranderen, en wat jullie allebei van de nieuwe afspraken vinden. Veranderen de afspraken niet, dan zet je dat er ook in.</li>
          <li>Het doel voor het tweede jaar, en of het tweede spoor nodig is.</li>
        </ul>
        <p>
          UWV heeft hiervoor het formulier (Eerstejaars)evaluatie. Een eigen opzet mag ook, zolang de evaluatie
          als apart en herkenbaar onderdeel in het re-integratieverslag zit.
        </p>

        <h2>Het tweede spoor: de belangrijkste keuze</h2>
        <p>
          Is er geen zicht meer op werk in het eigen bedrijf, dan moet het tweede spoor uiterlijk 6 weken na de
          eerstejaarsevaluatie zijn gestart. Alleen als er binnen 3 maanden concreet zicht is op vast werk in het
          eigen bedrijf, mag het wachten. Dat staat in de Werkwijzer Poortwachter van UWV.
        </p>
        <p>
          Begint het tweede spoor te laat, dan kan UWV bij de WIA-aanvraag een loonsanctie opleggen. Je betaalt het
          loon dan tot een jaar langer door.
        </p>

        <h2>Wat er met het formulier gebeurt</h2>
        <p>
          Je stuurt de eerstejaarsevaluatie nu nog niet naar UWV. Jullie ondertekenen hem, je werknemer krijgt een
          kopie en jullie bewaren hem allebei. Hij hoort bij het re-integratieverslag dat met de WIA-aanvraag
          meegaat. UWV leest hem pas aan het eind van het tweede jaar.
        </p>
        <p>
          Ontbreekt hij dan, dan is het verslag niet compleet. UWV geeft je 5 werkdagen om dat aan te vullen. Lukt
          dat niet, dan volgt een <a href="/administratieve-loonsanctie/">administratieve loonsanctie</a>. Is de
          evaluatie nooit gehouden, dan valt er weinig aan te vullen.
        </p>

        <h2>Als je zelf ziek bent</h2>
        <ul>
          <li>Je zit bij het gesprek en jouw kijk op de afspraken hoort in de evaluatie. Ben je het ergens niet mee eens, laat dat dan opschrijven.</li>
          <li>Vraag een kopie van het ondertekende formulier. Je hebt hem later nodig voor je <a href="/wia-aanvraag-werknemer/">WIA-aanvraag</a>.</li>
          <li>Medische details horen niet in de evaluatie. Die blijven bij de bedrijfsarts.</li>
        </ul>

        <h2>Wat ik doe</h2>
        <p>
          Rond de eerstejaarsevaluatie kijk ik het dossier na. Klopt het plan van aanpak, is het bijgesteld toen dat
          nodig was, en is de keuze over het tweede spoor goed onderbouwd? Dan is er nog een jaar om bij te sturen.
        </p>
      </>
    ),
  },
  {
    slug: "eindevaluatie",
    kort: "Eindevaluatie",
    seoTitel: "Eindevaluatie: het laatste stuk vóór de WIA-aanvraag",
    beschrijving: "Wanneer je de eindevaluatie invult, wat erin moet, hoe hij samenhangt met het actueel oordeel van de bedrijfsarts en waar UWV op let.",
    h1: "Eindevaluatie: het laatste stuk vóór de WIA-aanvraag",
    lead: "Na ruim anderhalf jaar ziekte vullen werkgever en werknemer de eindevaluatie in. Daarmee sluiten jullie twee jaar re-integratie af, vlak voor de WIA-aanvraag.",
    actie: WERKGEVER_ACTIE("Eindevaluatie"),
    tweedeActie: WERKNEMER_ACTIE,
    bronnen: [BRON.eind, BRON.wia, BRON.verslag, BRON.werkwijzer],
    inhoud: (
      <>
        <h2>Wanneer</h2>
        <p>
          Vul de eindevaluatie samen in als je werknemer ruim 1,5 jaar ziek is en zijn eigen werk nog niet helemaal
          kan doen. Doe dat uiterlijk 2 weken voordat de WIA-aanvraag de deur uit moet.
        </p>
        <p>
          In week 88 krijgt je werknemer van UWV een brief over de WIA-aanvraag. Daarna heeft hij 6 weken; de
          uiterste datum staat in de brief. Het complete re-integratieverslag gaat met de aanvraag mee.
        </p>
        <p>Is er nooit een plan van aanpak gemaakt, dan is een eindevaluatie niet nodig.</p>

        <h2>Wat erin staat</h2>
        <ul>
          <li>Het oordeel van werkgever en werknemer over de afgelopen twee jaar: wat is er gedaan en wat leverde het op.</li>
          <li>De mening van de werkgever over wat de werknemer in de toekomst nog kan.</li>
          <li>De stand van zaken op dit moment, op basis van het actueel oordeel van de bedrijfsarts of arbodienst.</li>
        </ul>
        <p>
          Het actueel oordeel is een apart stuk. De bedrijfsarts beschrijft daarin wat de werknemer nu wel en niet
          kan. Het moet over het moment van de WIA-aanvraag gaan, niet over een half jaar eerder.
        </p>

        <h2>Waar UWV op let</h2>
        <ul>
          <li><strong>Compleet.</strong> Alle onderdelen zitten erin en zijn ondertekend. Ontbreekt er iets, dan krijg je 5 werkdagen om het aan te vullen, en anders volgt een <a href="/administratieve-loonsanctie/">administratieve loonsanctie</a>.</li>
          <li><strong>Actueel.</strong> De eindevaluatie en het actueel oordeel beschrijven de situatie op het moment van de aanvraag.</li>
          <li><strong>Te volgen.</strong> Uit de stukken blijkt wat er is gedaan en waarom. Kan UWV zich geen goed beeld vormen, dan vraagt UWV eerst om aanvulling. Komt die niet, dan oordeelt UWV op wat er ligt, en dat kan uitlopen op een loonsanctie van tot een jaar.</li>
        </ul>

        <h2>De rol van de werknemer</h2>
        <p>
          De werknemer vult de eindevaluatie samen met de werkgever in, tekent mee en krijgt een kopie. Zijn eigen
          oordeel over de re-integratie geeft hij daarnaast op het aanvraagformulier voor de WIA. Lees meer
          over <a href="/wia-aanvraag-werknemer/">wat een werknemer bij de WIA-aanvraag regelt</a>.
        </p>

        <h2>Wat ik doe</h2>
        <p>
          Bij Compleet verzorgd help ik met de eindevaluatie en het bijwerken van de stukken, en ik bewaak dat de
          bedrijfsarts de medische informatie verstuurt. Het verslag ligt dan op tijd compleet klaar voor je werknemer.
        </p>
      </>
    ),
  },
  {
    slug: "administratieve-loonsanctie",
    kort: "Administratieve loonsanctie",
    seoTitel: "Administratieve loonsanctie: wat het is en hoe je hem oplost",
    beschrijving: "Mist er een stuk in het re-integratieverslag, dan betaal je het loon langer door. Hoe UWV toetst, welke termijnen gelden en hoe je het herstelt.",
    h1: "Administratieve loonsanctie: wat het is en hoe je hem oplost",
    lead: "Mist er een stuk in het re-integratieverslag, dan kan UWV de re-integratie niet beoordelen. Als werkgever betaal je het loon dan langer door, tot het verslag in orde is.",
    actie: WERKGEVER_ACTIE("Administratieve loonsanctie"),
    bronnen: [BRON.beoordeling, BRON.werkwijzer, BRON.verslag, BRON.cijfers],
    inhoud: (
      <>
        <h2>Twee soorten loonsanctie</h2>
        <p>
          UWV toetst het re-integratieverslag in twee stappen. Eerst of het compleet is, daarna of er genoeg aan
          re-integratie is gedaan.
        </p>
        <ul>
          <li><strong>Administratief:</strong> er ontbreekt een document of een handtekening.</li>
          <li><strong>Inhoudelijk:</strong> er is te weinig gedaan, bijvoorbeeld omdat het tweede spoor te laat begon. Je betaalt het loon dan tot een jaar langer door.</li>
        </ul>
        <p>
          In 2024 legde UWV ruim 4.000 loonsancties op. Bij ongeveer 45% daarvan was het verslag niet compleet.
        </p>

        <h2>Wat er moet zitten in het verslag</h2>
        <ul>
          <li>De probleemanalyse, met eventuele bijstellingen.</li>
          <li>Het plan van aanpak, met bijstellingen en evaluaties.</li>
          <li>De <a href="/eerstejaarsevaluatie/">eerstejaarsevaluatie</a>.</li>
          <li>Het actueel oordeel van de bedrijfsarts of arbodienst.</li>
          <li>De <a href="/eindevaluatie/">eindevaluatie</a>.</li>
        </ul>
        <p>
          De medische informatie vult de bedrijfsarts samen met de werknemer in. De werknemer stuurt die zelf naar
          UWV; de werkgever mag dat niet. Zijn er twee jaar lang geen mogelijkheden geweest om te werken, dan zijn
          de probleemanalyse, het actueel oordeel en de medische informatie genoeg.
        </p>

        <h2>Wat er gebeurt als er iets ontbreekt</h2>
        <p>
          Ligt het aan de werkgever, dan krijgt die eerst 5 werkdagen om de ontbrekende stukken aan te leveren.
          Lukt dat, dan gaat de toets gewoon verder. Lukt het niet, dan legt UWV een verlenging van de
          loondoorbetaling op. In de beslissing staat welke documenten ontbreken.
        </p>
        <p>
          Ligt het aan de werknemer, dan krijgt die 5 werkdagen. Levert hij niets aan, dan neemt UWV de
          WIA-aanvraag niet in behandeling.
        </p>

        <h2>Hoe je hem oplost</h2>
        <p>
          Een administratieve tekortkoming kun je altijd herstellen. Je stuurt een bekortingsverzoek met de
          ontbrekende stukken, via het werkgeversportaal of per post, en je schrijft per punt wat je hebt gedaan.
          UWV beslist binnen 3 weken. Is het in orde, dan stopt de loondoorbetaling 6 weken na die beslissing.
        </p>
        <p>
          Na het insturen loopt het loon dus nog tot zo'n 9 weken door. Een verslag dat in één keer compleet is,
          scheelt die weken. Werkgever en werknemer kunnen allebei bezwaar maken tegen de beslissing van UWV.
        </p>

        <h2>Wat ik doe</h2>
        <p>
          Ik loop het dossier na voordat het naar UWV gaat: elk onderdeel, elke datum en elke handtekening, en ook
          de inhoud van de niet-medische stukken. Mist er iets, dan hoor je dat op tijd. Een garantie geeft niemand:
          het oordeel ligt bij UWV.
        </p>
      </>
    ),
  },
  {
    slug: "wia-aanvraag-werknemer",
    kort: "WIA-aanvraag als werknemer",
    seoTitel: "Brief van UWV over je WIA-aanvraag: wat moet je regelen?",
    beschrijving: "Bijna twee jaar ziek en een brief van UWV over de WIA? Wat je meestuurt, wat je aan je werkgever vraagt en wat er gebeurt als er iets ontbreekt.",
    h1: "Brief van UWV over je WIA-aanvraag: wat moet je regelen?",
    lead: "Ben je bijna twee jaar ziek, dan krijg je in week 88 een brief van UWV over de WIA-uitkering. Dit stuur je mee, en dit vraag je aan je werkgever.",
    actie: WERKNEMER_ACTIE,
    bronnen: [BRON.wia, BRON.verslag, BRON.eind, BRON.uitstel, BRON.werkwijzer],
    inhoud: (
      <>
        <h2>De brief in week 88</h2>
        <p>
          In de 88e week van je ziekte stuurt UWV je een brief over de WIA-uitkering en hoe je die aanvraagt. Je
          hebt daarna 6 weken. De uiterste datum staat in de brief. Wacht niet tot het laatst: je hebt stukken van
          je werkgever nodig.
        </p>

        <h2>Wat je meestuurt</h2>
        <ul>
          <li>Het aanvraagformulier. Daarop geef je ook je eigen oordeel over hoe de re-integratie is gegaan.</li>
          <li>Het re-integratieverslag: de probleemanalyse, het plan van aanpak met bijstellingen, de <a href="/eerstejaarsevaluatie/">eerstejaarsevaluatie</a>, het actueel oordeel van de bedrijfsarts en de <a href="/eindevaluatie/">eindevaluatie</a>.</li>
          <li>De medische informatie. Die vult de bedrijfsarts samen met jou in. Jij stuurt hem zelf naar UWV; je werkgever mag dat niet.</li>
          <li>Je eerste ziektedag, je opleidingen en cursussen en je rekeningnummer.</li>
        </ul>
        <p>
          Je werkgever mag het verslag alleen zelf bij UWV uploaden als jullie dat allebei willen.
        </p>

        <h2>Wat je aan je werkgever vraagt</h2>
        <ul>
          <li>Kopieën van alle stukken van het re-integratieverslag. Je werkgever moet die aan jou geven.</li>
          <li>Een afspraak voor de eindevaluatie. Die vullen jullie samen in, uiterlijk 2 weken voordat je de aanvraag moet opsturen.</li>
          <li>Ben je het ergens niet mee eens, zeg dat dan in de eindevaluatie en op je aanvraagformulier.</li>
        </ul>

        <h2>Als er iets ontbreekt</h2>
        <p>
          Mist er een stuk, dan kan UWV je aanvraag nog niet beoordelen. Ligt dat aan jou, dan krijg je 5
          werkdagen om het aan te vullen. Lukt dat niet, dan neemt UWV je aanvraag niet in behandeling. Ligt het
          aan je werkgever, dan krijgt die de kans om het aan te vullen. Lukt dat niet, dan moet je werkgever je
          loon langer doorbetalen.
        </p>

        <h2>Later aanvragen kan ook</h2>
        <p>
          Je werkgever en jij kunnen samen afspreken dat je werkgever je loon langer doorbetaalt. De WIA-aanvraag
          schuift dan op. Dat vragen jullie samen aan bij UWV, met een formulier dat jullie allebei ondertekenen.
        </p>

        <h2>Hoe ik help</h2>
        <p>
          We lopen samen na of je alle stukken hebt, wat er nog moet gebeuren en wat je aan je werkgever vraagt. Ik
          help je om je eigen mening op papier te zetten. Heb je een conflict met je werkgever, dan verwijs ik je
          naar een jurist.
        </p>
      </>
    ),
  },
];

function Actie({ a, tweede }) {
  return (
    <section className={"artikel-actie" + (tweede ? " artikel-actie--tweede" : "")} aria-label={a.kop}>
      <h2>{a.kop}</h2>
      <p>{a.tekst}</p>
      <div className="acties">
        <a className={tweede ? "btn btn--quiet" : "btn"} href={a.href}>{a.knop}</a>
        <a className="artikel-meer" href={a.meer.href}>{a.meer.tekst}</a>
      </div>
    </section>
  );
}

export function Artikel({ artikel }) {
  const verder = ARTIKEL_LINKS.filter((l) => l.href !== "/" + artikel.slug + "/");
  return (
    <div className="site">
      <Nav basis="/" />
      <main>
        <article className="artikel">
          <header className="container artikel-kop">
            <nav className="kruimel" aria-label="Kruimelpad">
              <a href="/">Poortwachtercheck</a> <span aria-hidden="true">/</span> <span>{artikel.kort}</span>
            </nav>
            <h1>{artikel.h1}</h1>
            <p className="lead">{artikel.lead}</p>
            <p className="artikel-meta">
              Door <a href="/#contact">Chris Schepers</a>, arbeidsdeskundige i.o. Bijgewerkt op{" "}
              <time dateTime={BIJGEWERKT.iso}>{BIJGEWERKT.tekst}</time>.
            </p>
          </header>
          <div className="container artikel-tekst">{artikel.inhoud}</div>
          <div className="container artikel-slot">
            <Actie a={artikel.actie} />
            {artikel.tweedeActie && <Actie a={artikel.tweedeActie} tweede />}
            <section className="artikel-bronnen" aria-labelledby={"bronnen-" + artikel.slug}>
              <h2 id={"bronnen-" + artikel.slug}>Bronnen</h2>
              <ul>
                {artikel.bronnen.map((b) => <li key={b.href}><a href={b.href} rel="noopener">{b.tekst}</a></li>)}
              </ul>
            </section>
            <nav className="artikel-verder" aria-labelledby={"verder-" + artikel.slug}>
              <h2 id={"verder-" + artikel.slug}>Lees verder</h2>
              <ul>{verder.map((l) => <li key={l.href}><a href={l.href}>{l.kort}</a></li>)}</ul>
            </nav>
          </div>
        </article>
      </main>
      <Footer basis="/" />
    </div>
  );
}

export const ARTIKEL_DATUM = BIJGEWERKT.iso;

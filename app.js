(() => {
  // src/iconen.jsx
  var I = {
    arrowLeft: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M19 12H5M11 18l-6-6 6-6" })),
    chevDown: /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M6 9l6 6 6-6" }))
  };

  // src/merk.jsx
  var MERK = "Poortwachtercheck";
  var CONTACT_MAIL = "contact@poortwachtercheck.nl";
  function mailto(onderwerp, tekst) {
    let url = "mailto:" + CONTACT_MAIL + "?subject=" + encodeURIComponent(onderwerp);
    if (tekst) url += "&body=" + encodeURIComponent(tekst);
    return url;
  }
  function Merk({ href, style, onClick }) {
    return /* @__PURE__ */ React.createElement("a", { className: "brand", href: href || "#top", style, onClick }, /* @__PURE__ */ React.createElement("span", null, MERK));
  }

  // src/landing.jsx
  var { useState } = React;
  function Nav() {
    return /* @__PURE__ */ React.createElement("header", { className: "nav" }, /* @__PURE__ */ React.createElement("div", { className: "wrap nav-inner" }, /* @__PURE__ */ React.createElement(Merk, null), /* @__PURE__ */ React.createElement("nav", { className: "nav-links" }, /* @__PURE__ */ React.createElement("a", { href: "#werkwijze" }, "Werkwijze"), /* @__PURE__ */ React.createElement("a", { href: "#tarieven" }, "Tarieven"), /* @__PURE__ */ React.createElement("a", { href: "#faq" }, "Vragen"), /* @__PURE__ */ React.createElement("a", { href: "#contact" }, "Contact"))));
  }
  function Hero() {
    return /* @__PURE__ */ React.createElement("section", { className: "hero", id: "top" }, /* @__PURE__ */ React.createElement("div", { className: "wrap hero-enkel" }, /* @__PURE__ */ React.createElement("div", { className: "reveal" }, /* @__PURE__ */ React.createElement("div", { className: "kop-balk" }, /* @__PURE__ */ React.createElement("h1", null, "Je re-integratieverslag compleet naar UWV"), /* @__PURE__ */ React.createElement("p", { className: "lead lead-breed" }, "Is je werknemer bijna twee jaar ziek? Ik kom langs en loop het verzuimdossier na. Ik kijk of alles erin zit, en of de niet-medische stukken inhoudelijk kloppen.")), /* @__PURE__ */ React.createElement("div", { className: "hero-cta" }, /* @__PURE__ */ React.createElement("a", { className: "btn btn-primary btn-lg", href: "#contact" }, "Dossier laten nakijken"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-ghost btn-lg", href: "#werkwijze" }, "Zo werk ik")), /* @__PURE__ */ React.createElement("p", { className: "hero-noot" }, "Vaste prijs per dossier. Ik kom bij je op locatie. Medische stukken blijven bij de bedrijfsarts."))));
  }
  function Probleem() {
    return /* @__PURE__ */ React.createElement("section", { className: "section", id: "waarom" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head reveal" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Waarom dit ertoe doet"), /* @__PURE__ */ React.createElement("h2", null, "Een ontbrekend stuk kan maanden loon kosten"), /* @__PURE__ */ React.createElement("p", null, "UWV kijkt eerst of het re-integratieverslag compleet is, en daarna naar de inhoud. Mist er een onderdeel of een handtekening, dan volgt een administratieve loonsanctie: je betaalt het loon langer door, tot het verslag in orde is. Vindt UWV dat er te weinig aan re-integratie is gedaan, bijvoorbeeld omdat het tweede spoor te laat begon, dan kan de loonsanctie oplopen tot een jaar.")), /* @__PURE__ */ React.createElement("p", { className: "cijfers-tekst reveal" }, "In 2024 legde UWV ruim 4.000 loonsancties op. Bij ongeveer 45% daarvan was het verslag niet compleet. Herstellen kost dan al snel drie weken beoordeling door UWV, en daarna loopt het loon nog zes weken door. Bij de rest ging het om de inhoud van de re-integratie."), /* @__PURE__ */ React.createElement("p", { className: "bron reveal" }, "Cijfers: ", /* @__PURE__ */ React.createElement("a", { href: "https://uwvjaarverslag.nl/external/asset/download/project/f9b7da0a-03ec-0000-58b5-7efa5990235f/name/uwv-kwantitatieve-Informatie-2025T3%202.0.pdf", target: "_blank", rel: "noopener" }, "UWV, kwantitatieve informatie"), ". Herstel en doorlooptijd: ", /* @__PURE__ */ React.createElement("a", { href: "https://www.rijksoverheid.nl/documenten/publicaties/2024/09/30/werkproces-uwv-toetsen-riv-en-opleggen-loonsanctie", target: "_blank", rel: "noopener" }, "werkproces UWV toetsen re-integratieverslag"), ".")));
  }
  var STAPPEN = [
    { t: "Kennismaken", d: "We bellen kort. Je hoort wat ik nodig heb en wat het kost. De prijs staat vooraf vast." },
    { t: "Dossier nalopen", d: "Ik kom langs en loop het dossier na: elk onderdeel, elke datum en elke handtekening. Ook de inhoud van alle niet-medische stukken: klopt het verloop, en is er op tijd bijgestuurd?" },
    { t: "Aanvullen", d: "Je krijgt een lijst met wat ontbreekt of niet klopt, en wat je eraan kunt doen. Als je dat wilt, help ik met de eindevaluatie en met het bijwerken van de stukken." },
    { t: "Verzendklaar", d: "Het verslag ligt compleet en ondertekend klaar voor je werknemer, op tijd voor de WIA-aanvraag." }
  ];
  function Werkwijze() {
    return /* @__PURE__ */ React.createElement("section", { className: "section tint", id: "werkwijze" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head reveal" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Werkwijze"), /* @__PURE__ */ React.createElement("h2", null, "Van losse stukken naar een compleet verslag"), /* @__PURE__ */ React.createElement("p", null, "Het beste moment is ruim v\xF3\xF3r week 88. Dan is er nog tijd om iets te herstellen.")), /* @__PURE__ */ React.createElement("div", { className: "steps" }, STAPPEN.map((s, i) => /* @__PURE__ */ React.createElement("div", { className: "step reveal", key: i }, /* @__PURE__ */ React.createElement("div", { className: "line" }), /* @__PURE__ */ React.createElement("div", { className: "num" }, i + 1), /* @__PURE__ */ React.createElement("h3", null, s.t), /* @__PURE__ */ React.createElement("p", null, s.d))))));
  }
  var PAKKETTEN = [
    {
      naam: "Dossiercheck",
      prijs: "vanaf \u20AC 450",
      sub: "per dossier, excl. btw",
      d: "Je wilt weten of het verslag compleet is en klopt.",
      punten: ["Bezoek op locatie", "Controle van elk onderdeel, elke datum en handtekening", "Inhoudelijke controle van alle niet-medische stukken", "Heldere lijst met wat ontbreekt of niet klopt, en wat je moet doen"]
    },
    {
      naam: "Compleet verzorgd",
      prijs: "vanaf \u20AC 950",
      sub: "per dossier, excl. btw",
      d: "Je wilt dat het geregeld wordt.",
      punten: ["Alles uit de dossiercheck", "Hulp bij de eindevaluatie en het bijwerken van de stukken", "Bewaken dat de bedrijfsarts de medische informatie verstuurt", "Het verslag verzendklaar voor je werknemer"]
    },
    {
      naam: "Contact met UWV",
      prijs: "in overleg",
      sub: "als aanvulling",
      d: "Je wilt een vast aanspreekpunt als UWV vragen heeft.",
      punten: ["Met een machtiging van jou als werkgever", "Ik beantwoord aanvullende vragen over het dossier", "Jij blijft op de hoogte van elk contact"]
    }
  ];
  function Tarieven() {
    return /* @__PURE__ */ React.createElement("section", { className: "section", id: "tarieven" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head reveal" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Tarieven"), /* @__PURE__ */ React.createElement("h2", null, "Een vaste prijs per dossier"), /* @__PURE__ */ React.createElement("p", null, "Geen uurtje-factuurtje. Je weet vooraf wat het kost, en dat is een fractie van \xE9\xE9n maand doorbetaald loon.")), /* @__PURE__ */ React.createElement("div", { className: "pakketten" }, PAKKETTEN.map((p, i) => /* @__PURE__ */ React.createElement("div", { className: "pakket card reveal", key: i }, /* @__PURE__ */ React.createElement("h3", null, p.naam), /* @__PURE__ */ React.createElement("p", { className: "pakket-d" }, p.d), /* @__PURE__ */ React.createElement("div", { className: "pakket-prijs" }, p.prijs), /* @__PURE__ */ React.createElement("div", { className: "pakket-sub" }, p.sub), /* @__PURE__ */ React.createElement("ul", null, p.punten.map((x, j) => /* @__PURE__ */ React.createElement("li", { key: j }, x))), /* @__PURE__ */ React.createElement("a", { className: "btn btn-ghost", href: mailto(p.naam + " aanvragen") }, "Aanvragen"))))));
  }
  var WERKNEMER_PUNTEN = [
    "We lopen samen na of je alle stukken van je werkgever hebt gekregen.",
    "Je weet wat er nog moet gebeuren en wat je daarvoor aan je werkgever vraagt.",
    "Ik help je om je eigen mening in de eindevaluatie op papier te zetten.",
    "Je weet wat je kunt verwachten van de gesprekken bij UWV."
  ];
  function Werknemers() {
    const tekst = "Ik wil graag dat je meekijkt met mijn re-integratieverslag.\n\nEerste ziektedag:\nWoonplaats:\nTelefoonnummer:";
    return /* @__PURE__ */ React.createElement("section", { className: "section", id: "werknemers" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head reveal" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Voor werknemers"), /* @__PURE__ */ React.createElement("h2", null, "Ben je zelf ziek en komt de WIA-aanvraag eraan?"), /* @__PURE__ */ React.createElement("p", null, "Je werkgever maakt het re-integratieverslag en dat gaat mee met je WIA-aanvraag. Mist er iets, dan kan UWV je aanvraag nog niet beoordelen. Ik kijk met je mee, zodat je weet waar je staat.")), /* @__PURE__ */ React.createElement("div", { className: "werknemers-grid" }, /* @__PURE__ */ React.createElement("div", { className: "reveal" }, /* @__PURE__ */ React.createElement("ul", { className: "werknemers-lijst" }, WERKNEMER_PUNTEN.map((x, i) => /* @__PURE__ */ React.createElement("li", { key: i }, x))), /* @__PURE__ */ React.createElement("p", { className: "werknemers-noot" }, "Ik help nooit werkgever en werknemer in hetzelfde dossier. Medische stukken hoef ik niet te zien, dus zet die ook niet in je bericht. Heb je een conflict met je werkgever, dan verwijs ik je naar een jurist.")), /* @__PURE__ */ React.createElement("div", { className: "pakket card reveal" }, /* @__PURE__ */ React.createElement("h3", null, "Meekijken met je verslag"), /* @__PURE__ */ React.createElement("p", { className: "pakket-d" }, "E\xE9n gesprek van anderhalf uur, bij je thuis of met beeldbellen."), /* @__PURE__ */ React.createElement("div", { className: "pakket-prijs" }, "\u20AC 195"), /* @__PURE__ */ React.createElement("div", { className: "pakket-sub" }, "inclusief btw"), /* @__PURE__ */ React.createElement("a", { className: "btn btn-ghost", href: mailto("Meekijken als werknemer", tekst) }, "Vraag het aan")))));
  }
  var AFSPRAKEN = [
    { t: "Ik zie geen medische stukken", d: "Die horen bij de bedrijfsarts. Ik bewaak alleen dat hij ze op tijd naar UWV of je werknemer stuurt." },
    { t: "Ik beloof geen uitkomst", d: "Ik loop ook de inhoud na en wijs je op zwakke plekken. Dat verkleint het risico op een sanctie, maar het oordeel ligt bij UWV." },
    { t: "Afspraken staan op papier", d: "Je krijgt een verwerkersovereenkomst. Voor contact met UWV teken je een machtiging." },
    { t: "Zorgvuldig met het dossier", d: "Ik gebruik de gegevens alleen voor deze opdracht. Kopie\xEBn bewaar ik tot UWV over de WIA-aanvraag heeft beslist." }
  ];
  function Afspraken() {
    return /* @__PURE__ */ React.createElement("section", { className: "section tint", id: "afspraken" }, /* @__PURE__ */ React.createElement("div", { className: "wrap compliance" }, /* @__PURE__ */ React.createElement("div", { className: "reveal" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Wat je van mij mag verwachten"), /* @__PURE__ */ React.createElement("h2", { style: { fontSize: "clamp(27px,3.2vw,38px)", marginTop: 14 } }, "Duidelijk over wat ik wel en niet doe"), /* @__PURE__ */ React.createElement("div", { className: "comp-list" }, AFSPRAKEN.map((c, i) => /* @__PURE__ */ React.createElement("div", { className: "comp-item", key: i }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, c.t), /* @__PURE__ */ React.createElement("p", null, c.d)))))), /* @__PURE__ */ React.createElement("div", { className: "over-mij reveal" }, /* @__PURE__ */ React.createElement("div", { className: "over-kop" }, /* @__PURE__ */ React.createElement("img", { src: "img/chris-schepers.jpg", alt: "Chris Schepers", width: "96", height: "96", loading: "lazy" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", null, "Chris Schepers"), /* @__PURE__ */ React.createElement("p", { className: "over-rol" }, "Arbeidsdeskundige i.o."))), /* @__PURE__ */ React.createElement("p", null, "Ik werk als casemanager met werkgevers en werknemers bij langdurig verzuim. Ik weet waar een dossier op vastloopt en waar UWV op let."), /* @__PURE__ */ React.createElement("p", null, "Je schakelt mij in voor het laatste stuk: de eindevaluatie en het verslag. Dat kan ook als je al een arbodienst hebt."), /* @__PURE__ */ React.createElement("a", { className: "btn btn-accent", href: "#contact" }, "Plan een kennismaking"))));
  }
  var FAQS = [
    { q: "Wat is een administratieve loonsanctie?", a: "UWV toetst eerst of het re-integratieverslag compleet is. Ontbreekt er een verplicht onderdeel, dan kan UWV de re-integratie niet beoordelen en moet je het loon langer doorbetalen. Die verlenging stopt pas nadat je het ontbrekende hebt aangeleverd en UWV dat heeft beoordeeld." },
    { q: "Kijk je alleen of alles erin zit?", a: "Nee. Ik loop alle niet-medische stukken ook inhoudelijk na. Kloppen de data en afspraken? Sluit het plan van aanpak aan op het advies van de bedrijfsarts? Is het plan bijgesteld toen de situatie veranderde, en is het tweede spoor op tijd ingezet? Medische stukken blijven bij de bedrijfsarts." },
    { q: "Wanneer schakel ik je in?", a: "Het liefst rond week 80 tot 88 van het verzuim. Dan is er nog tijd om iets te herstellen voordat je werknemer de WIA aanvraagt. Later kan ook, maar dan is de ruimte kleiner. Eerder mag altijd, bijvoorbeeld bij de eerstejaarsevaluatie." },
    { q: "Ik heb al een arbodienst. Heeft dit dan zin?", a: "Ja. De arbodienst levert de bedrijfsarts en vaak een deel van de begeleiding, maar de werkgever blijft verantwoordelijk voor een compleet verslag. Ik kijk als tweede paar ogen of alles er is en klopt." },
    { q: "Zie je medische gegevens?", a: "Nee. Het medische deel gaat van de bedrijfsarts rechtstreeks naar UWV of naar je werknemer. Ik controleer alleen of dat is gebeurd." },
    { q: "Garandeer je dat er geen loonsanctie komt?", a: "Nee, en dat kan niemand eerlijk beloven. Ik zorg dat het verslag compleet is en loop alle niet-medische stukken ook inhoudelijk na. Zie ik een zwakke plek, dan hoor je dat op tijd, zodat je nog kunt bijsturen of het goed kunt onderbouwen. Het oordeel ligt bij UWV." },
    { q: "Ik ben werknemer. Kan ik je ook inschakelen?", a: "Ja. Als werknemer heb je hetzelfde belang: met een compleet verslag kan UWV je WIA-aanvraag zonder vertraging behandelen. In \xE9\xE9n gesprek lopen we na wat je van je werkgever moet krijgen. Dat kost \u20AC 195 inclusief btw. Ik help nooit werkgever en werknemer in hetzelfde dossier." },
    { q: "In welke regio werk je?", a: "Dat hoor je bij de kennismaking. Is een bezoek niet praktisch, dan kan de controle ook op afstand, met stukken zonder medische informatie." }
  ];
  function Faq() {
    const [open, setOpen] = useState(0);
    return /* @__PURE__ */ React.createElement("section", { className: "section tint", id: "faq" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "sec-head center reveal" }, /* @__PURE__ */ React.createElement("span", { className: "eyebrow" }, /* @__PURE__ */ React.createElement("span", { className: "dot" }), "Veelgestelde vragen"), /* @__PURE__ */ React.createElement("h2", null, "Goed om te weten")), /* @__PURE__ */ React.createElement("div", { className: "faq" }, FAQS.map((f, i) => /* @__PURE__ */ React.createElement("div", { className: "faq-item reveal" + (open === i ? " open" : ""), key: i }, /* @__PURE__ */ React.createElement("button", { className: "faq-q", onClick: () => setOpen(open === i ? -1 : i), "aria-expanded": open === i }, f.q, /* @__PURE__ */ React.createElement("span", { className: "chev" }, I.chevDown)), /* @__PURE__ */ React.createElement("div", { className: "faq-a", style: { maxHeight: open === i ? 320 : 0 } }, /* @__PURE__ */ React.createElement("div", { className: "faq-a-inner" }, f.a)))))));
  }
  function Contact() {
    const tekst = "Ik wil graag een kennismaking over mijn verzuimdossier.\n\nEerste ziektedag:\nBedrijfsnaam en plaats:\nTelefoonnummer:";
    return /* @__PURE__ */ React.createElement("section", { className: "section", id: "contact" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "cta-band reveal" }, /* @__PURE__ */ React.createElement("h2", null, "Laat je dossier nakijken voordat UWV het doet"), /* @__PURE__ */ React.createElement("p", null, "Stuur een bericht met de eerste ziektedag en je telefoonnummer. Ik bel je terug voor een korte kennismaking. Zet geen medische gegevens in je bericht."), /* @__PURE__ */ React.createElement("div", { className: "hero-cta" }, /* @__PURE__ */ React.createElement("a", { className: "btn btn-accent btn-lg", href: mailto("Kennismaking dossiercheck", tekst) }, "Stuur een bericht")))));
  }
  function Footer({ onOpenPrivacy }) {
    const openPrivacy = (e) => {
      e.preventDefault();
      onOpenPrivacy && onOpenPrivacy();
    };
    return /* @__PURE__ */ React.createElement("footer", { className: "footer" }, /* @__PURE__ */ React.createElement("div", { className: "wrap" }, /* @__PURE__ */ React.createElement("div", { className: "footer-grid" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(Merk, { style: { marginBottom: 14 } }), /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14.5, maxWidth: "34ch", color: "rgba(255,255,255,.6)" } }, "Controle en begeleiding van het re-integratieverslag, zodat het compleet naar UWV gaat.")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, "Dienst"), /* @__PURE__ */ React.createElement("a", { href: "#werkwijze" }, "Werkwijze"), /* @__PURE__ */ React.createElement("a", { href: "#tarieven" }, "Tarieven"), /* @__PURE__ */ React.createElement("a", { href: "#werknemers" }, "Voor werknemers")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, "Privacy"), /* @__PURE__ */ React.createElement("a", { href: "#privacyverklaring", onClick: openPrivacy }, "Privacyverklaring"), /* @__PURE__ */ React.createElement("a", { href: mailto("Verwerkersovereenkomst") }, "Verwerkersovereenkomst")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h4", null, "Contact"), /* @__PURE__ */ React.createElement("a", { href: "mailto:" + CONTACT_MAIL }, CONTACT_MAIL), /* @__PURE__ */ React.createElement("span", { style: { display: "block", padding: "5px 0", fontSize: 15 } }, "Schepers Digital"), /* @__PURE__ */ React.createElement("span", { style: { display: "block", padding: "5px 0", fontSize: 15 } }, "De Vaandeldrager 13, 6921 TK Duiven"), /* @__PURE__ */ React.createElement("span", { style: { display: "block", padding: "5px 0", fontSize: 15 } }, "KVK 42107874"), /* @__PURE__ */ React.createElement("span", { style: { display: "block", padding: "5px 0", fontSize: 15 } }, "Btw NL004512417B86"))), /* @__PURE__ */ React.createElement("div", { className: "footer-bot" }, /* @__PURE__ */ React.createElement("span", null, "\xA9 2026 ", MERK, " \xB7 onderdeel van Schepers Digital \xB7 KVK 42107874"), /* @__PURE__ */ React.createElement("span", null, "Geen garantie op de uitkomst van de toets"))));
  }
  function Landing({ onOpenPrivacy }) {
    return /* @__PURE__ */ React.createElement("div", { className: "site" }, /* @__PURE__ */ React.createElement(Nav, null), /* @__PURE__ */ React.createElement(Hero, null), /* @__PURE__ */ React.createElement(Probleem, null), /* @__PURE__ */ React.createElement(Werkwijze, null), /* @__PURE__ */ React.createElement(Tarieven, null), /* @__PURE__ */ React.createElement(Werknemers, null), /* @__PURE__ */ React.createElement(Afspraken, null), /* @__PURE__ */ React.createElement(Faq, null), /* @__PURE__ */ React.createElement(Contact, null), /* @__PURE__ */ React.createElement(Footer, { onOpenPrivacy }));
  }

  // src/privacy.jsx
  var NAVY = "var(--navy)";
  function Sectie({ nr, titel, children }) {
    return /* @__PURE__ */ React.createElement("section", { style: { marginTop: 30 } }, /* @__PURE__ */ React.createElement("h2", { style: { fontSize: 21, color: "var(--navy-900)", display: "flex", alignItems: "baseline", gap: 10 } }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, fontWeight: 700, color: "var(--navy-400)" } }, nr), titel), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 10, color: "var(--ink-soft)", fontSize: 15.5, lineHeight: 1.65 } }, children));
  }
  var lijst = { paddingLeft: 20, display: "grid", gap: 8 };
  function PrivacyVerklaring({ onClose }) {
    React.useEffect(() => {
      const body = document.querySelector(".legal-body");
      if (body) body.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    }, []);
    return /* @__PURE__ */ React.createElement("div", { className: "tool" }, /* @__PURE__ */ React.createElement("div", { className: "tool-bar" }, /* @__PURE__ */ React.createElement("div", { className: "tool-bar-inner" }, /* @__PURE__ */ React.createElement(Merk, { href: "#top", onClick: (e) => {
      e.preventDefault();
      onClose();
    } }), /* @__PURE__ */ React.createElement("button", { className: "tool-back", onClick: onClose, style: { marginLeft: "auto" } }, I.arrowLeft, " Terug naar site"))), /* @__PURE__ */ React.createElement("div", { className: "tool-body legal-body" }, /* @__PURE__ */ React.createElement("div", { style: { maxWidth: 760, margin: "0 auto", padding: "8px 4px 60px" } }, /* @__PURE__ */ React.createElement("h1", { style: { fontSize: "clamp(28px,4vw,38px)", color: "var(--navy-900)", marginTop: 8 } }, "Privacyverklaring"), /* @__PURE__ */ React.createElement("p", { style: { color: "var(--muted)", fontSize: 15, marginTop: 8 } }, "Poortwachtercheck (poortwachtercheck.nl) \xB7 versie 22 november 2026 \xB7 Schepers Digital \xB7 KVK 42107874"), /* @__PURE__ */ React.createElement("div", { style: {
      marginTop: 20,
      padding: "16px 18px",
      background: "var(--navy-50)",
      border: "1px solid var(--navy-100)",
      borderRadius: 12,
      fontSize: 14.5,
      color: "var(--ink-soft)",
      lineHeight: 1.6
    } }, /* @__PURE__ */ React.createElement("strong", null, "Kort:"), " ik gebruik het verzuimdossier alleen om het re-integratieverslag na te kijken en op orde te brengen, in opdracht van de werkgever of van de werknemer zelf. Medische stukken vraag ik niet op; die horen bij de bedrijfsarts. Kopie\xEBn bewaar ik tot en met de beschikking van UWV op de WIA-aanvraag en daarna verwijder ik ze."), /* @__PURE__ */ React.createElement(Sectie, { nr: "1", titel: "Wie is verantwoordelijk?" }, /* @__PURE__ */ React.createElement("p", null, "Poortwachtercheck is een dienst van Schepers Digital (KVK 42107874). Ik controleer en begeleid het re-integratieverslag in opdracht van werkgevers. Werknemers kunnen mij ook zelf inschakelen om mee te kijken."), /* @__PURE__ */ React.createElement("ul", { style: { ...lijst, marginTop: 10 } }, /* @__PURE__ */ React.createElement("li", null, "Voor de gegevens van de zieke werknemer is de ", /* @__PURE__ */ React.createElement("strong", null, "werkgever"), " verantwoordelijk. Ik ben", /* @__PURE__ */ React.createElement("strong", null, " verwerker"), ": ik werk alleen in opdracht van de werkgever en volgens de verwerkersovereenkomst die we samen tekenen."), /* @__PURE__ */ React.createElement("li", null, "Schakel je mij als werknemer zelf in, dan ben ik voor jouw gegevens zelf verantwoordelijk."), /* @__PURE__ */ React.createElement("li", null, "Voor de gegevens van mijn opdrachtgever (contactpersoon, offerte, factuur) ben ik zelf verantwoordelijk."))), /* @__PURE__ */ React.createElement(Sectie, { nr: "2", titel: "Welke gegevens?" }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, "Van de opdrachtgever:"), " naam, e-mailadres en telefoonnummer, en bij een werkgever ook de functie van de contactpersoon en de bedrijfsgegevens."), /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("strong", null, "Van de werknemer:"), " naam, functie, de eerste ziektedag en de andere data uit het dossier, en de stukken van het re-integratiedossier: probleemanalyse, plan van aanpak en bijstellingen, evaluaties, eerstejaarsevaluatie, eindevaluatie en, als die er zijn, rapporten van de arbeidsdeskundige en verslagen van het tweede spoor."), /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10 } }, /* @__PURE__ */ React.createElement("strong", null, "Niet:"), " medische stukken, zoals diagnose, behandeling of het medisch dossier. Die blijven bij de bedrijfsarts. Stuur ze niet mee."), /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10 } }, "Ook zonder medische stukken staan er in het dossier gegevens over het verzuim en over wat de werknemer wel en niet kan. Volgens de AVG zijn dat gezondheidsgegevens. De werkgever mag die gebruiken voor de re-integratie (artikel 30 UAVG); ik verwerk ze alleen in zijn opdracht en voor dat doel."), /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10 } }, "Schakel je mij als werknemer zelf in, dan gebruik ik die gegevens alleen met jouw uitdrukkelijke toestemming (artikel 9 AVG) en alleen om met je mee te kijken. Je kunt die toestemming altijd intrekken.")), /* @__PURE__ */ React.createElement(Sectie, { nr: "3", titel: "Waarvoor gebruik ik de gegevens?" }, /* @__PURE__ */ React.createElement("ul", { style: lijst }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "De dossiercheck en begeleiding uitvoeren."), " De werkgever is wettelijk verplicht het re-integratieverslag op te stellen (Wet verbetering poortwachter). Ik help daarbij in zijn opdracht."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Meekijken met een werknemer"), " die mij zelf inschakelt, op basis van de afspraak met die werknemer en diens uitdrukkelijke toestemming."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Contact met UWV namens de werkgever,"), " alleen als dat bij de opdracht hoort en met een getekende machtiging."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Offerte, factuur en administratie,"), " omdat we een overeenkomst hebben en de wet mij verplicht de administratie te bewaren.")), /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10 } }, "Ik gebruik de gegevens niet voor iets anders. Ik verkoop ze niet en deel ze niet met anderen, behalve met UWV als dat bij de opdracht hoort.")), /* @__PURE__ */ React.createElement(Sectie, { nr: "4", titel: "Hoe krijg ik de stukken?" }, /* @__PURE__ */ React.createElement("ul", { style: lijst }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Op locatie:"), " ik bekijk het dossier bij je op kantoor, of als werknemer bij je thuis."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Op afstand:"), " je stuurt mij kopie\xEBn van de stukken. Stuur alleen wat ik nodig heb, zonder medische informatie."))), /* @__PURE__ */ React.createElement(Sectie, { nr: "5", titel: "Hoe lang bewaar ik iets?" }, /* @__PURE__ */ React.createElement("ul", { style: lijst }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Kopie\xEBn uit het dossier:"), " tot en met de beschikking van UWV op de WIA-aanvraag. Daarna verwijder ik de digitale kopie\xEBn en vernietig ik papieren kopie\xEBn."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Gegevens van de opdrachtgever en facturen:"), " 7 jaar, omdat de belastingwet dat verplicht."))), /* @__PURE__ */ React.createElement(Sectie, { nr: "6", titel: "Beveiliging" }, /* @__PURE__ */ React.createElement("p", null, "Alleen ik heb toegang tot de kopie\xEBn. Ik bewaar en verstuur ze niet op een plek waar anderen erbij kunnen. Stukken die je per e-mail stuurt naar ", CONTACT_MAIL, ", worden doorgestuurd naar mijn mailbox bij Google (Gmail). Google kan die gegevens ook buiten de EU opslaan en valt daarvoor onder het EU-VS Data Privacy Framework. Gaat er toch iets mis met de gegevens van een werknemer, dan meld ik dat meteen aan de werkgever, zodat die kan beoordelen of het een datalek is dat gemeld moet worden. Help ik een werknemer zelf, dan meld ik het aan die werknemer en, als dat moet, aan de Autoriteit Persoonsgegevens.")), /* @__PURE__ */ React.createElement(Sectie, { nr: "7", titel: "Deze website" }, /* @__PURE__ */ React.createElement("ul", { style: lijst }, /* @__PURE__ */ React.createElement("li", null, "Geen cookies, geen analytics en geen advertenties."), /* @__PURE__ */ React.createElement("li", null, "De site staat bij GitHub Pages en laadt het lettertype van Google Fonts. Zoals bij elke website zien die daarbij je IP-adres."))), /* @__PURE__ */ React.createElement(Sectie, { nr: "8", titel: "Je rechten" }, /* @__PURE__ */ React.createElement("p", null, "Je hebt recht op inzage, correctie, verwijdering, beperking en bezwaar."), /* @__PURE__ */ React.createElement("ul", { style: { ...lijst, marginTop: 10 } }, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Werknemer:"), " een verzoek over je verzuimdossier doe je bij je werkgever, want die is verantwoordelijk. Ik help je werkgever daarbij. Heb je mij zelf ingeschakeld, mail mij dan."), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Opdrachtgever:"), " mail mij op het adres hieronder.")), /* @__PURE__ */ React.createElement("p", { style: { marginTop: 10 } }, "Ben je het niet eens met hoe ik met gegevens omga? Dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens.")), /* @__PURE__ */ React.createElement(Sectie, { nr: "9", titel: "Contact" }, /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("a", { href: "mailto:" + CONTACT_MAIL, style: { color: NAVY, fontWeight: 600 } }, CONTACT_MAIL), /* @__PURE__ */ React.createElement("br", null), "Schepers Digital \xB7 De Vaandeldrager 13, 6921 TK Duiven", /* @__PURE__ */ React.createElement("br", null), "KVK 42107874 \xB7 poortwachtercheck.nl")))));
  }

  // src/app.jsx
  var { useState: useState2, useEffect } = React;
  function useReveal() {
    useEffect(() => {
      document.documentElement.classList.add("js-reveal");
      const reveal = () => {
        document.querySelectorAll(".reveal:not(.in)").forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add("in");
        });
      };
      reveal();
      requestAnimationFrame(reveal);
      window.addEventListener("scroll", reveal, { passive: true, capture: true });
      window.addEventListener("resize", reveal);
      return () => {
        window.removeEventListener("scroll", reveal, { capture: true });
        window.removeEventListener("resize", reveal);
      };
    }, []);
  }
  function App() {
    const [view, setView] = useState2("landing");
    useReveal();
    useEffect(() => {
      document.body.style.overflow = view === "landing" ? "" : "hidden";
    }, [view]);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Landing, { onOpenPrivacy: () => setView("privacy") }), view === "privacy" && /* @__PURE__ */ React.createElement(PrivacyVerklaring, { onClose: () => setView("landing") }));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/* @__PURE__ */ React.createElement(App, null));
})();

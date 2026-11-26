(() => {
  // src/iconen.jsx
  var svg = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", focusable: "false" };
  var I = {
    arrowLeft: /* @__PURE__ */ React.createElement("svg", { ...svg, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M19 12H5M11 18l-6-6 6-6" })),
    chevDown: /* @__PURE__ */ React.createElement("svg", { ...svg, "aria-hidden": "true" }, /* @__PURE__ */ React.createElement("path", { d: "M6 9l6 6 6-6" }))
  };

  // src/merk.jsx
  var CONTACT_MAIL = "contact@poortwachtercheck.nl";
  function mailto(onderwerp, tekst) {
    let url = "mailto:" + CONTACT_MAIL + "?subject=" + encodeURIComponent(onderwerp);
    if (tekst) url += "&body=" + encodeURIComponent(tekst);
    return url;
  }

  // src/landing.jsx
  var { useState } = React;
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
  var OVERZICHT = [
    ...PAKKETTEN.map((p) => ({ naam: p.naam, prijs: p.prijs, btw: p.prijs.startsWith("vanaf") ? "excl. btw" : "", href: "#tarieven" })),
    { naam: "Meekijken als werknemer", prijs: "\u20AC 195", btw: "incl. btw", href: "#werknemers" }
  ];

  // src/termijnen.jsx
  var { useState: useState2 } = React;
  var DAG = 864e5;
  var begin = (start, n) => new Date(start.getTime() + (n - 1) * 7 * DAG);
  var eind = (start, n) => new Date(start.getTime() + (n * 7 - 1) * DAG);
  var MAANDEN = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  var DAGEN = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  var datumTekst = (d) => `${DAGEN[d.getUTCDay()]} ${d.getUTCDate()} ${MAANDEN[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  function leesDatum(waarde) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(waarde || "");
    if (!m) return null;
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return d.getUTCMonth() === +m[2] - 1 ? d : null;
  }
  var hulp = (onderwerp) => ({ onderwerp, href: mailto(onderwerp, "Ik heb een vraag over de termijnen van de Wet poortwachter.\n\nEerste ziektedag:\nBedrijfsnaam en plaats:\nTelefoonnummer:") });
  var TERMIJNEN = [
    {
      week: "Week 1",
      titel: "Ziekmelding bij de bedrijfsarts of arbodienst",
      uitleg: "Meld je werknemer binnen een week ziek bij de bedrijfsarts of arbodienst. Het verzuimdossier begint op de eerste ziektedag.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 1) })
    },
    {
      week: "Week 6",
      titel: "Probleemanalyse",
      uitleg: "De bedrijfsarts beschrijft wat je werknemer nog kan, wat terugkeer in de weg staat en wat het advies is.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 6) })
    },
    {
      week: "Week 6 tot 68",
      titel: "Vervroegde IVA-aanvraag (mogelijk)",
      uitgebreid: true,
      uitleg: "Is er geen of nauwelijks kans op herstel, dan kan je werknemer eerder een IVA-uitkering aanvragen. Dat kan tot en met week 68.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 68), van: begin(s, 6) })
    },
    {
      week: "Week 8",
      titel: "Plan van aanpak",
      link: "/plan-van-aanpak/",
      uitleg: "Werkgever en werknemer leggen samen het doel en de afspraken vast, op basis van het advies van de bedrijfsarts. Wijs ook een casemanager aan.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 8) }),
      hulp: hulp("Plan van aanpak")
    },
    {
      week: "Vanaf week 8",
      titel: "Voortgang bespreken en het plan bijstellen",
      uitgebreid: true,
      uitleg: "Bespreek regelmatig, minstens eens per zes weken, hoe het gaat. Verandert de situatie, stel het plan van aanpak dan bij en leg dat vast. Loopt het vast, dan kan een deskundigenoordeel bij UWV helpen.",
      wanneer: () => null
    },
    {
      week: "Rond week 40",
      titel: "Arbeidsdeskundig onderzoek (aanbevolen)",
      uitgebreid: true,
      uitleg: "Is volledige terugkeer in het eigen werk niet in zicht, laat dan v\xF3\xF3r de eerstejaarsevaluatie onderzoeken wat er nog wel kan, bij jou of elders. Dat geeft een stevige basis voor spoor 1 en spoor 2.",
      wanneer: (s) => ({ tekst: "rond", datum: begin(s, 40) }),
      hulp: hulp("Arbeidsdeskundig onderzoek")
    },
    {
      week: "Week 42",
      titel: "42e-weeksmelding bij UWV",
      uitleg: "Meld bij UWV dat je werknemer nog ziek is. Doe dat uiterlijk in de 42e week.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 42) })
    },
    {
      week: "Week 46 tot 52",
      titel: "Eerstejaarsevaluatie",
      link: "/eerstejaarsevaluatie/",
      uitleg: "Kijk samen terug op het eerste jaar en kies het doel voor het tweede jaar.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 52), van: begin(s, 46) }),
      hulp: hulp("Eerstejaarsevaluatie")
    },
    {
      week: "Week 58",
      titel: "Spoor 2 inzetten",
      uitleg: "Is er geen zicht op passend werk in je eigen organisatie, dan moet uiterlijk zes weken na de eerstejaarsevaluatie het tweede spoor lopen: werk zoeken bij een andere werkgever.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 58) }),
      hulp: hulp("Spoor 2")
    },
    {
      week: "Rond week 88",
      titel: "Brief van UWV over de WIA-aanvraag",
      uitleg: "UWV stuurt je werknemer een brief met de uitnodiging om de WIA-uitkering aan te vragen. Tijd om het re-integratieverslag compleet te maken.",
      wanneer: (s) => ({ tekst: "rond", datum: begin(s, 88) }),
      hulp: hulp("Re-integratieverslag")
    },
    {
      week: "V\xF3\xF3r de aanvraag",
      titel: "Actueel oordeel en eindevaluatie",
      link: "/eindevaluatie/",
      uitgebreid: true,
      uitleg: "De bedrijfsarts schrijft het actueel oordeel. Daarna vullen werkgever en werknemer samen de eindevaluatie in.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 91) }),
      hulp: hulp("Eindevaluatie")
    },
    {
      week: "Week 91 tot 93",
      titel: "WIA-aanvraag met het volledige re-integratieverslag",
      link: "/wia-aanvraag-werknemer/",
      uitleg: "Je werknemer vraagt de WIA-uitkering aan, met het complete re-integratieverslag. Dat moet uiterlijk in week 93 bij UWV zijn.",
      wanneer: (s) => ({ tekst: "uiterlijk", datum: eind(s, 93), van: begin(s, 91) }),
      hulp: hulp("Re-integratieverslag week 93")
    },
    {
      week: "Week 104",
      titel: "Einde loondoorbetaling",
      uitleg: "Na 104 weken stopt de loondoorbetaling, tenzij UWV een loonsanctie oplegt. De WIA-uitkering kan de dag erna ingaan.",
      wanneer: (s) => ({ tekst: "laatste dag", datum: eind(s, 104) })
    }
  ];
  var UIT_DIENST = [
    {
      week: "V\xF3\xF3r week 6",
      titel: "Alleen een vragenlijst",
      uitleg: "Gaat je werknemer v\xF3\xF3r de zesde ziekteweek uit dienst, dan vult de werknemer bij de Ziektewet-aanvraag alleen een vragenlijst in.",
      wanneer: (s) => ({ tekst: "tot en met", datum: eind(s, 5) })
    },
    {
      week: "Week 6 tot 10",
      titel: "Verkort re-integratieverslag",
      uitleg: "Gaat je werknemer uit dienst tussen week 6 en week 10, dan lever je het verkorte re-integratieverslag aan.",
      wanneer: (s) => ({ tekst: "tot en met", datum: eind(s, 10), van: begin(s, 6) })
    },
    {
      week: "Vanaf week 10",
      titel: "Volledig re-integratieverslag",
      uitleg: "Gaat je werknemer na de tiende week uit dienst, dan lever je het volledige re-integratieverslag aan, met een eindevaluatie.",
      wanneer: (s) => ({ tekst: "vanaf", datum: begin(s, 11) }),
      hulp: hulp("Re-integratieverslag bij uitdiensttreding")
    }
  ];
  function Termijn({ t, start, vandaag }) {
    const w = start ? t.wanneer(start) : null;
    const voorbij = w && vandaag && w.datum < vandaag;
    return /* @__PURE__ */ React.createElement("li", { className: "termijn" + (voorbij ? " termijn--voorbij" : "") }, /* @__PURE__ */ React.createElement("div", { className: "termijn-wanneer" }, /* @__PURE__ */ React.createElement("span", { className: "termijn-week" }, t.week), w && /* @__PURE__ */ React.createElement("span", { className: "termijn-datum" }, w.van ? /* @__PURE__ */ React.createElement(React.Fragment, null, datumTekst(w.van), " tot en met ", datumTekst(w.datum)) : /* @__PURE__ */ React.createElement(React.Fragment, null, w.tekst, " ", datumTekst(w.datum)), voorbij && /* @__PURE__ */ React.createElement("span", { className: "termijn-status" }, " \xB7 voorbij"))), /* @__PURE__ */ React.createElement("div", { className: "termijn-wat" }, /* @__PURE__ */ React.createElement("h3", null, t.link ? /* @__PURE__ */ React.createElement("a", { href: t.link }, t.titel) : t.titel), /* @__PURE__ */ React.createElement("p", null, t.uitleg), t.hulp && /* @__PURE__ */ React.createElement("p", { className: "termijn-hulp" }, "Vragen hierover? Ik help je graag met begeleiding en ondersteuning. ", /* @__PURE__ */ React.createElement("a", { href: t.hulp.href }, "Stuur een bericht"), ".")));
  }
  var vandaagUTC = () => {
    const n = /* @__PURE__ */ new Date();
    return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  };
  function TermijnenTool() {
    const [waarde, setWaarde] = useState2("");
    const [uitgebreid, setUitgebreid] = useState2(false);
    const start = leesDatum(waarde);
    const vandaag = start ? vandaagUTC() : null;
    const lijst = TERMIJNEN.filter((t) => uitgebreid || !t.uitgebreid);
    return /* @__PURE__ */ React.createElement("div", { className: "termijnen" }, /* @__PURE__ */ React.createElement("form", { className: "termijnen-invoer", onSubmit: (e) => e.preventDefault() }, /* @__PURE__ */ React.createElement("div", { className: "veld" }, /* @__PURE__ */ React.createElement("label", { htmlFor: "eerste-ziektedag" }, "Eerste ziektedag"), /* @__PURE__ */ React.createElement("input", { id: "eerste-ziektedag", type: "date", value: waarde, onChange: (e) => setWaarde(e.target.value) })), /* @__PURE__ */ React.createElement("fieldset", { className: "weergave" }, /* @__PURE__ */ React.createElement("legend", null, "Weergave"), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "weergave", checked: !uitgebreid, onChange: () => setUitgebreid(false) }), " Vereenvoudigd"), /* @__PURE__ */ React.createElement("label", null, /* @__PURE__ */ React.createElement("input", { type: "radio", name: "weergave", checked: uitgebreid, onChange: () => setUitgebreid(true) }), " Uitgebreid"))), /* @__PURE__ */ React.createElement("p", { className: "termijnen-status", "aria-live": "polite" }, start ? /* @__PURE__ */ React.createElement(React.Fragment, null, "Termijnen bij een eerste ziektedag op ", datumTekst(start), ".") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Vul de eerste ziektedag in, dan zie je bij elke stap de datum.")), /* @__PURE__ */ React.createElement("ol", { className: "termijnen-lijst" }, lijst.map((t) => /* @__PURE__ */ React.createElement(Termijn, { key: t.titel, t, start, vandaag }))), uitgebreid && /* @__PURE__ */ React.createElement("section", { className: "termijnen-uitdienst", "aria-labelledby": "uitdienst-kop" }, /* @__PURE__ */ React.createElement("h2", { id: "uitdienst-kop" }, "Gaat je werknemer ziek uit dienst?"), /* @__PURE__ */ React.createElement("p", null, "Wat je dan aan UWV aanlevert, hangt af van de week waarin het dienstverband eindigt."), /* @__PURE__ */ React.createElement("ol", { className: "termijnen-lijst" }, UIT_DIENST.map((t) => /* @__PURE__ */ React.createElement(Termijn, { key: t.titel, t, start, vandaag: null })))), start && /* @__PURE__ */ React.createElement("p", { className: "termijnen-print" }, /* @__PURE__ */ React.createElement("button", { type: "button", className: "btn btn--quiet", onClick: () => window.print() }, "Afdrukken of opslaan als pdf")));
  }

  // src/termijnen-client.jsx
  var root = document.getElementById("termijnen-root");
  if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, /* @__PURE__ */ React.createElement(TermijnenTool, null));
  else ReactDOM.createRoot(root).render(/* @__PURE__ */ React.createElement(TermijnenTool, null));
})();

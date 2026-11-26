/* Server-entry voor build.mjs: de componenten die vooraf naar HTML worden
   gerenderd, plus de gestructureerde data (JSON-LD) per pagina. */

import { App } from "./app.jsx";
import { PAKKETTEN, FAQS } from "./landing.jsx";
import { ARTIKELEN, Artikel, ARTIKEL_DATUM, ARTIKEL_BIJGEWERKT } from "./artikelen.jsx";
import { TermijnenPagina, TERMIJNEN_PAGINA } from "./termijnen.jsx";
import { MERK, CONTACT_MAIL, LINKEDIN, SITE } from "./merk.jsx";

export { App, ARTIKELEN, Artikel, TermijnenPagina, TERMIJNEN_PAGINA };

const DIENST = SITE + "/#dienst";
const PERSOON = SITE + "/#chris";
const WEBSITE = SITE + "/#website";

const prijs = (p) => {
  const m = /€\s*([\d.]+)/.exec(p.prijs);
  if (!m) return {};
  return {
    priceSpecification: {
      "@type": "PriceSpecification",
      ...(p.prijs.startsWith("vanaf") ? { minPrice: Number(m[1]) } : { price: Number(m[1]) }),
      priceCurrency: "EUR",
      valueAddedTaxIncluded: !/excl/.test(p.sub),
    },
  };
};

function dienstEnPersoon() {
  return [
    {
      "@type": "ProfessionalService",
      "@id": DIENST,
      name: MERK,
      url: SITE + "/",
      description: "Controle en begeleiding van het re-integratieverslag (Wet verbetering poortwachter), zodat het compleet en kloppend naar UWV gaat. Ook inhoudelijke controle van alle niet-medische stukken.",
      image: SITE + "/og.png",
      email: CONTACT_MAIL,
      address: { "@type": "PostalAddress", streetAddress: "De Vaandeldrager 13", postalCode: "6921 TK", addressLocality: "Duiven", addressCountry: "NL" },
      areaServed: { "@type": "Country", name: "Nederland" },
      founder: { "@id": PERSOON },
      parentOrganization: { "@type": "Organization", name: "Schepers Digital", vatID: "NL004512417B86", identifier: "KVK 42107874" },
      knowsAbout: ["Wet verbetering poortwachter", "re-integratieverslag", "eerstejaarsevaluatie", "eindevaluatie", "loonsanctie", "WIA-aanvraag"],
      makesOffer: [
        ...PAKKETTEN.map((p) => ({ "@type": "Offer", name: p.naam, description: p.d, ...prijs(p) })),
        { "@type": "Offer", name: "Meekijken met je verslag (werknemers)", description: "Eén gesprek van anderhalf uur, bij je thuis of met beeldbellen.", priceSpecification: { "@type": "PriceSpecification", price: 195, priceCurrency: "EUR", valueAddedTaxIncluded: true } },
      ],
    },
    {
      "@type": "Person",
      "@id": PERSOON,
      name: "Chris Schepers",
      jobTitle: "Arbeidsdeskundige i.o.",
      description: "Casemanager bij langdurig verzuim, voor werkgevers en werknemers.",
      image: SITE + "/img/chris-schepers.jpg",
      sameAs: [LINKEDIN],
      worksFor: { "@id": DIENST },
    },
  ];
}

export function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      ...dienstEnPersoon(),
      { "@type": "WebSite", "@id": WEBSITE, url: SITE + "/", name: MERK, inLanguage: "nl-NL", publisher: { "@id": DIENST } },
      {
        "@type": "FAQPage",
        "@id": SITE + "/#faq",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
    ],
  };
}

export function artikelJsonLd(a) {
  const url = SITE + "/" + a.slug + "/";
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": url + "#artikel",
        headline: a.h1,
        description: a.beschrijving,
        inLanguage: "nl-NL",
        datePublished: ARTIKEL_DATUM,
        dateModified: ARTIKEL_DATUM,
        mainEntityOfPage: url,
        image: SITE + "/og.png",
        author: { "@id": PERSOON },
        publisher: { "@id": DIENST },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: MERK, item: SITE + "/" },
          { "@type": "ListItem", position: 2, name: a.kort, item: url },
        ],
      },
      ...dienstEnPersoon(),
    ],
  };
}

export const DATUM = ARTIKEL_DATUM;
export const BIJGEWERKT = ARTIKEL_BIJGEWERKT;

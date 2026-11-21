/* Privacyverklaring van de dossiercheck (Poortwachtercheck).
   Client-side overlay in de huisstijl. Ik-vorm, net als de startpagina. */

import { I } from "./data.jsx";
import { CONTACT_MAIL } from "./merk.jsx";

const NAVY = "var(--navy)";

function Sectie({ nr, titel, children }) {
  return (
    <section style={{ marginTop: 30 }}>
      <h2 style={{ fontSize: 21, color: "var(--navy-900)", display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--navy-400)" }}>{nr}</span>
        {titel}
      </h2>
      <div style={{ marginTop: 10, color: "var(--ink-soft)", fontSize: 15.5, lineHeight: 1.65 }}>{children}</div>
    </section>
  );
}

const lijst = { paddingLeft: 20, display: "grid", gap: 8 };

export function PrivacyVerklaring({ onClose }) {
  React.useEffect(() => {
    const body = document.querySelector(".legal-body");
    if (body) body.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="tool">
      <div className="tool-bar">
        <div className="tool-bar-inner">
          <button className="tool-back" onClick={onClose}>{I.arrowLeft} Terug naar site</button>
          <span style={{ fontWeight: 700, color: "var(--navy-900)" }}>Privacyverklaring</span>
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); onClose(); }} style={{ fontSize: 15 }}>
            <span className="mark" style={{ width: 28, height: 28 }}>{I.shield}</span>
          </a>
        </div>
      </div>

      <div className="tool-body legal-body">
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "8px 4px 60px" }}>
          <h1 style={{ fontSize: "clamp(28px,4vw,38px)", color: "var(--navy-900)", marginTop: 8 }}>
            Privacyverklaring
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, marginTop: 8 }}>
            Poortwachtercheck (poortwachtercheck.nl) · versie 21 november 2026 · Schepers Digital · KVK 42107874
          </p>

          <div style={{ marginTop: 20, padding: "16px 18px", background: "var(--navy-50)",
            border: "1px solid var(--navy-100)", borderRadius: 12, fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            <strong>Kort:</strong> ik gebruik het verzuimdossier alleen om het re-integratieverslag na te
            kijken en op orde te brengen, in opdracht van de werkgever. Medische stukken vraag ik niet op; die horen bij
            de bedrijfsarts. Kopieën bewaar ik tot en met de beschikking van UWV op de WIA-aanvraag en daarna verwijder ik ze.
          </div>

          <Sectie nr="1" titel="Wie is verantwoordelijk?">
            <p>
              Poortwachtercheck is een dienst van Schepers Digital (KVK 42107874). Ik controleer en begeleid het
              re-integratieverslag in opdracht van werkgevers.
            </p>
            <ul style={{ ...lijst, marginTop: 10 }}>
              <li>Voor de gegevens van de zieke werknemer is de <strong>werkgever</strong> verantwoordelijk. Ik ben
                <strong> verwerker</strong>: ik werk alleen in opdracht van de werkgever en volgens de
                verwerkersovereenkomst die we samen tekenen.</li>
              <li>Voor de gegevens van mijn opdrachtgever (contactpersoon, offerte, factuur) ben ik zelf verantwoordelijk.</li>
            </ul>
          </Sectie>

          <Sectie nr="2" titel="Welke gegevens?">
            <p><strong>Van de opdrachtgever:</strong> naam en functie van de contactpersoon, e-mailadres, telefoonnummer
              en bedrijfsgegevens.</p>
            <p style={{ marginTop: 10 }}><strong>Van de werknemer:</strong> naam, functie, de eerste ziektedag en de
              andere data uit het dossier, en de stukken van het re-integratiedossier: probleemanalyse, plan van aanpak
              en bijstellingen, evaluaties, eerstejaarsevaluatie, eindevaluatie en, als die er zijn, rapporten van de
              arbeidsdeskundige en verslagen van het tweede spoor.</p>
            <p style={{ marginTop: 10 }}><strong>Niet:</strong> medische stukken, zoals diagnose, behandeling of het
              medisch dossier. Die blijven bij de bedrijfsarts. Stuur ze niet mee.</p>
            <p style={{ marginTop: 10 }}>Ook zonder medische stukken staan er in het dossier gegevens over het verzuim en
              over wat de werknemer wel en niet kan. Volgens de AVG zijn dat gezondheidsgegevens. De werkgever mag die
              gebruiken voor de re-integratie (artikel 30 UAVG); ik verwerk ze alleen in zijn opdracht en voor dat doel.</p>
          </Sectie>

          <Sectie nr="3" titel="Waarvoor gebruik ik de gegevens?">
            <ul style={lijst}>
              <li><strong>De dossiercheck en begeleiding uitvoeren.</strong> De werkgever is wettelijk verplicht het
                re-integratieverslag op te stellen (Wet verbetering poortwachter). Ik help daarbij in zijn opdracht.</li>
              <li><strong>Contact met UWV namens de werkgever,</strong> alleen als dat bij de opdracht hoort en met een
                getekende machtiging.</li>
              <li><strong>Offerte, factuur en administratie,</strong> omdat we een overeenkomst hebben en de wet mij
                verplicht de administratie te bewaren.</li>
            </ul>
            <p style={{ marginTop: 10 }}>Ik gebruik de gegevens niet voor iets anders. Ik verkoop ze niet en deel ze niet
              met anderen, behalve met UWV als dat bij de opdracht hoort.</p>
          </Sectie>

          <Sectie nr="4" titel="Hoe krijg ik de stukken?">
            <ul style={lijst}>
              <li><strong>Op locatie:</strong> ik bekijk het dossier bij je op kantoor.</li>
              <li><strong>Op afstand:</strong> je stuurt mij kopieën van de stukken. Stuur alleen wat ik nodig heb, zonder
                medische informatie.</li>
            </ul>
          </Sectie>

          <Sectie nr="5" titel="Hoe lang bewaar ik iets?">
            <ul style={lijst}>
              <li><strong>Kopieën uit het dossier:</strong> tot en met de beschikking van UWV op de WIA-aanvraag. Daarna
                verwijder ik de digitale kopieën en vernietig ik papieren kopieën.</li>
              <li><strong>Gegevens van de opdrachtgever en facturen:</strong> 7 jaar, omdat de belastingwet dat verplicht.</li>
            </ul>
          </Sectie>

          <Sectie nr="6" titel="Beveiliging">
            <p>Alleen ik heb toegang tot de kopieën. Ik bewaar en verstuur ze niet op een plek waar anderen erbij kunnen.
              Toegestuurde stukken komen binnen in een zakelijke mailbox bij TransIP, met opslag in datacenters in Nederland.
              Gaat er toch iets mis met de gegevens van een werknemer, dan meld ik dat meteen aan de werkgever, zodat die
              kan beoordelen of het een datalek is dat gemeld moet worden.</p>
          </Sectie>

          <Sectie nr="7" titel="Deze website">
            <ul style={lijst}>
              <li>Geen cookies, geen analytics en geen advertenties.</li>
              <li>De snelle check werkt alleen in je eigen browser. Er wordt niets opgeslagen of verstuurd. De knop om de
                lijst te mailen opent je eigen mailprogramma; jij bepaalt wat je verstuurt.</li>
              <li>De site staat bij GitHub Pages en laadt het lettertype van Google Fonts. Zoals bij elke website zien die
                daarbij je IP-adres.</li>
            </ul>
          </Sectie>

          <Sectie nr="8" titel="Je rechten">
            <p>Je hebt recht op inzage, correctie, verwijdering, beperking en bezwaar.</p>
            <ul style={{ ...lijst, marginTop: 10 }}>
              <li><strong>Werknemer:</strong> een verzoek over je verzuimdossier doe je bij je werkgever, want die is
                verantwoordelijk. Ik help je werkgever daarbij.</li>
              <li><strong>Opdrachtgever:</strong> mail mij op het adres hieronder.</li>
            </ul>
            <p style={{ marginTop: 10 }}>Ben je het niet eens met hoe ik met gegevens omga? Dan kun je een klacht indienen
              bij de Autoriteit Persoonsgegevens.</p>
          </Sectie>

          <Sectie nr="9" titel="Contact">
            <p>
              <a href={"mailto:" + CONTACT_MAIL} style={{ color: NAVY, fontWeight: 600 }}>{CONTACT_MAIL}</a><br />
              Schepers Digital · De Vaandeldrager 13, 6921 TK Duiven<br />
              KVK 42107874 · poortwachtercheck.nl
            </p>
          </Sectie>
        </div>
      </div>
    </div>
  );
}

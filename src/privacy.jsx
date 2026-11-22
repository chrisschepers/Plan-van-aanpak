/* Privacyverklaring van de dossiercheck (Poortwachtercheck).
   Client-side overlay in de huisstijl. Ik-vorm, net als de startpagina.
   Opmaak via klassen in styles.css (legal-*); de tekst zelf is ongewijzigd. */

import { I } from "./iconen.jsx";
import { CONTACT_MAIL, Merk } from "./merk.jsx";

function Sectie({ nr, titel, children }) {
  return (
    <section className="legal-sectie">
      <h2>{nr}. {titel}</h2>
      <div className="legal-tekst">{children}</div>
    </section>
  );
}

export function PrivacyVerklaring({ onClose }) {
  React.useEffect(() => {
    const body = document.querySelector(".legal-body");
    if (body) body.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="tool">
      <div className="tool-bar">
        <div className="container tool-bar-inner">
          <Merk href="#top" onClick={(e) => { e.preventDefault(); onClose(); }} />
          <button className="tool-back" type="button" onClick={onClose}>{I.arrowLeft} Terug naar site</button>
        </div>
      </div>

      <div className="tool-body legal-body">
        <article className="container legal">
          <h1>Privacyverklaring</h1>
          <p className="legal-meta">
            Poortwachtercheck (poortwachtercheck.nl), versie 22 november 2026. Schepers Digital, KVK 42107874.
          </p>

          <div className="legal-kort">
            <strong>Kort:</strong> ik gebruik het verzuimdossier alleen om het re-integratieverslag na te
            kijken en op orde te brengen, in opdracht van de werkgever of van de werknemer zelf. Medische stukken vraag ik niet op; die horen bij
            de bedrijfsarts. Kopieën bewaar ik tot en met de beschikking van UWV op de WIA-aanvraag en daarna verwijder ik ze.
          </div>

          <Sectie nr="1" titel="Wie is verantwoordelijk?">
            <p>
              Poortwachtercheck is een dienst van Schepers Digital (KVK 42107874). Ik controleer en begeleid het
              re-integratieverslag in opdracht van werkgevers. Werknemers kunnen mij ook zelf inschakelen om mee te kijken.
            </p>
            <ul>
              <li>Voor de gegevens van de zieke werknemer is de <strong>werkgever</strong> verantwoordelijk. Ik ben
                <strong> verwerker</strong>: ik werk alleen in opdracht van de werkgever en volgens de
                verwerkersovereenkomst die we samen tekenen.</li>
              <li>Schakel je mij als werknemer zelf in, dan ben ik voor jouw gegevens zelf verantwoordelijk.</li>
              <li>Voor de gegevens van mijn opdrachtgever (contactpersoon, offerte, factuur) ben ik zelf verantwoordelijk.</li>
            </ul>
          </Sectie>

          <Sectie nr="2" titel="Welke gegevens?">
            <p><strong>Van de opdrachtgever:</strong> naam, e-mailadres en telefoonnummer, en bij een werkgever ook de
              functie van de contactpersoon en de bedrijfsgegevens.</p>
            <p><strong>Van de werknemer:</strong> naam, functie, de eerste ziektedag en de
              andere data uit het dossier, en de stukken van het re-integratiedossier: probleemanalyse, plan van aanpak
              en bijstellingen, evaluaties, eerstejaarsevaluatie, eindevaluatie en, als die er zijn, rapporten van de
              arbeidsdeskundige en verslagen van het tweede spoor.</p>
            <p><strong>Niet:</strong> medische stukken, zoals diagnose, behandeling of het
              medisch dossier. Die blijven bij de bedrijfsarts. Stuur ze niet mee.</p>
            <p>Ook zonder medische stukken staan er in het dossier gegevens over het verzuim en
              over wat de werknemer wel en niet kan. Volgens de AVG zijn dat gezondheidsgegevens. De werkgever mag die
              gebruiken voor de re-integratie (artikel 30 UAVG); ik verwerk ze alleen in zijn opdracht en voor dat doel.</p>
            <p>Schakel je mij als werknemer zelf in, dan gebruik ik die gegevens alleen met jouw
              uitdrukkelijke toestemming (artikel 9 AVG) en alleen om met je mee te kijken. Je kunt die toestemming altijd
              intrekken.</p>
          </Sectie>

          <Sectie nr="3" titel="Waarvoor gebruik ik de gegevens?">
            <ul>
              <li><strong>De dossiercheck en begeleiding uitvoeren.</strong> De werkgever is wettelijk verplicht het
                re-integratieverslag op te stellen (Wet verbetering poortwachter). Ik help daarbij in zijn opdracht.</li>
              <li><strong>Meekijken met een werknemer</strong> die mij zelf inschakelt, op basis van de afspraak met die
                werknemer en diens uitdrukkelijke toestemming.</li>
              <li><strong>Contact met UWV namens de werkgever,</strong> alleen als dat bij de opdracht hoort en met een
                getekende machtiging.</li>
              <li><strong>Offerte, factuur en administratie,</strong> omdat we een overeenkomst hebben en de wet mij
                verplicht de administratie te bewaren.</li>
            </ul>
            <p>Ik gebruik de gegevens niet voor iets anders. Ik verkoop ze niet en deel ze niet
              met anderen, behalve met UWV als dat bij de opdracht hoort.</p>
          </Sectie>

          <Sectie nr="4" titel="Hoe krijg ik de stukken?">
            <ul>
              <li><strong>Op locatie:</strong> ik bekijk het dossier bij je op kantoor, of als werknemer bij je thuis.</li>
              <li><strong>Op afstand:</strong> je stuurt mij kopieën van de stukken. Stuur alleen wat ik nodig heb, zonder
                medische informatie.</li>
            </ul>
          </Sectie>

          <Sectie nr="5" titel="Hoe lang bewaar ik iets?">
            <ul>
              <li><strong>Kopieën uit het dossier:</strong> tot en met de beschikking van UWV op de WIA-aanvraag. Daarna
                verwijder ik de digitale kopieën en vernietig ik papieren kopieën.</li>
              <li><strong>Gegevens van de opdrachtgever en facturen:</strong> 7 jaar, omdat de belastingwet dat verplicht.</li>
            </ul>
          </Sectie>

          <Sectie nr="6" titel="Beveiliging">
            <p>Alleen ik heb toegang tot de kopieën. Ik bewaar en verstuur ze niet op een plek waar anderen erbij kunnen.
              Stukken die je per e-mail stuurt naar {CONTACT_MAIL}, worden doorgestuurd naar mijn mailbox bij Google
              (Gmail). Google kan die gegevens ook buiten de EU opslaan en valt daarvoor onder het EU-VS Data Privacy
              Framework.
              Gaat er toch iets mis met de gegevens van een werknemer, dan meld ik dat meteen aan de werkgever, zodat die
              kan beoordelen of het een datalek is dat gemeld moet worden. Help ik een werknemer zelf, dan meld ik het aan
              die werknemer en, als dat moet, aan de Autoriteit Persoonsgegevens.</p>
          </Sectie>

          <Sectie nr="7" titel="Deze website">
            <ul>
              <li>Geen cookies, geen analytics en geen advertenties.</li>
              <li>De site staat bij GitHub Pages en laadt het lettertype van Google Fonts. Zoals bij elke website zien die
                daarbij je IP-adres.</li>
            </ul>
          </Sectie>

          <Sectie nr="8" titel="Je rechten">
            <p>Je hebt recht op inzage, correctie, verwijdering, beperking en bezwaar.</p>
            <ul>
              <li><strong>Werknemer:</strong> een verzoek over je verzuimdossier doe je bij je werkgever, want die is
                verantwoordelijk. Ik help je werkgever daarbij. Heb je mij zelf ingeschakeld, mail mij dan.</li>
              <li><strong>Opdrachtgever:</strong> mail mij op het adres hieronder.</li>
            </ul>
            <p>Ben je het niet eens met hoe ik met gegevens omga? Dan kun je een klacht indienen
              bij de Autoriteit Persoonsgegevens.</p>
          </Sectie>

          <Sectie nr="9" titel="Contact">
            <p>
              <a href={"mailto:" + CONTACT_MAIL}>{CONTACT_MAIL}</a><br />
              Schepers Digital<br />
              De Vaandeldrager 13, 6921 TK Duiven<br />
              KVK 42107874<br />
              poortwachtercheck.nl
            </p>
          </Sectie>
        </article>
      </div>
    </div>
  );
}

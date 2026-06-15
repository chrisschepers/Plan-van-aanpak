/* Concept-privacyverklaring + AI-transparantie (AI Act).
   Volledig client-side overlay, in de huisstijl. Bewust gemarkeerd als CONCEPT:
   vóór verwerking van echte gegevens hoort een juridische review + DPIA. */

import { I } from "./data.jsx";

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
          <span style={{ fontWeight: 700, color: "var(--navy-900)" }}>Privacyverklaring & AI-transparantie</span>
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); onClose(); }} style={{ fontSize: 15 }}>
            <span className="mark" style={{ width: 28, height: 28 }}>{I.doc}</span>
          </a>
        </div>
      </div>

      <div className="tool-body legal-body">
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "8px 4px 60px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600,
            color: "var(--flag-text)", background: "var(--flag-bg)", border: "1px solid var(--flag-line)",
            borderRadius: 999, padding: "6px 14px" }}>
            {I.info} Concept — nog niet juridisch vastgesteld
          </div>

          <h1 style={{ fontSize: "clamp(28px,4vw,38px)", color: "var(--navy-900)", marginTop: 18 }}>
            Privacyverklaring &amp; AI-transparantie
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 15, marginTop: 8 }}>
            planvanaanpakinvuller.nl · concept d.d. 15 juni 2026 · [INVULLEN: bedrijfsnaam, KVK]
          </p>

          <div style={{ marginTop: 20, padding: "16px 18px", background: "var(--navy-50)",
            border: "1px solid var(--navy-100)", borderRadius: 12, fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            {I.shield} Deze tool is gebouwd volgens <strong>privacy by design</strong> en <strong>mens in de loop</strong>.
            Er worden bewust <strong>geen medische gegevens en geen BSN</strong> verwerkt — alleen functionele en
            arbeidskundige gegevens die nodig zijn voor het Plan van aanpak (Wet verbetering poortwachter).
          </div>

          <Sectie nr="1" titel="Wie verwerkt de gegevens, en in welke rol?">
            <p>
              planvanaanpakinvuller.nl is een hulpmiddel voor werkgevers en casemanagers. De <strong>werkgever</strong> die
              de tool gebruikt is de <strong>verwerkingsverantwoordelijke</strong>: die bepaalt het doel (het opstellen van
              zíjn Plan van aanpak) en levert de gegevens aan. planvanaanpakinvuller.nl treedt op als <strong>verwerker</strong>
              en verwerkt uitsluitend in opdracht van de werkgever. Het AI-model (Anthropic) is <strong>subverwerker</strong>.
            </p>
            <p style={{ marginTop: 10 }}>
              Wij gebruiken de aangeleverde gegevens niet voor eigen doeleinden, hergebruiken ze niet en gebruiken ze niet
              om AI-modellen te trainen.
            </p>
          </Sectie>

          <Sectie nr="2" titel="Welke gegevens verwerken we (en welke niet)?">
            <p><strong>Wél:</strong> functionele en arbeidskundige gegevens — functie, contracturen, eerste ziektedag,
              belastbaarheid en mogelijkheden in werktermen, opbouwadvies, prognose in werkhervattingstermen, en de naam
              van werknemer en bedrijfsarts.</p>
            <p style={{ marginTop: 10 }}><strong>Niet:</strong> medische gegevens (diagnose, klachten, behandeling, aard of
              oorzaak van het verzuim) en het BSN. Een ingebouwd filter verwijdert deze; staat zoiets per ongeluk in een
              geüpload document, dan wordt het niet overgenomen in het concept.</p>
          </Sectie>

          <Sectie nr="3" titel="Op welke grondslag?">
            <p>De verwerking steunt op de <strong>wettelijke verplichting</strong> van de werkgever uit de Wet verbetering
              poortwachter en de Arbeidsomstandighedenwet (AVG art. 6 lid 1 sub c), aangevuld met gerechtvaardigd belang
              voor de uitvoering via de tool. Er is geen toestemming van de werknemer nodig.</p>
          </Sectie>

          <Sectie nr="4" titel="AI-transparantie (AI Act)">
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li>De tool zet <strong>AI</strong> in om de functionele gegevens uit de terugkoppeling te lezen.</li>
              <li>De uitkomst is altijd een <strong>concept</strong>. <strong>Menselijke controle is verplicht</strong>:
                de werkgever loopt elk veld na en stelt het Plan van aanpak samen met de werknemer vast.</li>
              <li>Er worden <strong>geen besluiten genomen die uitsluitend op geautomatiseerde verwerking</strong> berusten
                (AVG art. 22). De berekening van het opbouwschema en de poortwachter-termijnen gebeurt met een vaste,
                controleerbare rekenmotor — niet door de AI.</li>
            </ul>
          </Sectie>

          <Sectie nr="5" titel="Subverwerkers, hosting en bewaren">
            <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
              <li><strong>AI-model:</strong> Anthropic (Claude), als subverwerker — verwerking binnen de EER, geen training
                op klantdata.</li>
              <li><strong>Verwerking is vluchtig:</strong> documenten en gegevens worden verwerkt om het concept te maken en
                niet langer bewaard dan nodig; er wordt geen verzuimdossier opgebouwd in de tool.</li>
              <li>Met subverwerkers worden verwerkersovereenkomsten gesloten.</li>
            </ul>
          </Sectie>

          <Sectie nr="6" titel="Beveiliging">
            <p>Versleutelde verbindingen (TLS), sleutels uitsluitend server-side, toegangsbeheer en een procedure voor
              datalekken. De verwerking vindt plaats binnen de EER.</p>
          </Sectie>

          <Sectie nr="7" titel="Rechten van betrokkenen">
            <p>Betrokkenen hebben recht op inzage, rectificatie, wissing, beperking en bezwaar. Omdat de werkgever
              verwerkingsverantwoordelijke is, lopen verzoeken in eerste instantie via de werkgever; wij ondersteunen de
              werkgever daarbij. Neem contact op via het onderstaande adres.</p>
          </Sectie>

          <Sectie nr="8" titel="Contact">
            <p>
              <a href="mailto:contact@planvanaanpakinvuller.nl" style={{ color: NAVY, fontWeight: 600 }}>contact@planvanaanpakinvuller.nl</a><br />
              [INVULLEN: bedrijfsnaam · KVK-nummer · adres]
            </p>
          </Sectie>

          <div style={{ marginTop: 34, padding: "16px 18px", background: "var(--flag-bg)",
            border: "1px solid var(--flag-line)", borderRadius: 12, fontSize: 14, color: "var(--flag-text)", lineHeight: 1.6 }}>
            <strong>Let op — concept.</strong> Deze verklaring is een opzet voor de demo met fictieve gegevens. Vóór het
            verwerken van échte (persoons)gegevens horen een DPIA, getekende verwerkersovereenkomsten en een juridische
            toetsing plaats te vinden. Gebruik de tool tot die tijd uitsluitend met fictieve terugkoppelingen.
          </div>
        </div>
      </div>
    </div>
  );
}

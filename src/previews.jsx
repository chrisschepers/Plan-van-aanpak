/* Stap 3 — preview van de onderdelen, gevuld met de gecontroleerde veldwaarden:
   1) Opbouw- en re-integratieadvies
   2) Plan van Aanpak (officiële UWV-structuur, formulier AG140)
   3) Aanvullende adviezen (uit de adviesmotor)
   4) Begeleidend bericht aan de werkgever */

import { I, getVal, isMissing } from "./data.jsx";
import { fullRecoveryDate } from "./engine.js";
import { SchemaRows } from "./fields.jsx";
import { adviceBullets, berichtKern, splitLinks, computeTijdlijn } from "./advice.js";
import { PoortwachterTijdlijn } from "./tijdlijn.jsx";

function DocPreviewHead({ title, icon }) {
  return (
    <div className="doc-preview-head">
      <div className="t">{icon} {title}</div>
      <span className="pill pill-navy"><span className="pdot"></span>Concept</span>
    </div>
  );
}

function Val({ fields, id }) {
  const v = getVal(fields, id);
  return isMissing(v) ? <dd className="flag">[INVULLEN]</dd> : <dd>{v}</dd>;
}

// 1 — Loonwaarde-/opbouwadvies
export function AdviesPreview({ fields, schema, reportDate, schemaZelfOpgesteld, opbouwReden, wazo }) {
  const tijdlijn = computeTijdlijn(fields, { wazo });
  const geenOpbouw = !!opbouwReden || schema.length === 0;
  const start = getVal(fields, "start");
  const startDisplay = geenOpbouw ? "—" : (isMissing(start) ? (schema[0] ? schema[0].date : "—") : start);
  const opbouwVal = getVal(fields, "opbouw");
  const opbouwtempoDisplay = geenOpbouw
    ? "Niet van toepassing"
    : (schemaZelfOpgesteld || isMissing(opbouwVal) ? "Niet door de bedrijfsarts gespecificeerd" : opbouwVal);
  return (
    <div className="doc-preview">
      <DocPreviewHead title="Opbouw- en re-integratieadvies" icon={I.scale} />
      <div className="doc-sheet">
        <h2>Opbouw- en re-integratieadvies</h2>
        <p className="wvp">Concept op basis van de terugkoppeling bedrijfsarts d.d. {reportDate}</p>

        <h3>Uitgangspunten</h3>
        <dl className="kv">
          <dt>Contracturen</dt><Val fields={fields} id="uren" />
          <dt>Belastbaarheid</dt><Val fields={fields} id="belast" />
          <dt>Opbouwtempo</dt><dd>{opbouwtempoDisplay}</dd>
          <dt>Startdatum opbouw</dt><dd>{startDisplay}</dd>
        </dl>

        {geenOpbouw ? (
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", background: "var(--navy-50)", border: "1px solid var(--navy-100)", borderRadius: 8, padding: "10px 12px" }}>
            {opbouwReden || "Een opbouwschema is op dit moment niet aan de orde."}
          </p>
        ) : (
          <>
            {schemaZelfOpgesteld && (
              <p style={{ fontSize: 13.5, color: "var(--ink-soft)", background: "var(--navy-50)", border: "1px solid var(--navy-100)", borderRadius: 8, padding: "10px 12px" }}>
                De bedrijfsarts heeft geen concreet opbouwtempo gespecificeerd. Daarom is hieronder zelf een
                opbouwschema opgesteld: tweewekelijks één uur per werkdag erbij, oplopend naar de contracturen.
                Stem dit schema af met de werknemer en bedrijfsarts.
              </p>
            )}

            <h3>Opbouwschema</h3>
            <table className="schema-table" style={{ marginTop: 4 }}>
              <thead>
                <tr><th>Per datum</th><th>Uren per week</th><th>Hersteld</th></tr>
              </thead>
              <SchemaRows schema={schema} />
            </table>
            <p style={{ marginTop: 16, fontSize: 13.5, color: "var(--muted)" }}>
              Volledige werkhervatting voorzien per {fullRecoveryDate(schema)}. Tussentijdse evaluatie aanbevolen;
              bij terugval wordt het schema in overleg bijgesteld.
            </p>
          </>
        )}

        <h3>Tijdlijn van het verzuim</h3>
        {tijdlijn
          ? <PoortwachterTijdlijn tijdlijn={tijdlijn} />
          : <p style={{ fontSize: 13.5, color: "var(--muted)" }}>Geef de eerste ziektedag op, dan tonen we de volledige tijdlijn met de wettelijke mijlpalen.</p>}
      </div>
    </div>
  );
}

// 2 — Plan van Aanpak: schermweergave die het UWV-formulier (AG140) nabootst.
function UwvBar({ nr, children }) {
  return <div className="uwv-bar"><span className="uwv-nr">{nr}</span>{children}</div>;
}
function UwvRow({ label, value }) {
  const missing = isMissing(value) || value === "";
  return (
    <div className="uwv-row">
      <div className="uwv-label">{label}</div>
      <div className={"uwv-val" + (missing ? " empty" : "")}>{missing ? "" : value}</div>
    </div>
  );
}
function UwvHelp({ children }) { return <p className="uwv-help">{children}</p>; }
function UwvCheck({ checked, children }) {
  return <div className="uwv-check"><span className={"uwv-box" + (checked ? " on" : "")}>{checked ? I.checkSm : null}</span>{children}</div>;
}
function ActTable({ rows }) {
  return (
    <table className="uwv-act">
      <thead><tr><th>Activiteit</th><th>Wie</th><th>Planning</th></tr></thead>
      <tbody>
        {(rows.length ? rows : [["", "", ""]]).map((r, i) => (
          <tr key={i}>{r.map((c, j) => <td key={j} className={c ? "" : "empty"}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  );
}

export function PvaPreview({ fields, schema, functieomschrijving, opbouwReden, signalen }) {
  const geenOpbouw = !!opbouwReden || schema.length === 0;
  const startRaw = getVal(fields, "start");
  const start = isMissing(startRaw) ? (schema[0] ? schema[0].date : "—") : startRaw;
  const planning = geenOpbouw ? "In overleg" : `Per ${start}`;
  const opbouwVal = getVal(fields, "opbouw");
  const ritme = isMissing(opbouwVal) ? "tweewekelijks één uur per werkdag erbij" : opbouwVal.toLowerCase();
  const fromH = schema[0] ? schema[0].hours : 0;
  const lastH = schema[schema.length - 1] ? schema[schema.length - 1].hours : 0;
  const opbouw = geenOpbouw
    ? (opbouwReden || "Een opbouwschema is op dit moment niet aan de orde; de bedrijfsarts beoordeelt dit op het vervolgconsult.")
    : `Werknemer bouwt op van ${fromH} naar ${lastH} uur volgens het opbouwschema (start ${start}, ${ritme}).`;
  const beperkingVal = getVal(fields, "beperking");
  const taak = isMissing(beperkingVal)
    ? "Werkgever en werknemer stellen samen passende werkzaamheden vast binnen de aangegeven mogelijkheden."
    : `Werkgever en werknemer stellen samen passende werkzaamheden vast binnen de aangegeven mogelijkheden (${beperkingVal.toLowerCase()}).`;
  const werkplekRaw = getVal(fields, "werkplek");
  const werkplek = isMissing(werkplekRaw) ? "" : werkplekRaw;
  const werktijdenRaw = getVal(fields, "werktijden");
  const werktijden = isMissing(werktijdenRaw) ? "" : werktijdenRaw;
  const arbeidsconflict = !!(signalen && signalen.arbeidsconflict);
  return (
    <div className="doc-preview">
      <DocPreviewHead title="Plan van Aanpak (UWV — formulier AG140)" icon={I.doc} />
      <div className="doc-sheet uwvform">
        <div className="uwv-title">
          <h2>Plan van aanpak</h2>
          <span className="uwv-logo">UWV</span>
        </div>
        <p className="wvp">Wet verbetering poortwachter — schermweergave van het ingevulde formulier. De download is het echte UWV-bestand.</p>

        <UwvBar nr="1">Werknemer</UwvBar>
        <UwvHelp>Gebruikt de werknemer de achternaam van de partner? Vul dan ook de geboortenaam in.</UwvHelp>
        <UwvRow label="1.1  Voorletters en achternaam" value={getVal(fields, "naam")} />
        <UwvRow label="1.2  Burgerservicenummer" value="" />

        <UwvBar nr="2">Werkgever</UwvBar>
        <UwvRow label="2.1  Bedrijfsnaam" value={getVal(fields, "werkgever")} />
        <UwvRow label="2.2  Naam contactpersoon" value="" />

        <UwvBar nr="3">Arbodienst / bedrijfsarts</UwvBar>
        <UwvRow label="3.1  Naam bedrijfsarts" value={getVal(fields, "naamBedrijfsarts")} />

        <UwvBar nr="4">Functie van de werknemer</UwvBar>
        <UwvRow label="4.1  Functie" value={getVal(fields, "functie")} />
        <UwvHelp>4.2  Omschrijving van de werkzaamheden van het laatste werk vóór de ziekmelding.</UwvHelp>
        <UwvRow label="Werkzaamheden" value={(functieomschrijving || "").trim()} />

        <UwvBar nr="5">Mening werknemer en werkgever over de arbeidsmogelijkheden</UwvBar>
        <UwvRow label="5.1  Werknemer" value="Door de werknemer zelf in te vullen." />
        <UwvRow label="5.2  Werkgever" value="Door de werkgever zelf in te vullen." />

        <UwvBar nr="6">Einddoel</UwvBar>
        <UwvHelp>U kunt meerdere vakjes aankruisen.</UwvHelp>
        <UwvCheck checked>Werkhervatting in de eigen functie</UwvCheck>
        <UwvCheck>Gedeeltelijke werkhervatting in de eigen functie</UwvCheck>
        <UwvCheck>Werkhervatting in eigen functie met aanpassingen</UwvCheck>
        <UwvCheck>Werkhervatting in een andere functie bij de eigen werkgever</UwvCheck>
        <UwvCheck>(Gedeeltelijke) werkhervatting bij een andere werkgever</UwvCheck>

        <UwvBar nr="7">Afspraken</UwvBar>
        <UwvHelp>Welke afspraken heeft u met uw werknemer gemaakt over zijn re-integratie?</UwvHelp>
        <div className="uwv-cat">7A  Arbeidsinhoud</div>
        <ActTable rows={[[taak, "Werkgever en werknemer", planning]]} />
        {werkplek && <>
          <div className="uwv-cat">7B  Arbeidsomstandigheden</div>
          <ActTable rows={[[`Aanpassing werkplek/omstandigheden: ${werkplek}`, "Werkgever", "In overleg"]]} />
        </>}
        {werktijden && <>
          <div className="uwv-cat">7C  Arbeidsvoorwaarden</div>
          <ActTable rows={[[`Aanpassing werktijden/rooster: ${werktijden}`, "Werkgever en werknemer", "In overleg"]]} />
        </>}
        {arbeidsconflict && <>
          <div className="uwv-cat">7D  Arbeidsverhoudingen</div>
          <ActTable rows={[["Werkgever en werknemer gaan met elkaar in gesprek, zo nodig onder begeleiding (mediation), om de arbeidsverhouding te herstellen.", "Werkgever en werknemer", "Op korte termijn"]]} />
        </>}
        <div className="uwv-cat">7E  Sociaal-medische zaken</div>
        <ActTable rows={[
          [opbouw, "Werknemer en werkgever", planning],
          ["Werknemer verschijnt op het vervolgconsult bij de bedrijfsarts.", "Werknemer", "Conform oproep arbodienst"],
        ]} />
        <div className="uwv-cat">7F  Overige activiteiten</div>
        <ActTable rows={[["Werkgever en werknemer evalueren de voortgang en stellen het Plan van aanpak bij wanneer de belastbaarheid wijzigt.", "Werkgever en werknemer", "Elke 6 weken"]]} />

        <UwvBar nr="8">Mening over de gemaakte afspraken</UwvBar>
        <UwvHelp>In te vullen door werknemer en werkgever zelf.</UwvHelp>

        <UwvBar nr="9">Te laat opgesteld Plan van aanpak</UwvBar>
        <UwvRow label="Reden" value="" />

        <UwvBar nr="10">Ondertekening</UwvBar>
        <div className="uwv-sign">
          <div><strong>Werkgever</strong><span>Datum: ____________</span><span>Handtekening:</span></div>
          <div><strong>Werknemer</strong><span>Datum: ____________</span><span>Handtekening:</span></div>
        </div>
        <div className="uwv-foot">AG140  03041  05-23</div>
      </div>
    </div>
  );
}

// Maakt URL's en e-mailadressen klikbaar in de preview.
function linkify(text) {
  return splitLinks(text).map((part, i) => {
    if (part.type === "text") return part.value;
    const href = part.type === "email" ? `mailto:${part.value}` : part.value;
    return <a key={i} href={href} target={part.type === "url" ? "_blank" : undefined} rel="noopener noreferrer">{part.value}</a>;
  });
}

// 3 — Begeleidend bericht aan werkgever (met de adviezen verweven)
export function BerichtPreview({ fields, schema, reportDate, taaksuggestie, signalen, schemaZelfOpgesteld, opbouwReden, wazo }) {
  const naam = getVal(fields, "naam");
  const werknemer = isMissing(naam) ? "je werknemer" : naam;
  const kern = berichtKern(fields, schema, schemaZelfOpgesteld, opbouwReden);
  const { bullets, termijnRef } = adviceBullets(fields, reportDate, signalen, { wazo });
  const taak = (taaksuggestie || "").trim();
  return (
    <div className="doc-preview">
      <DocPreviewHead title="Begeleidend bericht aan werkgever" icon={I.mail} />
      <div className="doc-sheet msg-sheet">
        <h2 style={{ fontSize: 19 }}>Begeleidend bericht</h2>
        <p className="wvp" style={{ marginBottom: 18 }}>Onderwerp: Concept Plan van aanpak{isMissing(naam) ? "" : " — " + naam}</p>

        <p className="greeting">
          Beste werkgever, hierbij ontvang je het concept-Plan van aanpak voor {werknemer},
          opgesteld naar aanleiding van de terugkoppeling van de bedrijfsarts d.d. {reportDate}.
        </p>
        {kern.map((t, i) => <p key={"k" + i}>{t}</p>)}
        <p className="bullets-intro"><strong>Een paar praktische aandachtspunten:</strong></p>
        <ul className="msg-bullets">
          {bullets.map((t, i) => <li key={i}>{linkify(t)}</li>)}
        </ul>
        {termijnRef && (
          <p style={{ color: "var(--muted)" }}>
            De volledige wettelijke termijnen staan in de bijgevoegde tabel Poortwachter-termijnen.
          </p>
        )}
        {taak && (
          <p>
            <strong>Suggestie voor aangepaste taken.</strong> Op basis van de functieomschrijving zou je —
            binnen de afgegeven mogelijkheden — kunnen denken aan {taak}.{" "}
            <em>Let op: dit zijn voorstellen als gespreksopening. Bespreek ze eerst samen met de werknemer;
            ze maken geen onderdeel uit van het Plan van Aanpak en mogen niet eenzijdig in het dossier
            worden opgenomen.</em>
          </p>
        )}
        <p>
          Bespreek het concept met je werknemer, vul de openstaande velden samen in,
          onderteken beiden en bewaar het in je verzuimdossier; leg ook de terugkoppeling van
          de bedrijfsarts vast. Medische gegevens zijn bewust niet opgenomen.
        </p>
        <p style={{ fontStyle: "italic", color: "var(--muted)" }}>
          Dit document is een concept, opgesteld op basis van de terugkoppeling van de
          bedrijfsarts. Controleer de gegevens en stel het Plan van aanpak altijd samen met je
          werknemer vast — het is een document van jullie beiden.
        </p>
        <p style={{ fontStyle: "italic", color: "var(--muted)" }}>
          Ben je eigenrisicodrager voor de Ziektewet of de WGA? Dan gelden aanvullende of
          afwijkende regels en kun je niet afgaan op dit automatisch gegenereerde advies —
          raadpleeg dan je eigen verzuim- of arbospecialist.
        </p>
        <p className="sign">
          Met vriendelijke groet,<br/>
          <span style={{ color: "var(--flag-text, #9a3b2e)", fontStyle: "italic", fontWeight: 600 }}>[INVULLEN: naam afzender]</span><br/>
          <span style={{ color: "var(--flag-text, #9a3b2e)", fontStyle: "italic", fontSize: 13 }}>[INVULLEN: functie, bv. casemanager verzuim]</span>
        </p>
      </div>
    </div>
  );
}

/* Stap 3 — preview van de onderdelen, gevuld met de gecontroleerde veldwaarden:
   1) Opbouw- en re-integratieadvies
   2) Plan van Aanpak (officiële UWV-structuur, formulier AG140)
   3) Aanvullende adviezen (uit de adviesmotor)
   4) Begeleidend bericht aan de werkgever */

import { I, getVal, isMissing } from "./data.jsx";
import { fullRecoveryDate } from "./engine.js";
import { SchemaRows } from "./fields.jsx";
import { adviceParagraphs } from "./advice.js";

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
export function AdviesPreview({ fields, schema, reportDate }) {
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
          <dt>Opbouwtempo</dt><Val fields={fields} id="opbouw" />
          <dt>Startdatum opbouw</dt><Val fields={fields} id="start" />
        </dl>

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

export function PvaPreview({ fields, schema, functieomschrijving }) {
  const start = getVal(fields, "start");
  const opbouw = `Werknemer hervat/bouwt op conform het opbouwschema van de bedrijfsarts (start ${start}, ${getVal(fields, "opbouw").toLowerCase()} tot ${schema[schema.length - 1].hours} uur).`;
  const taak = `Werkgever en werknemer stellen samen passende werkzaamheden vast binnen de aangegeven mogelijkheden (${getVal(fields, "beperking").toLowerCase()}).`;
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
        <UwvRow label="3.1  Naam bedrijfsarts" value="" />

        <UwvBar nr="4">Functie van de werknemer</UwvBar>
        <UwvRow label="4.1  Functie" value={getVal(fields, "functie")} />
        <UwvHelp>4.2  Omschrijving van de werkzaamheden van het laatste werk vóór de ziekmelding.</UwvHelp>
        <UwvRow label="Werkzaamheden" value={(functieomschrijving || "").trim()} />

        <UwvBar nr="5">Mening werknemer en werkgever over de arbeidsmogelijkheden</UwvBar>
        <UwvRow label="5.1  Werknemer" value="" />
        <UwvRow label="5.2  Werkgever" value="" />

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
        <ActTable rows={[[taak, "Werkgever en werknemer", `Per ${start}`]]} />
        <div className="uwv-cat">7E  Sociaal-medische zaken</div>
        <ActTable rows={[
          [opbouw, "Werknemer en werkgever", `Per ${start}`],
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

// 3 — Begeleidend bericht aan werkgever (met de adviezen verweven)
export function BerichtPreview({ fields, schema, reportDate, taaksuggestie }) {
  const naam = getVal(fields, "naam");
  const werknemer = isMissing(naam) ? "je werknemer" : naam;
  const alineas = adviceParagraphs(fields, reportDate);
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
        <p>
          Werknemer is belastbaar voor {getVal(fields, "belast").toLowerCase()}. De bedrijfsarts
          adviseert een opbouw vanaf {getVal(fields, "start")}, {getVal(fields, "opbouw").toLowerCase()},
          van {schema[0].hours} naar {schema[schema.length - 1].hours} uur. Volledige werkhervatting
          is voorzien rond {fullRecoveryDate(schema)}. Houd rekening met de werkaanpassing:{" "}
          {getVal(fields, "beperking").toLowerCase()}.
        </p>
        {alineas.map((t, i) => <p key={i}>{t}</p>)}
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
          Bespreek het concept met je werknemer, vul de open velden ([INVULLEN]) samen in,
          onderteken beiden en bewaar het in je verzuimdossier; leg ook de terugkoppeling van
          de bedrijfsarts vast. Medische gegevens zijn bewust niet opgenomen.
        </p>
        <p className="sign">Met vriendelijke groet,<br/><strong style={{ color: "var(--navy-900)" }}>[INVULLEN: naam afzender]</strong></p>
      </div>
    </div>
  );
}

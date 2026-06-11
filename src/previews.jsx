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
          <dt>Werknemer</dt><Val fields={fields} id="naam" />
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

// 2 — Concept Plan van Aanpak (officiële UWV-structuur, formulier AG140)
export function PvaPreview({ fields, schema }) {
  const flagOrText = (id) => {
    const v = getVal(fields, id);
    return isMissing(v)
      ? <span style={{ color: "var(--flag-text)", fontStyle: "italic", fontWeight: 600 }}>[INVULLEN]</span>
      : v;
  };
  return (
    <div className="doc-preview">
      <DocPreviewHead title="Plan van Aanpak (UWV — formulier AG140)" icon={I.doc} />
      <div className="doc-sheet">
        <h2>Plan van Aanpak</h2>
        <p className="wvp">Wet verbetering poortwachter · UWV-formulier AG140 — concept ter controle</p>

        <h3>Werknemer</h3>
        <dl className="kv">
          <dt>Voorletters en achternaam</dt><Val fields={fields} id="naam" />
          <dt>Geboortedatum</dt><Val fields={fields} id="geboortedatum" />
          <dt>Burgerservicenummer</dt><dd className="flag">[INVULLEN]</dd>
          <dt>Einddatum dienstverband</dt><Val fields={fields} id="einddatum" />
        </dl>

        <h3>Werkgever</h3>
        <dl className="kv">
          <dt>Bedrijfsnaam</dt><Val fields={fields} id="werkgever" />
          <dt>Naam contactpersoon</dt><dd className="flag">[INVULLEN]</dd>
        </dl>

        <h3>Arbodienst / bedrijfsarts</h3>
        <dl className="kv">
          <dt>Naam bedrijfsarts</dt><dd className="flag">[INVULLEN]</dd>
        </dl>

        <h3>Functie van de werknemer</h3>
        <dl className="kv">
          <dt>Functie</dt><Val fields={fields} id="functie" />
          <dt>Eerste ziektedag</dt><Val fields={fields} id="eersteZ" />
        </dl>

        <h3>Mening werknemer en werkgever over de arbeidsmogelijkheden</h3>
        <p>
          Werknemer is belastbaar voor {getVal(fields, "belast").toLowerCase()}. Werkgever en
          werknemer zien mogelijkheden om het eigen werk ({getVal(fields, "uren").toLowerCase()})
          gefaseerd te hervatten volgens het opbouwschema.
        </p>

        <h3>Einddoel</h3>
        <p>
          Volledige werkhervatting in de eigen functie voor {getVal(fields, "uren").toLowerCase()}.
          Verwachting: {getVal(fields, "prognose").toLowerCase()}.
        </p>

        <h3>Afspraken — sociaal-medische zaken</h3>
        <p>
          Werknemer hervat het werk volgens onderstaand opbouwschema. Werkaanpassing:{" "}
          {getVal(fields, "beperking").toLowerCase()}. Start op {getVal(fields, "start")},
          {" "}{getVal(fields, "opbouw").toLowerCase()} uitgebreid.
        </p>
        <table className="schema-table" style={{ marginTop: 6 }}>
          <thead><tr><th>Activiteit (per datum)</th><th>Uren per week</th><th>Planning</th></tr></thead>
          <tbody>
            {schema.slice(0, 4).map((r, i) => (
              <tr key={i}>
                <td className="date">{r.date}</td>
                <td className="hours">{r.hours} uur</td>
                <td className="pct-cell"><div className="pct-bar"><div className="pct-track"><div className="pct-fill" style={{ width: r.pct + "%" }}></div></div><span className="pct-num">{r.pct}%</span></div></td>
              </tr>
            ))}
            <tr><td className="date" style={{ color: "var(--muted)", fontStyle: "italic" }}>…</td><td colSpan="2" style={{ color: "var(--muted)", fontStyle: "italic" }}>oplopend tot {schema[schema.length - 1].hours} uur (100%) per {fullRecoveryDate(schema)}</td></tr>
          </tbody>
        </table>

        <h3>Eerstevolgende evaluatie</h3>
        <p>De voortgang wordt periodiek geëvalueerd. Eerstvolgende evaluatie: {flagOrText("evaluatie")}.</p>

        <h3>Ondertekening</h3>
        <dl className="kv">
          <dt>Werkgever</dt><dd>______________________&nbsp;&nbsp;Datum: __________</dd>
          <dt>Werknemer</dt><dd>______________________&nbsp;&nbsp;Datum: __________</dd>
        </dl>
      </div>
    </div>
  );
}

// 3 — Begeleidend bericht aan werkgever (met de adviezen verweven)
export function BerichtPreview({ fields, schema, reportDate }) {
  const naam = getVal(fields, "naam");
  const werkgever = getVal(fields, "werkgever");
  const alineas = adviceParagraphs(fields, reportDate);
  return (
    <div className="doc-preview">
      <DocPreviewHead title="Begeleidend bericht aan werkgever" icon={I.mail} />
      <div className="doc-sheet msg-sheet">
        <h2 style={{ fontSize: 19 }}>Begeleidend bericht</h2>
        <p className="wvp" style={{ marginBottom: 18 }}>Onderwerp: Concept Plan van aanpak — {naam}</p>

        <p className="greeting">
          Beste {isMissing(werkgever) ? "werkgever" : werkgever}, hierbij ontvang je het
          concept-Plan van aanpak voor je werknemer {naam}, opgesteld naar aanleiding van de
          terugkoppeling van de bedrijfsarts d.d. {reportDate}.
        </p>
        <p>
          Werknemer is belastbaar voor {getVal(fields, "belast").toLowerCase()}. De bedrijfsarts
          adviseert een opbouw vanaf {getVal(fields, "start")}, {getVal(fields, "opbouw").toLowerCase()},
          van {schema[0].hours} naar {schema[schema.length - 1].hours} uur. Volledige werkhervatting
          is voorzien rond {fullRecoveryDate(schema)}. Houd rekening met de werkaanpassing:{" "}
          {getVal(fields, "beperking").toLowerCase()}.
        </p>
        {alineas.map((t, i) => <p key={i}>{t}</p>)}
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

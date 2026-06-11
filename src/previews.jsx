/* Stap 3 — preview van de drie onderdelen, gevuld met de gecontroleerde veldwaarden */

import { I, getVal, isMissing } from "./data.jsx";
import { fullRecoveryDate } from "./engine.js";
import { SchemaRows } from "./fields.jsx";

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

// 2 — Concept Plan van Aanpak
export function PvaPreview({ fields, schema }) {
  const evaluatie = getVal(fields, "evaluatie");
  return (
    <div className="doc-preview">
      <DocPreviewHead title="Concept Plan van Aanpak (WvP)" icon={I.doc} />
      <div className="doc-sheet">
        <h2>Plan van Aanpak</h2>
        <p className="wvp">Wet verbetering poortwachter — concept ter controle</p>

        <h3>1 · Gegevens</h3>
        <dl className="kv">
          <dt>Werknemer</dt><Val fields={fields} id="naam" />
          <dt>Functie</dt><Val fields={fields} id="functie" />
          <dt>Contracturen</dt><Val fields={fields} id="uren" />
          <dt>Eerste ziektedag</dt><Val fields={fields} id="eersteZ" />
          <dt>Werkgever</dt><Val fields={fields} id="werkgever" />
        </dl>

        <h3>2 · Doel van de re-integratie</h3>
        <p>
          Volledige werkhervatting in de eigen functie voor {getVal(fields, "uren").toLowerCase()}. De
          verwachting is: {getVal(fields, "prognose").toLowerCase()}, conform het opbouwschema.
        </p>

        <h3>3 · Afspraken over de werkhervatting</h3>
        <p>
          Werknemer hervat het werk volgens onderstaand opbouwschema, met als
          werkaanpassing: {getVal(fields, "beperking").toLowerCase()}. De opbouw start
          op {getVal(fields, "start")} ({getVal(fields, "belast").toLowerCase()}) en
          wordt {getVal(fields, "opbouw").toLowerCase()} uitgebreid.
        </p>
        <table className="schema-table" style={{ marginTop: 6 }}>
          <thead><tr><th>Per datum</th><th>Uren per week</th><th>Hersteld</th></tr></thead>
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

        <h3>4 · Evaluatie</h3>
        <p>
          De voortgang wordt periodiek geëvalueerd. Eerstvolgende evaluatie:{" "}
          {isMissing(evaluatie)
            ? <span style={{ color: "var(--flag-text)", fontStyle: "italic", fontWeight: 600 }}>[INVULLEN]</span>
            : <strong style={{ color: "var(--navy-900)" }}>{evaluatie}</strong>}.
        </p>
      </div>
    </div>
  );
}

// 3 — Begeleidend bericht aan werkgever
export function BerichtPreview({ fields, schema }) {
  const naam = getVal(fields, "naam");
  const werkgever = getVal(fields, "werkgever");
  return (
    <div className="doc-preview">
      <DocPreviewHead title="Begeleidend bericht aan werkgever" icon={I.mail} />
      <div className="doc-sheet msg-sheet">
        <h2 style={{ fontSize: 19 }}>Begeleidend bericht</h2>
        <p className="wvp" style={{ marginBottom: 18 }}>Onderwerp: Concept Plan van Aanpak — {naam}</p>

        <p className="greeting">Beste {isMissing(werkgever) ? "[werkgever]" : werkgever},</p>
        <p>
          Op basis van de terugkoppeling van de bedrijfsarts is een concept Plan van
          Aanpak opgesteld voor {naam}. In de bijlage vind je drie onderdelen:
          het opbouwadvies, het concept Plan van Aanpak en dit begeleidende bericht.
        </p>
        <p>
          De kern: werknemer is belastbaar ({getVal(fields, "belast").toLowerCase()}) en bouwt
          vanaf {getVal(fields, "start")} {getVal(fields, "opbouw").toLowerCase()} op,
          van {schema[0].hours} naar {schema[schema.length - 1].hours} uur. Volledige
          werkhervatting is voorzien rond {fullRecoveryDate(schema)}. Houd rekening met
          de werkaanpassing: {getVal(fields, "beperking").toLowerCase()}.
        </p>
        <p>
          Loop het concept na, vul de gemarkeerde velden ([INVULLEN]) aan en bespreek
          het Plan van Aanpak samen met de werknemer voordat je het vaststelt. Medische
          gegevens zijn bewust niet opgenomen.
        </p>
        <p className="sign">Met vriendelijke groet,<br/><strong style={{ color: "var(--navy-900)" }}>[INVULLEN: naam casemanager]</strong></p>
      </div>
    </div>
  );
}

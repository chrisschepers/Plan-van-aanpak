/* Opbouwschema-tabel + bewerkbaar paneel met geëxtraheerde velden */

import { I, MISSING } from "./data.jsx";
import { computeDerived, poortwachterTermijnen } from "./advice.js";

// Volledig overzicht van de wettelijke poortwachter-termijnen + wat de werkgever doet.
export function TermijnenTabel({ fields, compact }) {
  const rows = poortwachterTermijnen(fields);
  return (
    <div className="panel termijnen-panel" style={{ marginTop: compact ? 0 : 22 }}>
      <div className="panel-head">
        <div>
          <h3>Poortwachter-termijnen</h3>
          <div className="sub">Wat moet wanneer — gerekend vanaf de eerste ziektedag</div>
        </div>
        <span className="pill pill-navy"><span className="pdot"></span>Wet verbetering poortwachter</span>
      </div>
      <table className="schema-table termijnen-table">
        <thead>
          <tr><th>Termijn</th><th>Mijlpaal</th><th>Wat de werkgever doet</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="date" style={{ whiteSpace: "nowrap" }}>wk {r.week}{r.datum ? <> · {r.datum}</> : null}</td>
              <td style={{ fontWeight: 600, color: "var(--navy-900)" }}>{r.mijlpaal}</td>
              <td style={{ color: "var(--ink-soft)" }}>{r.actie}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SchemaRows({ schema }) {
  return (
    <tbody>
      {schema.map((r, i) => (
        <tr key={i}>
          <td className="date">{r.date}</td>
          <td className="hours">{r.hours} uur</td>
          <td className="pct-cell">
            <div className="pct-bar">
              <div className="pct-track"><div className="pct-fill" style={{ width: r.pct + "%" }}></div></div>
              <span className="pct-num">{r.pct}%</span>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}

export function SchemaTable({ schema, contractHours }) {
  return (
    <div className="panel" style={{ marginTop: 22 }}>
      <div className="panel-head">
        <div>
          <h3>Opbouwschema</h3>
          <div className="sub">Berekend door de rekenmotor · {contractHours} contracturen</div>
        </div>
        <span className="pill pill-ok"><span className="pdot"></span>Deterministisch</span>
      </div>
      <table className="schema-table">
        <thead>
          <tr>
            <th>Per datum</th>
            <th>Uren per week</th>
            <th>Hersteld</th>
          </tr>
        </thead>
        <SchemaRows schema={schema} />
      </table>
    </div>
  );
}

// Velden die een hele zin bevatten krijgen een breed tekstvak.
const LANG = new Set(["belast", "opbouw", "beperking", "werkplek", "werktijden", "prognose"]);
const DATUM = new Set(["eersteZ", "start", "volgendSpreekuur", "geboortedatum", "einddatum"]);

/* Eén veld: label met direct daaronder een gewoon invoervak. Altijd bewerkbaar,
   geen aparte bewerk-knop of statuslabel. Alleen een verplicht veld dat nog leeg
   is valt op. De zin uit het verslag verschijnt onder het vak zodra je erin staat. */
function Veld({ f, manual, bron, actief, onFocus, onEdit, inputRef }) {
  const leeg = f.status === "missing";
  const verplichtLeeg = leeg && !f.optional;
  const waarde = leeg ? "" : f.value;
  const lang = LANG.has(f.id);
  const placeholder = DATUM.has(f.id) ? "dd-mm-jjjj"
    : f.optional ? "Niet vermeld (mag leeg blijven)"
    : manual ? "Zelf invullen" : "Nog invullen";
  const props = {
    id: "veld-" + f.id,
    ref: inputRef,
    className: "veld-input" + (verplichtLeeg ? " leeg" : ""),
    value: waarde,
    placeholder,
    onFocus: () => onFocus(f),
    onChange: (e) => onEdit(f.id, e.target.value),
  };
  return (
    <div className={"veld" + (lang ? " breed" : "")}>
      <label htmlFor={"veld-" + f.id}>
        {f.label}{f.optional && <span className="veld-opt"> · optioneel</span>}
      </label>
      {lang ? <textarea rows={2} {...props} /> : <input type="text" {...props} />}
      {f.hint && <div className="veld-hint">{f.hint}</div>}
      {actief && bron && <div className="veld-bron">Uit het verslag: “{bron}”</div>}
    </div>
  );
}

export function FieldsPanel({ fields, selected, onSelect, onEdit, sources }) {
  const refs = React.useRef({});
  const open = fields.flatMap((g) => g.items).filter((it) => it.status === "missing" && !it.optional);
  const spring = (id) => {
    const el = refs.current[id];
    if (el) { el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" }); }
  };

  return (
    <div className="panel velden-panel">
      {open.length > 0 ? (
        <div className="velden-open">
          <strong>Nog invullen:</strong>{" "}
          {open.map((it, i) => (
            <React.Fragment key={it.id}>
              {i > 0 && ", "}
              <button type="button" onClick={() => spring(it.id)}>{it.label}</button>
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="velden-open ok">{I.checkSm}<span>Alles is ingevuld. Pas aan wat niet klopt.</span></div>
      )}
      {fields.map((g, gi) => (
        <fieldset className="velden-groep" key={gi}>
          <legend>{g.group}</legend>
          {g.sub && <p className="velden-sub">{g.sub}</p>}
          <div className="velden-grid">
            {g.items.map((f) => (
              <Veld
                key={f.id}
                f={f}
                manual={!!g.manual}
                bron={sources ? sources[f.id] : null}
                actief={!!selected && selected.id === f.id}
                onFocus={onSelect}
                onEdit={onEdit}
                inputRef={(el) => { refs.current[f.id] = el; }}
              />
            ))}
          </div>
        </fieldset>
      ))}
      <DerivedGroup fields={fields} />
    </div>
  );
}

// Automatisch berekende, alleen-lezen waarden (geen invoer/controle nodig).
function DerivedGroup({ fields }) {
  const d = computeDerived(fields);
  if (!d.eindeWacht && !d.aow) return null;
  return (
    <div className="velden-berekend">
      {d.eindeWacht && <span>Einde wachttijd (104 weken): <strong>{d.eindeWacht}</strong></span>}
      {d.aow && <span>AOW-datum (indicatief): <strong>{d.aow}</strong></span>}
    </div>
  );
}

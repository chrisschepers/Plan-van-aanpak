/* Opbouwschema-tabel + bewerkbaar paneel met geëxtraheerde velden */

import { I } from "./data.jsx";
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

function FieldRow({ f, selected, onSelect, onEdit }) {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(f.value);
  const isMissing = f.status === "missing";

  function commit() {
    setEditing(false);
    onEdit(f.id, val);
  }

  return (
    <div
      className={"field-row" + (selected ? " sel" : "") + (isMissing ? " missing" : "")}
      onClick={() => onSelect(f)}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onSelect(f); }}
    >
      <div className="flabel">{f.label}</div>
      {editing ? (
        <input
          className="field-input"
          value={val}
          autoFocus
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
        />
      ) : (
        <div className="fval">{f.value}</div>
      )}
      {!editing && (
        <button
          type="button"
          className="fedit"
          title={isMissing ? "Vul dit veld in" : "Bewerk dit veld"}
          aria-label={isMissing ? "Vul dit veld in" : "Bewerk dit veld"}
          onClick={(e) => { e.stopPropagation(); setVal(f.value === "[INVULLEN]" ? "" : f.value); setEditing(true); }}
        >{I.edit}<span className="fedit-txt">{isMissing ? "Invullen" : "Bewerk"}</span></button>
      )}
      <div className="fstatus" style={{ opacity: 1 }}>
        {isMissing
          ? <span className="pill pill-flag"><span className="pdot"></span>Ontbreekt</span>
          : <span className="pill pill-ok"><span className="pdot"></span>Ingevuld</span>}
      </div>
    </div>
  );
}

export function FieldsPanel({ fields, selected, onSelect, onEdit }) {
  const okCount = fields.flatMap(g => g.items).filter(i => i.status === "ok").length;
  const missCount = fields.flatMap(g => g.items).filter(i => i.status === "missing").length;
  return (
    <div className="panel fields-panel">
      <div className="panel-head">
        <div>
          <h3>Geëxtraheerde velden</h3>
          <div className="sub">Klik een veld om de bron te zien</div>
        </div>
        <div className="summary-chips">
          <span className="pill pill-ok"><span className="pdot"></span>{okCount} ingevuld</span>
          {missCount > 0 && <span className="pill pill-flag"><span className="pdot"></span>{missCount} ontbreekt</span>}
        </div>
      </div>
      <div style={{ maxHeight: 560, overflowY: "auto" }}>
        {fields.map((g, gi) => (
          <div className="field-group" key={gi}>
            <div className="gh">{g.group}</div>
            {g.items.map((f) => (
              <FieldRow
                key={f.id}
                f={f}
                selected={selected && selected.id === f.id}
                onSelect={onSelect}
                onEdit={onEdit}
              />
            ))}
          </div>
        ))}
        <DerivedGroup fields={fields} />
      </div>
    </div>
  );
}

// Automatisch berekende, alleen-lezen waarden (geen invoer/controle nodig).
function DerivedGroup({ fields }) {
  const d = computeDerived(fields);
  const rows = [
    { label: "AOW-gerechtigde leeftijd (datum)", value: d.aow, hint: "geboortedatum + 67 jaar en 3 maanden · indicatief, controleer bij SVB" },
    { label: "Einde wachttijd", value: d.eindeWacht, hint: "eerste ziektedag + 104 weken" },
  ];
  return (
    <div className="field-group">
      <div className="gh">Berekend (automatisch)</div>
      {rows.map((r) => (
        <div className="field-row computed" key={r.label}>
          <div className="flabel">{r.label}</div>
          <div className="fval">{r.value || "—"}</div>
          <div className="fstatus" style={{ opacity: 1 }}>
            <span className="pill pill-navy"><span className="pdot"></span>Berekend</span>
          </div>
          <div className="fhint" style={{ gridColumn: 1, fontSize: 12, color: "var(--faint)", marginTop: 2 }}>{r.hint}</div>
        </div>
      ))}
    </div>
  );
}

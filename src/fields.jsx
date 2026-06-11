/* Opbouwschema-tabel + bewerkbaar paneel met geëxtraheerde velden */

import { I } from "./data.jsx";

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
          className="fedit"
          title="Corrigeer"
          onClick={(e) => { e.stopPropagation(); setVal(f.value); setEditing(true); }}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
        >{I.edit}</button>
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
      </div>
    </div>
  );
}

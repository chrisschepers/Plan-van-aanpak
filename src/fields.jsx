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

function FieldRow({ f, selected, onSelect, onEdit, manual, editing, onStartEdit, onStopEdit, rowRef }) {
  const [val, setVal] = React.useState("");
  const isMissing = f.status === "missing";
  // Alleen een écht ontbrekend, verplicht veld krijgt de rode "Ontbreekt"-styling.
  // Optionele of zelf-in-te-vullen velden zijn geen fout → zachtere weergave.
  const hardMiss = isMissing && !f.optional && !manual;

  // Vul het invoerveld met de huidige waarde zodra we in bewerk-modus gaan.
  React.useEffect(() => {
    if (editing) setVal(f.value === MISSING ? "" : f.value);
  }, [editing]);

  function commit() {
    onStopEdit();
    onEdit(f.id, val);
  }

  const emptyText = manual ? "Zelf invullen" : f.optional ? "Niet vermeld" : f.value;

  return (
    <div
      ref={rowRef}
      className={"field-row" + (selected ? " sel" : "") + (hardMiss ? " missing" : "") + (isMissing && !hardMiss ? " soft" : "")}
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
        <div className="fval">{isMissing ? emptyText : f.value}</div>
      )}
      {!editing && (
        <button
          type="button"
          className="fedit"
          title={isMissing ? "Vul dit veld in" : "Bewerk dit veld"}
          aria-label={isMissing ? "Vul dit veld in" : "Bewerk dit veld"}
          onClick={(e) => { e.stopPropagation(); onStartEdit(f.id); }}
        >{I.edit}<span className="fedit-txt">{isMissing ? "Invullen" : "Bewerk"}</span></button>
      )}
      <div className="fstatus" style={{ opacity: 1 }}>
        {isMissing
          ? (manual
              ? <span className="pill pill-navy"><span className="pdot"></span>Zelf invullen</span>
              : f.optional
                ? <span className="pill pill-navy"><span className="pdot"></span>Optioneel</span>
                : <span className="pill pill-flag"><span className="pdot"></span>Ontbreekt</span>)
          : <span className="pill pill-ok"><span className="pdot"></span>Ingevuld</span>}
      </div>
      {f.hint && !editing && (
        <div className="fhint" style={{ gridColumn: 1, fontSize: 12, color: "var(--faint)", marginTop: 3 }}>{f.hint}</div>
      )}
    </div>
  );
}

// Overzicht bovenaan: welke velden nog aandacht vragen, onder elkaar en klikbaar.
// Klikken springt naar het veld en opent het meteen om in te vullen.
function MissingSummary({ fields, onJump }) {
  const nodig = [];  // echte extractie-missers (verplicht)
  const zelf = [];   // werkgeversgegevens die je zelf aanlevert
  for (const g of fields) {
    for (const it of g.items) {
      if (it.status !== "missing" || it.optional) continue;
      (g.manual ? zelf : nodig).push(it);
    }
  }

  if (!nodig.length && !zelf.length) {
    return (
      <div className="miss-summary ok">
        <span className="miss-ico">{I.checkSm}</span>
        <span>Alle benodigde velden zijn ingevuld. Loop ze na en bevestig onderaan.</span>
      </div>
    );
  }

  const item = (it, tone) => (
    <li key={it.id}>
      <button type="button" className="miss-item" onClick={() => onJump(it.id)}>
        <span className={"miss-dot " + tone}></span>
        <span className="miss-label">{it.label}</span>
        <span className="miss-cta">Invullen {I.arrowRight}</span>
      </button>
    </li>
  );

  return (
    <div className="miss-summary">
      <div className="miss-title">{I.flag || I.info} Nog aan te vullen</div>
      {nodig.length > 0 && (
        <ul className="miss-list">{nodig.map((it) => item(it, "flag"))}</ul>
      )}
      {zelf.length > 0 && (
        <>
          <div className="miss-sub">Zelf aanvullen — staan meestal niet in de terugkoppeling:</div>
          <ul className="miss-list">{zelf.map((it) => item(it, "navy"))}</ul>
        </>
      )}
    </div>
  );
}

export function FieldsPanel({ fields, selected, onSelect, onEdit }) {
  const [editingId, setEditingId] = React.useState(null);
  const rowRefs = React.useRef({});
  const okCount = fields.flatMap(g => g.items).filter(i => i.status === "ok").length;
  // Werkgeversvelden (manual) tellen niet als "ontbreekt": dat zijn geen
  // extractie-missers maar invoer die de werkgever zelf aanlevert. Optionele
  // velden (bv. werkplek/werktijden) tellen ook niet mee als "ontbreekt".
  const missCount = fields.filter(g => !g.manual).flatMap(g => g.items).filter(i => i.status === "missing" && !i.optional).length;
  const zelfCount = fields.filter(g => g.manual).flatMap(g => g.items).filter(i => i.status === "missing" && !i.optional).length;

  // Spring naar een veld en open het meteen om in te vullen.
  const jump = (id) => {
    onSelect({ id });
    setEditingId(id);
    const el = rowRefs.current[id];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

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
          {zelfCount > 0 && <span className="pill pill-navy"><span className="pdot"></span>{zelfCount} zelf in te vullen</span>}
        </div>
      </div>
      <MissingSummary fields={fields} onJump={jump} />
      <div style={{ maxHeight: 560, overflowY: "auto" }}>
        {fields.map((g, gi) => (
          <div className="field-group" key={gi}>
            <div className="gh">{g.group}</div>
            {g.sub && <div className="gh-sub" style={{ fontSize: 12.5, color: "var(--faint)", margin: "-4px 0 8px", fontWeight: 400 }}>{g.sub}</div>}
            {g.items.map((f) => (
              <FieldRow
                key={f.id}
                f={f}
                manual={!!g.manual}
                selected={selected && selected.id === f.id}
                onSelect={onSelect}
                onEdit={onEdit}
                editing={editingId === f.id}
                onStartEdit={setEditingId}
                onStopEdit={() => setEditingId(null)}
                rowRef={(el) => { rowRefs.current[f.id] = el; }}
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

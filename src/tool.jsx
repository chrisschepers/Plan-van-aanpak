/* Tool-orchestrator — stap 1 upload · stap 2 verificatie · stap 3 preview */

import { I, CASE, INITIAL_FIELDS, MISSING } from "./data.jsx";
import { computeSchema } from "./engine.js";
import { SchemaTable, FieldsPanel } from "./fields.jsx";
import { SourceDoc } from "./sourcedoc.jsx";
import { AdviesPreview, PvaPreview, BerichtPreview } from "./previews.jsx";
import { downloadWord } from "./download.js";

const TOOL_STEPS = ["Upload", "Controleren", "Downloaden"];

function Stepper({ step }) {
  return (
    <div className="stepper">
      {TOOL_STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className={"st" + (step === i ? " active" : step > i ? " done" : "")}>
            <span className="bub">{step > i ? React.cloneElement(I.checkSm, { style: { width: 14, height: 14 } }) : i + 1}</span>
            <span className="lbl">{s}</span>
          </div>
          {i < TOOL_STEPS.length - 1 && <div className={"sep" + (step > i ? " done" : "")}></div>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ---------- Stap 1: Upload ---------- */
function UploadStep({ onProcessed }) {
  const [file, setFile] = React.useState(null);
  const [drag, setDrag] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  function pickExample() {
    setFile({ name: "terugkoppeling-bedrijfsarts.pdf", size: "248 kB", type: "pdf" });
  }

  if (processing) return <Processing onDone={onProcessed} />;

  return (
    <div className="upload-wrap">
      <div className="step-kicker">Stap 1 van 3</div>
      <div className="tool-head">
        <h1>Upload de terugkoppeling van de bedrijfsarts</h1>
        <p>Sleep het spreekuurverslag erin of kies een bestand. De tool leest de functionele gegevens uit — medische informatie blijft buiten het Plan van Aanpak.</p>
      </div>

      {!file ? (
        <div
          className={"dropzone" + (drag ? " drag" : "")}
          onClick={pickExample}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); pickExample(); }}
        >
          <span className="ico">{I.upload}</span>
          <h3>Sleep je bestand hierheen</h3>
          <p>of klik om de voorbeeldcasus (J. de Vries) te laden</p>
          <div className="formats">PDF of Word · max. 20 MB · verwerking binnen de EER · demo gebruikt de voorbeeldcasus</div>
        </div>
      ) : (
        <div className="file-chip">
          <span className={"fico " + file.type}>PDF</span>
          <div className="meta">
            <div className="nm">{file.name}</div>
            <div className="sz">{file.size} · klaar om te verwerken</div>
          </div>
          <button className="x" title="Verwijder" onClick={() => setFile(null)}>{I.x}</button>
        </div>
      )}

      <div className="privacy-note">
        {I.shield}
        <p><strong>Privacy by design.</strong> Bijzondere persoonsgegevens (diagnose, behandeling, klachten) worden herkend en <strong>niet</strong> overgenomen in het concept. Het bestand wordt na verwerking automatisch verwijderd.</p>
      </div>

      <div className="tool-actions">
        <span></span>
        <button className="btn btn-primary btn-lg" disabled={!file} onClick={() => setProcessing(true)}>
          Verwerk document {I.arrowRight}
        </button>
      </div>
    </div>
  );
}

const PROC = [
  "Document inlezen (PDF)",
  "Medische gegevens filteren",
  "Functionele gegevens extraheren",
  "Opbouwschema berekenen",
];

function Processing({ onDone }) {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const timers = PROC.map((_, i) => setTimeout(() => setStage(i + 1), 320 + i * 360));
    const fin = setTimeout(onDone, 320 + PROC.length * 360 + 250);
    return () => { timers.forEach(clearTimeout); clearTimeout(fin); };
  }, []);
  return (
    <div className="processing">
      <div className="proc-ring"></div>
      <h3 style={{ fontSize: 21 }}>Concept wordt opgesteld…</h3>
      <p style={{ color: "var(--muted)", marginTop: 8 }}>Dit duurt normaal een paar seconden.</p>
      <div className="proc-steps">
        {PROC.map((p, i) => (
          <div className={"proc-line" + (stage > i ? " ok" : stage === i ? " active" : "")} key={i}>
            <span className="tick">{stage > i ? React.cloneElement(I.checkSm, { style: { width: 12, height: 12 } }) : null}</span>
            {p}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Stap 2: Verificatie ---------- */
function VerifyStep({ onBack, onNext, checked, setChecked, fields, onEdit, schema }) {
  const [selected, setSelected] = React.useState(fields[0].items[0]);
  const activeSrc = selected ? selected.src : null;

  return (
    <div>
      <div className="step-kicker">Stap 2 van 3</div>
      <div className="tool-head">
        <h1>Controleer de geëxtraheerde gegevens</h1>
        <p>Links de ingevulde velden, rechts de bron. Klik een veld om de bijbehorende passage te zien. Corrigeer waar nodig en vul ontbrekende velden aan.</p>
      </div>

      <div className="gate-banner">
        {I.hand}
        <span><strong>Menselijke controle is verplicht.</strong> Niets wordt vastgesteld of gedownload zonder dat jij het hebt nagelopen en bevestigd.</span>
      </div>

      <div className="verify-grid">
        <FieldsPanel fields={fields} selected={selected} onSelect={setSelected} onEdit={onEdit} />
        <SourceDoc active={activeSrc} onSel={(id) => {
          const f = fields.flatMap(g => g.items).find(it => it.src === id);
          if (f) setSelected(f);
        }} />
      </div>

      <SchemaTable schema={schema} contractHours={CASE.contractHours} />

      <div className="verify-foot">
        <label className={"control-check" + (checked ? " on" : "")} onClick={() => setChecked(!checked)}>
          <span className="box">{I.checkSm}</span>
          <span className="ct">
            <strong>Ik heb de gegevens gecontroleerd</strong>
            Ik bevestig dat ik de geëxtraheerde gegevens heb nagelopen en corrigeer ontbrekende velden vóór vaststelling.
          </span>
        </label>
        <button className="btn btn-primary btn-lg" disabled={!checked} onClick={onNext}>
          Naar preview {I.arrowRight}
        </button>
      </div>

      <div className="tool-actions">
        <button className="btn btn-ghost" onClick={onBack}>{I.arrowLeft} Terug naar upload</button>
        <span></span>
      </div>
    </div>
  );
}

/* ---------- Stap 3: Preview ---------- */
function PreviewStep({ onBack, controleOk, fields, schema }) {
  const [tab, setTab] = React.useState(0);
  const [downloaded, setDownloaded] = React.useState(null);
  const tabs = [
    { t: "Opbouwadvies", el: <AdviesPreview fields={fields} schema={schema} reportDate={CASE.reportDate} /> },
    { t: "Plan van Aanpak", el: <PvaPreview fields={fields} schema={schema} /> },
    { t: "Begeleidend bericht", el: <BerichtPreview fields={fields} schema={schema} /> },
  ];

  function handleDownload() {
    const filename = downloadWord(fields, schema, CASE.reportDate);
    setDownloaded(filename);
  }

  return (
    <div>
      <div className="step-kicker">Stap 3 van 3</div>
      <div className="tool-head">
        <h1>Preview en download</h1>
        <p>Bekijk de drie onderdelen. Stel het concept samen met de werknemer vast en download het als Word-document.</p>
      </div>

      <div className="preview-tabs">
        {tabs.map((tb, i) => (
          <button key={i} className={tab === i ? "active" : ""} onClick={() => setTab(i)}>
            <span className="tnum">{i + 1}</span><span className="txt">{tb.t}</span>
          </button>
        ))}
      </div>

      {tabs[tab].el}

      <div className="download-bar">
        <div className="dl-info">
          <span className="ico">{I.download}</span>
          <div>
            <h4>Download alle drie de onderdelen als Word</h4>
            <p>
              {controleOk
                ? <span className="review-confirm">{I.checkSm} Menselijke controle bevestigd in stap 2</span>
                : "Controle in stap 2 is vereist vóór downloaden"}
            </p>
          </div>
        </div>
        <button className="btn btn-accent btn-lg" disabled={!controleOk} onClick={handleDownload}>
          {I.download} Download als Word
        </button>
      </div>

      <div className="tool-actions">
        <button className="btn btn-ghost" onClick={onBack}>{I.arrowLeft} Terug naar controle</button>
        <span></span>
      </div>

      {downloaded && (
        <div className="toast" onClick={() => setDownloaded(null)}>
          <span className="ico">{I.checkSm}</span>
          <div>
            <div className="tt">{downloaded} gedownload</div>
            <div className="ts">Concept · controleer en stel vast met de werknemer</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Tool-shell ---------- */
export function Tool({ onClose }) {
  const [step, setStep] = React.useState(0);
  const [checked, setChecked] = React.useState(false);
  const [fields, setFields] = React.useState(INITIAL_FIELDS);
  const schema = React.useMemo(() => computeSchema(CASE), []);

  function handleEdit(id, value) {
    setFields(prev => prev.map(g => ({
      ...g,
      items: g.items.map(it => it.id === id
        ? { ...it, value, status: value && value !== MISSING ? "ok" : "missing" }
        : it)
    })));
  }

  React.useEffect(() => {
    const body = document.querySelector(".tool-body");
    if (body) body.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }, [step]);

  return (
    <div className="tool">
      <div className="tool-bar">
        <div className="tool-bar-inner">
          <button className="tool-back" onClick={onClose}>{I.arrowLeft} Terug naar site</button>
          <Stepper step={step} />
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); onClose(); }} style={{ fontSize: 15 }}>
            <span className="mark" style={{ width: 28, height: 28 }}>{I.doc}</span>
          </a>
        </div>
      </div>
      <div className="tool-body">
        {step === 0 && <UploadStep onProcessed={() => setStep(1)} />}
        {step === 1 && <VerifyStep onBack={() => setStep(0)} onNext={() => setStep(2)} checked={checked} setChecked={setChecked} fields={fields} onEdit={handleEdit} schema={schema} />}
        {step === 2 && <PreviewStep onBack={() => setStep(1)} controleOk={checked} fields={fields} schema={schema} />}
      </div>
    </div>
  );
}

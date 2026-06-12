/* Tool-orchestrator — stap 1 upload · stap 2 verificatie · stap 3 preview.
   Twee bronnen voor de gegevens:
   - Demo: de voorbeeldcasus (J. de Vries), volledig client-side.
   - AI: een geüpload bestand of geplakte tekst → backend (Claude) → gegevens. */

import { I, CASE, INITIAL_FIELDS, MISSING } from "./data.jsx";
import { computeSchema } from "./engine.js";
import { SchemaTable, FieldsPanel, TermijnenTabel } from "./fields.jsx";
import { SourceDoc } from "./sourcedoc.jsx";
import { AdviesPreview, PvaPreview, BerichtPreview } from "./previews.jsx";
import { downloadCombined } from "./download.js";
import { hasBackend } from "./config.js";
import { extractCasus } from "./extract.js";

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

const MB = 1024 * 1024;
function fmtSize(bytes) {
  if (bytes >= MB) return (bytes / MB).toFixed(1) + " MB";
  return Math.max(1, Math.round(bytes / 1024)) + " kB";
}
function extOf(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

function demoCasus() {
  const schema = computeSchema(CASE);
  return {
    mode: "demo", fields: INITIAL_FIELDS, schema, schemaZelfOpgesteld: false, reportDate: CASE.reportDate, sources: null, contractHours: CASE.contractHours,
    functieomschrijving: "Administratief medewerker: postverwerking, gegevensinvoer, factuurcontrole, archiefbeheer en telefonische klantvragen.",
    taaksuggestie: "lichte administratieve taken zoals gegevensinvoer en het ordenen van dossiers, in blokken van beperkte duur met afwisseling tussen zitten en staan, en zonder taken met piekbelasting of strakke deadlines",
    signalen: {},
  };
}

/* ---------- Stap 1: Upload ---------- */
function UploadStep({ onResult }) {
  const [file, setFile] = React.useState(null);   // { name,size,type,real,file? }
  const [paste, setPaste] = React.useState(false);
  const [text, setText] = React.useState("");
  const [drag, setDrag] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);   // AI-aanroep loopt
  const [demoProc, setDemoProc] = React.useState(false);
  const [noMedical, setNoMedical] = React.useState(false);
  const [functie, setFunctie] = React.useState("");   // optionele functieomschrijving
  const inputRef = React.useRef(null);

  const ALLOWED = ["pdf", "doc", "docx", "txt"];

  function acceptFile(f) {
    if (!f) return;
    const ext = extOf(f.name);
    if (!ALLOWED.includes(ext)) { setError("Ondersteund: PDF, Word (.doc/.docx) of platte tekst (.txt)."); return; }
    if (f.size > 20 * MB) { setError("Het bestand is groter dan 20 MB."); return; }
    setError(null);
    setFile({ name: f.name, size: fmtSize(f.size), type: ext === "pdf" ? "pdf" : "doc", real: true, file: f });
  }

  function pickExample() {
    setError(null); setPaste(false);
    setFile({ name: "terugkoppeling-bedrijfsarts.pdf", size: "248 kB", type: "pdf", real: false });
  }

  async function process() {
    setError(null);
    if (file && !file.real) { setDemoProc(true); return; }          // voorbeeldcasus
    if (!hasBackend()) {
      setError("Er is nog geen AI-backend gekoppeld. Gebruik voorlopig de voorbeeldcasus, of stel de backend-URL in (window.__PVA_BACKEND__).");
      return;
    }
    setBusy(true);
    try {
      const fo = functie.trim();
      const casus = await extractCasus(file ? { file: file.file, functieomschrijving: fo } : { text, functieomschrijving: fo });
      onResult(casus);
    } catch (e) {
      setError("Verwerking mislukt: " + (e && e.message ? e.message : "onbekende fout"));
    } finally {
      setBusy(false);
    }
  }

  if (demoProc) return <Processing onDone={() => onResult(demoCasus())} />;
  if (busy) return <AiBusy />;

  const isReal = (file && file.real) || (paste && text.trim().length > 20);
  const canSubmit = (!!file || (paste && text.trim().length > 20)) && (!isReal || noMedical);

  return (
    <div className="upload-wrap">
      <div className="step-kicker">Stap 1 van 3</div>
      <div className="tool-head">
        <h1>Lever de terugkoppeling van de bedrijfsarts aan</h1>
        <p>Upload het spreekuurverslag (PDF/Word) of plak de tekst. De AI leest de functionele gegevens uit — medische informatie en BSN blijven buiten het Plan van Aanpak.</p>
      </div>

      <input ref={inputRef} type="file"
        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        style={{ display: "none" }}
        onChange={(e) => acceptFile(e.target.files && e.target.files[0])} />

      {!file && !paste && (
        <div
          className={"dropzone" + (drag ? " drag" : "")}
          onClick={() => inputRef.current && inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); acceptFile(e.dataTransfer.files && e.dataTransfer.files[0]); }}
        >
          <span className="ico">{I.upload}</span>
          <h3>Sleep je bestand hierheen</h3>
          <p>of klik om een PDF of Word-bestand te kiezen</p>
          <div className="formats">PDF, Word of tekst · max. 20 MB</div>
        </div>
      )}

      {file && (
        <div className="file-chip">
          <span className={"fico " + file.type}>{file.type === "pdf" ? "PDF" : "DOC"}</span>
          <div className="meta">
            <div className="nm">{file.name}</div>
            <div className="sz">{file.size} · klaar om te verwerken</div>
          </div>
          <button className="x" title="Verwijder" onClick={() => setFile(null)}>{I.x}</button>
        </div>
      )}

      {paste && !file && (
        <textarea className="paste-area" rows={9} value={text} autoFocus
          onChange={(e) => setText(e.target.value)}
          placeholder="Plak hier de (fictieve) terugkoppeling van de bedrijfsarts…" />
      )}

      {error && <div className="upload-error">{error}</div>}

      {!file && (
        <p className="example-link">
          {!paste
            ? <>Liever tekst plakken? <button type="button" onClick={() => { setPaste(true); setError(null); }}>Plak de tekst</button> · </>
            : <>Toch een bestand? <button type="button" onClick={() => { setPaste(false); setText(""); }}>Kies een bestand</button> · </>}
          Geen casus bij de hand? <button type="button" onClick={pickExample}>Gebruik de voorbeeldcasus (J. de Vries)</button>
        </p>
      )}

      {!hasBackend() && (
        <div className="demo-note">
          {I.info}
          <p><strong>AI nog niet gekoppeld.</strong> Zonder backend werkt alleen de voorbeeldcasus. Zet je Railway-URL in <code>window.__PVA_BACKEND__</code> om echte documenten te laten uitlezen. Gebruik uitsluitend fictieve terugkoppelingen.</p>
        </div>
      )}

      <div className="func-omschrijving">
        <label htmlFor="func-omschr"><strong>Functieomschrijving van de werknemer</strong> <span className="optioneel">(optioneel)</span></label>
        <p className="func-hint">Plak de kerntaken. Dan stelt de tool in het begeleidend bericht passende aangepaste taken voor, binnen de afgegeven mogelijkheden — als gespreksopening met de werknemer.</p>
        <textarea id="func-omschr" className="paste-area" rows={4} value={functie}
          onChange={(e) => setFunctie(e.target.value)}
          placeholder="Bijv. kerntaken, verantwoordelijkheden en typische werkzaamheden…" />
      </div>

      <div className="privacy-note">
        {I.shield}
        <p><strong>Privacy by design.</strong> Bijzondere persoonsgegevens (diagnose, behandeling, klachten) en het BSN worden <strong>niet</strong> overgenomen in het concept.</p>
      </div>

      {isReal && (
        <label className={"control-check confirm-medical" + (noMedical ? " on" : "")} onClick={() => setNoMedical(!noMedical)}>
          <span className="box">{I.checkSm}</span>
          <span className="ct">
            <strong>Ik heb geen medische gegevens geüpload</strong>
            Ik bevestig dat dit document uitsluitend functionele gegevens bevat (geen diagnose, klachten of behandeling) en dat ik een fictieve terugkoppeling gebruik.
          </span>
        </label>
      )}

      <div className="tool-actions">
        <span></span>
        <button className="btn btn-primary btn-lg" disabled={!canSubmit} onClick={process}>
          Verwerk {I.arrowRight}
        </button>
      </div>
    </div>
  );
}

function AiBusy() {
  return (
    <div className="processing">
      <div className="proc-ring"></div>
      <h3 style={{ fontSize: 21 }}>De AI leest de terugkoppeling…</h3>
      <p style={{ color: "var(--muted)", marginTop: 8 }}>Functionele gegevens worden uitgelezen; medische informatie wordt gefilterd. Dit duurt meestal 5–20 seconden.</p>
    </div>
  );
}

const PROC = [
  "Document inlezen",
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

/* Bronpaneel voor AI-modus: toont de bronpassage bij het geselecteerde veld. */
function AiSourcePanel({ selected, sources }) {
  const snippet = selected && sources ? sources[selected.id] : null;
  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Bron · terugkoppeling bedrijfsarts</h3>
          <div className="sub">Door de AI uitgelezen passages</div>
        </div>
        <span className="pill pill-navy"><span className="pdot"></span>AI-extractie</span>
      </div>
      <div className="doc-legend">
        <span>{I.shield} Medische gegevens en BSN zijn gefilterd</span>
      </div>
      <div className="srcdoc" style={{ maxHeight: 560, overflowY: "auto" }}>
        <p className="dh">Geselecteerd veld</p>
        <p className="dtitle">{selected ? selected.label : "—"}</p>
        {snippet ? (
          <p style={{ marginTop: 14 }}>
            <span className="hl active">{snippet}</span>
          </p>
        ) : (
          <p className="dmeta" style={{ marginTop: 14 }}>
            Geen bronpassage voor dit veld — dit gegeven komt niet uit de terugkoppeling (vul je zelf aan) of is door het medisch filter weggelaten.
          </p>
        )}
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--muted)" }}>
          Klik links op een veld om de bijbehorende passage te tonen. Controleer elk veld vóór vaststelling.
        </p>
      </div>
    </div>
  );
}

/* ---------- Stap 2: Verificatie ---------- */
function VerifyStep({ onBack, onNext, checked, setChecked, casus, onEdit }) {
  const { fields, schema, mode, sources } = casus;
  const allItems = fields.flatMap((g) => g.items);
  const [selectedId, setSelectedId] = React.useState(allItems[0] ? allItems[0].id : null);
  const selected = allItems.find((it) => it.id === selectedId) || allItems[0] || null;
  const select = (f) => setSelectedId(f.id);
  const activeSrc = selected ? selected.src : null;
  const contractHours = schema[schema.length - 1] ? schema[schema.length - 1].hours : 0;

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
        <FieldsPanel fields={fields} selected={selected} onSelect={select} onEdit={onEdit} />
        {mode === "demo"
          ? <SourceDoc active={activeSrc} onSel={(id) => {
              const f = allItems.find(it => it.src === id);
              if (f) setSelectedId(f.id);
            }} />
          : <AiSourcePanel selected={selected} sources={sources} />}
      </div>

      <SchemaTable schema={schema} contractHours={contractHours} />

      <TermijnenTabel fields={fields} />

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
function PreviewStep({ onBack, controleOk, casus }) {
  const { fields, schema, reportDate, taaksuggestie, functieomschrijving, signalen, schemaZelfOpgesteld } = casus;
  const [tab, setTab] = React.useState(0);
  const [downloaded, setDownloaded] = React.useState(null);
  const [busyKey, setBusyKey] = React.useState(null);
  const tabs = [
    { t: "Opbouwadvies", el: <AdviesPreview fields={fields} schema={schema} reportDate={reportDate} schemaZelfOpgesteld={schemaZelfOpgesteld} /> },
    { t: "Plan van Aanpak", el: <PvaPreview fields={fields} schema={schema} functieomschrijving={functieomschrijving} /> },
    { t: "Begeleidend bericht", el: <BerichtPreview fields={fields} schema={schema} reportDate={reportDate} taaksuggestie={taaksuggestie} signalen={signalen} schemaZelfOpgesteld={schemaZelfOpgesteld} /> },
  ];

  async function run(key, fn) {
    setBusyKey(key);
    try { setDownloaded(await fn()); }
    catch (e) { setDownloaded("FOUT: " + (e && e.message ? e.message : "download mislukt")); }
    finally { setBusyKey(null); }
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
            <h4>Eén Word-document: begeleidend bericht + Plan van aanpak (UWV)</h4>
            <p>
              {controleOk
                ? <span className="review-confirm">{I.checkSm} Menselijke controle bevestigd in stap 2</span>
                : "Controle in stap 2 is vereist vóór downloaden"}
            </p>
          </div>
        </div>
        <div className="dl-buttons">
          <button className="btn btn-accent btn-lg" disabled={!controleOk || busyKey} onClick={() => run("doc", () => downloadCombined(fields, schema, reportDate, taaksuggestie, functieomschrijving, signalen, schemaZelfOpgesteld))}>
            {I.download} {busyKey === "doc" ? "Bezig…" : "Download als Word (.docx)"}
          </button>
        </div>
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
  const [casus, setCasus] = React.useState(null);

  function handleResult(c) { setCasus(c); setChecked(false); setStep(1); }

  function handleEdit(id, value) {
    setCasus(prev => !prev ? prev : {
      ...prev,
      fields: prev.fields.map(g => ({
        ...g,
        items: g.items.map(it => it.id === id
          ? { ...it, value, status: value && value !== MISSING ? "ok" : "missing" }
          : it),
      })),
    });
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
        {step === 0 && <UploadStep onResult={handleResult} />}
        {step === 1 && casus && <VerifyStep onBack={() => setStep(0)} onNext={() => setStep(2)} checked={checked} setChecked={setChecked} casus={casus} onEdit={handleEdit} />}
        {step === 2 && casus && <PreviewStep onBack={() => setStep(1)} controleOk={checked} casus={casus} />}
      </div>
    </div>
  );
}

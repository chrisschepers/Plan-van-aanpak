/* Tool-orchestrator — stap 1 upload · stap 2 verificatie · stap 3 preview.
   Twee bronnen voor de gegevens:
   - Demo: de voorbeeldcasus (J. de Vries), volledig client-side.
   - AI: een geüpload bestand of geplakte tekst → backend (Claude) → gegevens. */

import { I, MISSING } from "./data.jsx";
import { SchemaTable, FieldsPanel, TermijnenTabel } from "./fields.jsx";
import { SourceDoc } from "./sourcedoc.jsx";
import { AdviesPreview, PvaPreview, BerichtPreview } from "./previews.jsx";
import { downloadBericht, downloadUwvPva } from "./download.js";
import { hasBackend } from "./config.js";
import { extractCasus } from "./extract.js";
import { authConfigured } from "./supa.js";
import { computeWazo } from "./engine.js";
import { computeTijdlijn } from "./advice.js";
import { PoortwachterTijdlijn } from "./tijdlijn.jsx";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

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

/* ---------- Stap 1: Upload ---------- */
function UploadStep({ onResult, session, onNeedLogin, credits, onNeedCredits }) {
  const [file, setFile] = React.useState(null);   // { name,size,type,real,file? }
  const [paste, setPaste] = React.useState(false);
  const [text, setText] = React.useState("");
  const [drag, setDrag] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);   // AI-aanroep loopt
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

  async function process() {
    setError(null);
    if (!hasBackend()) {
      setError("Er is nog geen AI-backend gekoppeld (window.__PVA_BACKEND__ ontbreekt).");
      return;
    }
    if (authConfigured() && !session) {
      if (onNeedLogin) onNeedLogin();
      else setError("Log in om echte documenten te verwerken.");
      return;
    }
    if (typeof credits === "number" && credits <= 0) {
      if (onNeedCredits) onNeedCredits();
      else setError("Je hebt geen credits meer. Koop credits om door te gaan.");
      return;
    }
    setBusy(true);
    try {
      const fo = functie.trim();
      const token = session && session.access_token;
      const casus = await extractCasus(file ? { file: file.file, functieomschrijving: fo, accessToken: token } : { text, functieomschrijving: fo, accessToken: token });
      const iv = casus.inputvalidatie;
      if (iv && iv.geschikt === false) {
        // Stap 0: geen geschikt documenttype → geen PvA genereren, blijf op stap 1.
        setError(
          "Dit lijkt geen terugkoppeling van de bedrijfsarts" +
          (iv.documenttype ? ` (herkend als: ${iv.documenttype})` : "") +
          ". " + (iv.toelichting || "Lever de terugkoppeling of het advies van de bedrijfsarts aan.")
        );
        return;
      }
      onResult(casus);
    } catch (e) {
      if (e && e.code === "no_credits") {
        if (onNeedCredits) onNeedCredits();
        else setError("Je hebt geen credits meer. Koop credits om door te gaan.");
      } else {
        setError("Verwerking mislukt: " + (e && e.message ? e.message : "onbekende fout"));
      }
    } finally {
      setBusy(false);
    }
  }

  if (busy) return <AiBusy />;

  const hasInput = !!file || (paste && text.trim().length > 20);
  const canSubmit = hasInput && noMedical;

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
            ? <>Liever tekst plakken? <button type="button" onClick={() => { setPaste(true); setError(null); }}>Plak de tekst</button></>
            : <>Toch een bestand? <button type="button" onClick={() => { setPaste(false); setText(""); }}>Kies een bestand</button></>}
        </p>
      )}

      {!hasBackend() && (
        <div className="demo-note">
          {I.info}
          <p><strong>AI nog niet gekoppeld.</strong> Zet je Railway-URL in <code>window.__PVA_BACKEND__</code> om documenten te laten uitlezen.</p>
        </div>
      )}

      {hasBackend() && authConfigured() && !session && (
        <div className="demo-note">
          {I.info}
          <p><strong>Inloggen vereist.</strong> <button type="button" onClick={onNeedLogin}>Log in</button> om je terugkoppeling te verwerken.</p>
        </div>
      )}

      {hasBackend() && session && typeof credits === "number" && (
        <div className="demo-note">
          {I.info}
          <p>Een verwerking kost <strong>1 credit</strong>. Je hebt nog <strong>{credits}</strong> credit{credits === 1 ? "" : "s"}.{credits <= 0 && <> <button type="button" onClick={onNeedCredits}>Koop credits</button></>}</p>
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

      {hasInput && (
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

/* Handmatige gatingvraag zwangerschap → uitgerekende datum/meerling voor WAZO.
   Komt NIET uit de terugkoppeling; de gebruiker vult dit zelf in. */
function ZwangerschapPanel({ value, onChange }) {
  const v = value || {};
  const set = (patch) => onChange({ ...v, ...patch });
  return (
    <div className="panel zwanger-panel" style={{ marginTop: 22 }}>
      <div className="panel-head">
        <div><h3>Zwangerschap &amp; WAZO-verlof</h3><div className="sub">Niet uit de terugkoppeling — vul dit zelf in</div></div>
      </div>
      <label className={"control-check" + (v.actief ? " on" : "")} onClick={() => set({ actief: !v.actief })}>
        <span className="box">{I.checkSm}</span>
        <span className="ct">
          <strong>Is uw medewerker zwanger?</strong>
          Het zwangerschaps-/bevallingsverlof (WAZO) pauzeert de wachttijd; de einde-wachttijd schuift dan op.
        </span>
      </label>
      {v.actief && (
        <div className="wazo-inputs">
          <label className="wazo-field">
            <span>Uitgerekende datum</span>
            <input type="date" value={v.uitgerekendeDatum || ""} onChange={(e) => set({ uitgerekendeDatum: e.target.value })} />
          </label>
          <label className="wazo-field">
            <span>Werkelijke bevallingsdatum <em>(indien al bevallen)</em></span>
            <input type="date" value={v.werkelijkeBevalling || ""} onChange={(e) => set({ werkelijkeBevalling: e.target.value })} />
          </label>
          <label className={"control-check wazo-meerling" + (v.meerling ? " on" : "")} onClick={() => set({ meerling: !v.meerling })}>
            <span className="box">{I.checkSm}</span>
            <span className="ct"><strong>Tweeling of meerling</strong>Verlofvenster 10–8 wk vóór en totaal minimaal 20 weken.</span>
          </label>
          {!ISO.test(v.uitgerekendeDatum || "") && (
            <p className="wazo-hint">{I.info} Vul de uitgerekende datum in om het WAZO-verlof en de opgeschoven tijdlijn te berekenen.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* Verzuim-tijdlijn voor de actuele casus, optioneel verlengd door WAZO. */
function TijdlijnPanel({ fields, zwangerschap }) {
  const z = zwangerschap || {};
  let wazo = null;
  if (z.actief && ISO.test(z.uitgerekendeDatum || "")) {
    try {
      wazo = computeWazo({
        uitgerekendeDatum: z.uitgerekendeDatum,
        meerling: !!z.meerling,
        werkelijkeBevalling: ISO.test(z.werkelijkeBevalling || "") ? z.werkelijkeBevalling : undefined,
      });
    } catch { wazo = null; }
  }
  const tijdlijn = computeTijdlijn(fields, { wazo });
  return (
    <div className="panel tijdlijn-panel" style={{ marginTop: 22 }}>
      <div className="panel-head">
        <div><h3>Tijdlijn verzuim</h3><div className="sub">Mijlpalen vanaf de eerste ziektedag tot einde wachttijd</div></div>
      </div>
      {tijdlijn
        ? <PoortwachterTijdlijn tijdlijn={tijdlijn} />
        : <p style={{ padding: "4px 2px", color: "var(--ink-soft)" }}>Geef de eerste ziektedag op, dan tonen we de volledige tijdlijn.</p>}
    </div>
  );
}

/* ---------- Stap 2: Verificatie ---------- */
function VerifyStep({ onBack, onNext, checked, setChecked, casus, onEdit, zwangerschap, setZwangerschap }) {
  const { fields, schema, mode, sources } = casus;
  const allItems = fields.flatMap((g) => g.items);
  const [selectedId, setSelectedId] = React.useState(allItems[0] ? allItems[0].id : null);
  const selected = allItems.find((it) => it.id === selectedId) || allItems[0] || null;
  const select = (f) => setSelectedId(f.id);
  const activeSrc = selected ? selected.src : null;
  const contractHours = schema[schema.length - 1] ? schema[schema.length - 1].hours : 0;
  const geenOpbouw = !!casus.opbouwReden || schema.length === 0;

  // Stap 0-signalen voor de controleur: meest recente terugkoppeling + tegenstrijdigheden.
  const iv = casus.inputvalidatie;
  const waarschuwingen = [];
  if (iv) {
    if (iv.meestRecenteSpreekuur) waarschuwingen.push(`Er zijn meerdere spreekuurdata aangetroffen; de tool gebruikt de meest recente (${iv.meestRecenteSpreekuur}). Vermeld dit in het begeleidend bericht.`);
    (iv.tegenstrijdigheden || []).forEach((t) => waarschuwingen.push(`Tegenstrijdig gegeven — niet automatisch overgenomen, vul handmatig aan: ${t}`));
  }

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

      {waarschuwingen.length > 0 && (
        <div className="demo-note" style={{ marginBottom: 16 }}>
          {I.info}
          <div>
            <strong>Let op bij de controle</strong>
            <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
              {waarschuwingen.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="verify-grid">
        <FieldsPanel fields={fields} selected={selected} onSelect={select} onEdit={onEdit} />
        {mode === "demo"
          ? <SourceDoc active={activeSrc} onSel={(id) => {
              const f = allItems.find(it => it.src === id);
              if (f) setSelectedId(f.id);
            }} />
          : <AiSourcePanel selected={selected} sources={sources} />}
      </div>

      {geenOpbouw
        ? <div className="panel" style={{ marginTop: 22 }}>
            <div className="panel-head"><div><h3>Opbouwschema</h3><div className="sub">Geen oplopend schema in deze situatie</div></div></div>
            <p style={{ padding: "4px 2px", color: "var(--ink-soft)" }}>{casus.opbouwReden || "Een opbouwschema is op dit moment niet aan de orde."}</p>
          </div>
        : <SchemaTable schema={schema} contractHours={contractHours} />}

      <TermijnenTabel fields={fields} />

      <ZwangerschapPanel value={zwangerschap} onChange={setZwangerschap} />
      <TijdlijnPanel fields={fields} zwangerschap={zwangerschap} />

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
  const { fields, schema, reportDate, taaksuggestie, functieomschrijving, signalen, schemaZelfOpgesteld, opbouwReden } = casus;
  const [tab, setTab] = React.useState(0);
  const [downloaded, setDownloaded] = React.useState(null);
  const [busyKey, setBusyKey] = React.useState(null);
  const tabs = [
    { t: "Opbouwadvies", el: <AdviesPreview fields={fields} schema={schema} reportDate={reportDate} schemaZelfOpgesteld={schemaZelfOpgesteld} opbouwReden={opbouwReden} /> },
    { t: "Plan van Aanpak", el: <PvaPreview fields={fields} schema={schema} functieomschrijving={functieomschrijving} opbouwReden={opbouwReden} signalen={signalen} /> },
    { t: "Begeleidend bericht", el: <BerichtPreview fields={fields} schema={schema} reportDate={reportDate} taaksuggestie={taaksuggestie} signalen={signalen} schemaZelfOpgesteld={schemaZelfOpgesteld} opbouwReden={opbouwReden} /> },
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
            <h4>Twee aparte documenten</h4>
            <p>
              {controleOk
                ? <><span className="review-confirm">{I.checkSm} Menselijke controle bevestigd in stap 2.</span> Het Plan van aanpak hoort in het personeelsdossier; de adviezen niet — daarom apart.</>
                : "Controle in stap 2 is vereist vóór downloaden"}
            </p>
          </div>
        </div>
        <div className="dl-buttons">
          <button className="btn btn-accent btn-lg" disabled={!controleOk || busyKey} onClick={() => run("pva", () => downloadUwvPva(fields, schema, functieomschrijving, opbouwReden, signalen))}>
            {I.download} {busyKey === "pva" ? "Bezig…" : "Plan van aanpak (UWV) — voor dossier"}
          </button>
          <button className="btn btn-primary btn-lg" disabled={!controleOk || busyKey} onClick={() => run("bericht", () => downloadBericht(fields, schema, reportDate, taaksuggestie, signalen, schemaZelfOpgesteld, opbouwReden))}>
            {I.download} {busyKey === "bericht" ? "Bezig…" : "Begeleidend bericht & adviezen"}
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
export function Tool({ onClose, session, onNeedLogin, credits, onNeedCredits, onCreditsChange }) {
  const [step, setStep] = React.useState(0);
  const [checked, setChecked] = React.useState(false);
  const [casus, setCasus] = React.useState(null);
  const [zwangerschap, setZwangerschap] = React.useState({ actief: false });

  function handleResult(c) {
    if (c && typeof c.balance === "number" && onCreditsChange) onCreditsChange(c.balance);
    setCasus(c); setChecked(false); setStep(1);
  }

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
        {step === 0 && <UploadStep onResult={handleResult} session={session} onNeedLogin={onNeedLogin} credits={credits} onNeedCredits={onNeedCredits} />}
        {step === 1 && casus && <VerifyStep onBack={() => setStep(0)} onNext={() => setStep(2)} checked={checked} setChecked={setChecked} casus={casus} onEdit={handleEdit} zwangerschap={zwangerschap} setZwangerschap={setZwangerschap} />}
        {step === 2 && casus && <PreviewStep onBack={() => setStep(1)} controleOk={checked} casus={casus} />}
      </div>
    </div>
  );
}

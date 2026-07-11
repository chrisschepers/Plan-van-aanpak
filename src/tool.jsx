/* Tool-orchestrator — stap 1 upload · stap 2 verificatie · stap 3 preview.
   Twee bronnen voor de gegevens:
   - Demo: de voorbeeldcasus (J. de Vries), volledig client-side.
   - AI: een geüpload bestand of geplakte tekst → backend (Claude) → gegevens. */

import { I, MISSING } from "./data.jsx";
import { getVal } from "./casedata.js";
import { SchemaTable, FieldsPanel } from "./fields.jsx";
import { SourceDoc } from "./sourcedoc.jsx";
import { AdviesPreview, PvaPreview, BerichtPreview, WerknemerBerichtPreview } from "./previews.jsx";
import { downloadBericht, downloadUwvPva, downloadWerknemerBericht } from "./download.js";
import { hasBackend } from "./config.js";
import { extractCasus, deriveSchema } from "./extract.js";
import { authConfigured } from "./supa.js";
import { computeWazo } from "./engine.js";
import { computeTijdlijn } from "./advice.js";
import { PoortwachterTijdlijn } from "./tijdlijn.jsx";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

// WAZO-resultaat uit de (handmatige) zwangerschap-invoer; null als niet van toepassing.
function wazoFrom(z) {
  z = z || {};
  if (!z.actief || !ISO.test(z.uitgerekendeDatum || "")) return null;
  try {
    return computeWazo({
      uitgerekendeDatum: z.uitgerekendeDatum,
      meerling: !!z.meerling,
      werkelijkeBevalling: ISO.test(z.werkelijkeBevalling || "") ? z.werkelijkeBevalling : undefined,
    });
  } catch { return null; }
}

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
function UploadStep({ onResult, session, onNeedLogin, credits, onNeedCredits, onCreditsChange, eerdere, onWisEerdere }) {
  const [file, setFile] = React.useState(null);   // { name,size,type,real,file? }
  const [paste, setPaste] = React.useState(false);
  const [text, setText] = React.useState("");
  const [drag, setDrag] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [busy, setBusy] = React.useState(false);   // AI-aanroep loopt
  const [noMedical, setNoMedical] = React.useState(false);
  const [functie, setFunctie] = React.useState("");   // optionele functieomschrijving
  const [vervolgId, setVervolgId] = React.useState(""); // eerdere casus om voor te laden
  const inputRef = React.useRef(null);

  // Geen .doc (Word 97-2003): dat binaire formaat kan de backend niet lezen en
  // zou als rommel-tekst naar het model gaan, buiten de BSN-redactie om.
  const ALLOWED = ["pdf", "docx", "txt"];
  const IMAGES = ["jpg", "jpeg", "png", "webp"];
  const IMG_MAX = 4.5 * MB; // API-grens per afbeelding

  function acceptFile(list) {
    const arr = Array.from(list && list.length !== undefined ? list : [list]).filter(Boolean);
    if (!arr.length) return;
    const exts = arr.map((f) => extOf(f.name));
    if (exts.some((e) => e === "heic" || e === "heif")) {
      setError("HEIC-foto's (iPhone-standaard) worden niet ondersteund. Zet de foto om naar JPG (bv. via delen/mailen of camera-instelling 'meest compatibel').");
      return;
    }
    const alleFotos = exts.every((e) => IMAGES.includes(e));
    if (arr.length > 1 && !alleFotos) {
      setError("Meerdere bestanden tegelijk kan alleen met foto's (JPG/PNG) — één foto per pagina. Kies anders één PDF of Word-bestand.");
      return;
    }
    if (alleFotos) {
      const teGroot = arr.find((f) => f.size > IMG_MAX);
      if (teGroot) { setError(`De foto "${teGroot.name}" is groter dan 4,5 MB. Verklein de foto en probeer het opnieuw.`); return; }
      const totaal = arr.reduce((s, f) => s + f.size, 0);
      setError(null);
      setFile({
        name: arr.length > 1 ? `${arr.length} foto's (in volgorde van pagina's)` : arr[0].name,
        size: fmtSize(totaal), type: "img", real: true, files: arr,
      });
      return;
    }
    const f = arr[0];
    const ext = exts[0];
    if (ext === "doc") { setError("Word 97-2003 (.doc) wordt niet ondersteund. Sla het bestand op als .docx of PDF."); return; }
    if (!ALLOWED.includes(ext)) { setError("Ondersteund: PDF, Word (.docx), platte tekst (.txt) of foto's (JPG/PNG)."); return; }
    if (f.size > 20 * MB) { setError("Het bestand is groter dan 20 MB."); return; }
    setError(null);
    setFile({ name: f.name, size: fmtSize(f.size), type: ext === "pdf" ? "pdf" : "doc", real: true, files: [f] });
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
      const casus = await extractCasus(file ? { files: file.files, functieomschrijving: fo, accessToken: token } : { text, functieomschrijving: fo, accessToken: token });
      const iv = casus.inputvalidatie;
      if (iv && iv.geschikt === false) {
        // Stap 0: geen geschikt documenttype → geen PvA genereren, blijf op stap 1.
        // De backend heeft de credit al teruggeboekt; geef het nieuwe saldo door
        // en stel de gebruiker gerust dat dit niets heeft gekost.
        if (typeof casus.balance === "number" && onCreditsChange) onCreditsChange(casus.balance);
        setError(
          "Dit lijkt geen terugkoppeling van de bedrijfsarts" +
          (iv.documenttype ? ` (herkend als: ${iv.documenttype})` : "") +
          ". " + (iv.toelichting || "Lever de terugkoppeling of het advies van de bedrijfsarts aan.") +
          " Er is geen credit afgeschreven."
        );
        return;
      }
      const vervolg = (eerdere || []).find((e) => e.id === vervolgId) || null;
      onResult(casus, vervolg);
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

      <input ref={inputRef} type="file" multiple
        accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => acceptFile(e.target.files)} />

      {!file && !paste && (
        <div
          className={"dropzone" + (drag ? " drag" : "")}
          onClick={() => inputRef.current && inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); acceptFile(e.dataTransfer.files); }}
        >
          <span className="ico">{I.upload}</span>
          <h3>Sleep je bestand of foto's hierheen</h3>
          <p>of klik om een PDF, Word-bestand of foto's te kiezen</p>
          <div className="formats">PDF, Word, tekst of foto's (meerdere mogelijk, één per pagina) · max. 20 MB</div>
        </div>
      )}

      {file && (
        <div className="file-chip">
          <span className={"fico " + file.type}>{file.type === "pdf" ? "PDF" : file.type === "img" ? "FOTO" : "DOC"}</span>
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

      {(eerdere || []).length > 0 && (
        <div className="func-omschrijving">
          <label htmlFor="vervolg-select"><strong>Vervolg op een eerdere casus</strong> <span className="optioneel">(optioneel)</span></label>
          <p className="func-hint">
            Afgeronde casussen worden alleen op dit apparaat bewaard (naam en planningsgegevens — nooit op onze servers).
            Kies een casus om geboortedatum, contracteinde en zwangerschap voor te laden.{" "}
            <button type="button" onClick={() => { onWisEerdere(); setVervolgId(""); }}>Wis opgeslagen casussen</button>
          </p>
          <select id="vervolg-select" value={vervolgId} onChange={(e) => setVervolgId(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line, #d8dce4)", font: "inherit", background: "#fff" }}>
            <option value="">— Nieuwe casus (niets voorladen) —</option>
            {(eerdere || []).map((e) => (
              <option key={e.id} value={e.id}>{e.naam} · bewaard op {e.bewaardOp}</option>
            ))}
          </select>
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

/* Plausibiliteitscheck op de zwangerschap-datums: een bevalling vóór de
   vroegst mogelijke verlofstart of ver ná de uitgerekende datum wijst vrijwel
   zeker op een tikfout — waarschuw i.p.v. stil een onzinnige tijdlijn tonen. */
function wazoDatumWaarschuwing(v) {
  if (!ISO.test(v.uitgerekendeDatum || "") || !ISO.test(v.werkelijkeBevalling || "")) return null;
  const due = new Date(v.uitgerekendeDatum + "T00:00:00");
  const act = new Date(v.werkelijkeBevalling + "T00:00:00");
  const diffDagen = Math.round((act - due) / 86400000);
  const maxWekenVoor = v.meerling ? 10 : 6;
  if (diffDagen <= -maxWekenVoor * 7 || diffDagen > 28) {
    return "De werkelijke bevallingsdatum ligt ver van de uitgerekende datum — controleer beide datums; de tijdlijn kan anders niet (goed) worden berekend.";
  }
  return null;
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
          {wazoDatumWaarschuwing(v) && (
            <p className="wazo-hint">{I.info} {wazoDatumWaarschuwing(v)}</p>
          )}
        </div>
      )}
    </div>
  );
}

/* Verzuim-tijdlijn voor de actuele casus, optioneel verlengd door WAZO. */
function TijdlijnPanel({ fields, zwangerschap }) {
  const tijdlijn = computeTijdlijn(fields, { wazo: wazoFrom(zwangerschap) });
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
  // Vervolg op een eerdere casus: laat zien wat er van dit apparaat is voorgeladen.
  const vi = casus.vervolgInfo;
  if (vi) {
    if (vi.aangevuld && vi.aangevuld.length) waarschuwingen.push(`Aangevuld uit de eerdere casus van ${vi.naam} (alleen op dit apparaat bewaard): ${vi.aangevuld.join(", ")}. Controleer of dit nog klopt.`);
    if (vi.naamAnders) waarschuwingen.push(`De naam in deze terugkoppeling wijkt af van de gekozen eerdere casus (${vi.naam}) — controleer of je de juiste casus hebt gekozen.`);
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
function PreviewStep({ onBack, controleOk, casus, zwangerschap }) {
  const { fields, schema, reportDate, taaksuggestie, functieomschrijving, signalen, schemaZelfOpgesteld, opbouwReden } = casus;
  const wazo = wazoFrom(zwangerschap);
  const [tab, setTab] = React.useState(0);
  const [toast, setToast] = React.useState(null); // { ok: boolean, title, sub }
  const [busyKey, setBusyKey] = React.useState(null);
  const tabs = [
    { t: "Opbouwadvies", el: <AdviesPreview fields={fields} schema={schema} reportDate={reportDate} schemaZelfOpgesteld={schemaZelfOpgesteld} opbouwReden={opbouwReden} wazo={wazo} /> },
    { t: "Plan van Aanpak", el: <PvaPreview fields={fields} schema={schema} functieomschrijving={functieomschrijving} opbouwReden={opbouwReden} signalen={signalen} /> },
    { t: "Begeleidend bericht", el: <BerichtPreview fields={fields} schema={schema} reportDate={reportDate} taaksuggestie={taaksuggestie} signalen={signalen} schemaZelfOpgesteld={schemaZelfOpgesteld} opbouwReden={opbouwReden} wazo={wazo} /> },
    { t: "Bericht werknemer", el: <WerknemerBerichtPreview fields={fields} schema={schema} reportDate={reportDate} signalen={signalen} opbouwReden={opbouwReden} /> },
  ];

  async function run(key, fn) {
    setBusyKey(key);
    try {
      const naam = await fn();
      setToast({ ok: true, title: `${naam} gedownload`, sub: "Concept · controleer en stel vast met de werknemer" });
    } catch (e) {
      setToast({ ok: false, title: "Download mislukt", sub: (e && e.message ? e.message : "Onbekende fout") + " — probeer het opnieuw." });
    } finally {
      setBusyKey(null);
    }
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
            <h4>Aparte documenten</h4>
            <p>
              {controleOk
                ? <><span className="review-confirm">{I.checkSm} Menselijke controle bevestigd in stap 2.</span> Het Plan van aanpak hoort in het personeelsdossier; de adviezen en berichten niet — daarom apart.</>
                : "Controle in stap 2 is vereist vóór downloaden"}
            </p>
          </div>
        </div>
        <div className="dl-buttons">
          <button className="btn btn-accent btn-lg" disabled={!controleOk || busyKey} onClick={() => run("pva", () => downloadUwvPva(fields, schema, functieomschrijving, opbouwReden, signalen))}>
            {I.download} {busyKey === "pva" ? "Bezig…" : "Plan van aanpak (UWV) — voor dossier"}
          </button>
          <button className="btn btn-primary btn-lg" disabled={!controleOk || busyKey} onClick={() => run("bericht", () => downloadBericht(fields, schema, reportDate, taaksuggestie, signalen, schemaZelfOpgesteld, opbouwReden, wazo))}>
            {I.download} {busyKey === "bericht" ? "Bezig…" : "Begeleidend bericht & adviezen"}
          </button>
          <button className="btn btn-primary btn-lg" disabled={!controleOk || busyKey} onClick={() => run("werknemer", () => downloadWerknemerBericht(fields, schema, reportDate, signalen, opbouwReden))}>
            {I.download} {busyKey === "werknemer" ? "Bezig…" : "Bericht voor je werknemer (B1)"}
          </button>
        </div>
      </div>

      <div className="tool-actions">
        <button className="btn btn-ghost" onClick={onBack}>{I.arrowLeft} Terug naar controle</button>
        <span></span>
      </div>

      {toast && (
        <div className={"toast" + (toast.ok ? "" : " toast-err")} onClick={() => setToast(null)}>
          <span className="ico">{toast.ok ? I.checkSm : I.x}</span>
          <div>
            <div className="tt">{toast.title}</div>
            <div className="ts">{toast.sub}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sessie-persistentie (alleen dit tabblad, alleen dit apparaat) ----------
   Een refresh in stap 2/3 gooide al het controle-werk weg terwijl de credit al was
   afgeschreven. sessionStorage bewaart de lopende casus op het apparaat zelf —
   er gaat niets naar de server, dus de "geen opslag"-belofte blijft intact. */
const SESSIE_KEY = "pva.sessie.v1";
function loadSessie() {
  try {
    const raw = sessionStorage.getItem(SESSIE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return s && s.casus && Array.isArray(s.casus.fields) ? s : null;
  } catch { return null; }
}

/* ---------- Eerdere casussen (vervolg-terugkoppelingen) ----------
   Verzuim is longitudinaal: elke 4-6 weken een nieuwe terugkoppeling over
   dezelfde werknemer. We bewaren daarom per afgeronde casus een MINIMALE set
   werkgeversgegevens (naam + geboortedatum + contracteinde + zwangerschap; géén
   belastbaarheid of andere inhoud) in localStorage — uitsluitend op dit
   apparaat, nooit op de server. Bij een vervolg-terugkoppeling worden die
   gegevens voorgeladen zodat de gebruiker ze niet opnieuw hoeft in te voeren. */
const CASUSSEN_KEY = "pva.casussen.v1";
const CASUSSEN_MAX = 10;
function loadCasussen() {
  try {
    const raw = localStorage.getItem(CASUSSEN_KEY);
    const lijst = raw ? JSON.parse(raw) : [];
    return Array.isArray(lijst) ? lijst.filter((e) => e && e.id && e.naam) : [];
  } catch { return []; }
}
function wisCasussen() {
  try { localStorage.removeItem(CASUSSEN_KEY); } catch {}
}
function bewaarCasus(casus, zwangerschap) {
  const clean = (v) => { const s = (v || "").trim(); return s && s !== MISSING ? s : ""; };
  const naam = clean(getVal(casus.fields, "naam"));
  if (!naam) return loadCasussen(); // zonder naam is een vervolg niet herkenbaar
  const p = (n) => String(n).padStart(2, "0");
  const nu = new Date();
  const entry = {
    id: naam.toLowerCase(),
    naam,
    bewaardOp: `${p(nu.getDate())}-${p(nu.getMonth() + 1)}-${nu.getFullYear()}`,
    velden: {
      geboortedatum: clean(getVal(casus.fields, "geboortedatum")),
      einddatum: clean(getVal(casus.fields, "einddatum")),
    },
    zwangerschap: zwangerschap && zwangerschap.actief ? zwangerschap : null,
  };
  const lijst = [entry, ...loadCasussen().filter((e) => e.id !== entry.id)].slice(0, CASUSSEN_MAX);
  try { localStorage.setItem(CASUSSEN_KEY, JSON.stringify(lijst)); } catch {}
  return lijst;
}
/* Vult lege werkgeversvelden in de nieuwe casus aan vanuit een eerdere casus en
   markeert wat er is overgenomen (voor de controle-waarschuwing in stap 2). */
function mergeVervolg(c, vervolg) {
  if (!vervolg) return c;
  const aangevuld = [];
  const fields = c.fields.map((g) => ({
    ...g,
    items: g.items.map((it) => {
      const v = vervolg.velden && vervolg.velden[it.id];
      if (v && (!it.value || it.value === MISSING)) {
        aangevuld.push(it.label);
        return { ...it, value: v, status: "ok" };
      }
      return it;
    }),
  }));
  const naamNieuw = (getVal(fields, "naam") || "").trim().toLowerCase();
  const naamAnders = !!(naamNieuw && naamNieuw !== MISSING.toLowerCase()
    && vervolg.naam && naamNieuw !== vervolg.naam.trim().toLowerCase());
  return { ...c, fields, vervolgInfo: { naam: vervolg.naam, aangevuld, naamAnders } };
}

/* ---------- Tool-shell ---------- */
export function Tool({ onClose, session, onNeedLogin, credits, onNeedCredits, onCreditsChange }) {
  const saved = React.useMemo(loadSessie, []);
  const [step, setStep] = React.useState(saved ? saved.step : 0);
  const [checked, setChecked] = React.useState(saved ? !!saved.checked : false);
  const [casus, setCasus] = React.useState(saved ? saved.casus : null);
  const [zwangerschap, setZwangerschap] = React.useState(saved && saved.zwangerschap ? saved.zwangerschap : { actief: false });
  const [eerdere, setEerdere] = React.useState(loadCasussen);

  // Elke wijziging wegschrijven; zonder casus is er niets te bewaren.
  React.useEffect(() => {
    try {
      if (casus) sessionStorage.setItem(SESSIE_KEY, JSON.stringify({ step, checked, casus, zwangerschap }));
      else sessionStorage.removeItem(SESSIE_KEY);
    } catch { /* opslag vol of geblokkeerd — dan gewoon zonder persistentie */ }
  }, [step, checked, casus, zwangerschap]);

  // Bij het bereiken van stap 3 is de casus gecontroleerd → werkgeversgegevens
  // bewaren voor een volgende terugkoppeling over dezelfde werknemer.
  React.useEffect(() => {
    if (step === 2 && casus) setEerdere(bewaarCasus(casus, zwangerschap));
  }, [step]); // bewust alleen op stapwissel

  function handleResult(c, vervolg) {
    if (c && typeof c.balance === "number" && onCreditsChange) onCreditsChange(c.balance);
    let merged = mergeVervolg(c, vervolg);
    if (vervolg && vervolg.zwangerschap && vervolg.zwangerschap.actief) {
      setZwangerschap(vervolg.zwangerschap);
      if (merged.vervolgInfo) merged.vervolgInfo.aangevuld = [...merged.vervolgInfo.aangevuld, "Zwangerschap & WAZO"];
    } else {
      setZwangerschap({ actief: false });
    }
    setCasus(merged); setChecked(false); setStep(1);
  }

  function handleEdit(id, value) {
    setCasus(prev => {
      if (!prev) return prev;
      const fields = prev.fields.map(g => ({
        ...g,
        items: g.items.map(it => it.id === id
          ? { ...it, value, status: value && value !== MISSING ? "ok" : "missing" }
          : it),
      }));
      let next = { ...prev, fields };
      // Herbereken het opbouwschema wanneer een reken-invoer wijzigt: de
      // contracturen ("uren") of de startdatum van de opbouw ("start"). Zo
      // blijven schema-tabel, percentages, hersteldatum en de downloads
      // consistent met wat de gebruiker heeft gecorrigeerd. Het opbouwtempo is
      // vrije tekst en is niet betrouwbaar te parsen — dat veld triggert
      // bewust géén herberekening.
      if (prev.reken && (id === "uren" || id === "start")) {
        const clean = (s) => (s && s !== MISSING ? String(s).trim() : "");
        const reken = { ...prev.reken };
        if (id === "uren") {
          const m = clean(value).match(/\d+/);
          reken.contractHours = m ? parseInt(m[0], 10) : 0;
        }
        if (id === "start") {
          const nl = clean(value);
          reken.startDateISO = /^\d{2}-\d{2}-\d{4}$/.test(nl) ? nl.split("-").reverse().join("-") : "";
        }
        const startField = fields.flatMap(g => g.items).find(it => it.id === "start");
        next = {
          ...next,
          reken,
          ...deriveSchema({ reken, signalen: prev.signalen, startdatumOpbouwNL: clean(startField && startField.value) }),
        };
      }
      return next;
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
        {step === 0 && <UploadStep onResult={handleResult} session={session} onNeedLogin={onNeedLogin} credits={credits} onNeedCredits={onNeedCredits} onCreditsChange={onCreditsChange} eerdere={eerdere} onWisEerdere={() => { wisCasussen(); setEerdere([]); }} />}
        {step === 1 && casus && <VerifyStep onBack={() => setStep(0)} onNext={() => setStep(2)} checked={checked} setChecked={setChecked} casus={casus} onEdit={handleEdit} zwangerschap={zwangerschap} setZwangerschap={setZwangerschap} />}
        {step === 2 && casus && <PreviewStep onBack={() => setStep(1)} controleOk={checked} casus={casus} zwangerschap={zwangerschap} />}
      </div>
    </div>
  );
}

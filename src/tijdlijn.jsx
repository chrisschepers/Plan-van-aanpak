/* PoortwachterTijdlijn — horizontale verzuim-/Poortwachter-tijdlijn.
   Geïmporteerd uit Claude Design (project "PVA website", PoortwachterTijdlijn.jsx)
   en geïntegreerd in de site. Self-contained: eigen <style> met design-tokens
   scoped op .pwt, geen externe UI-libraries. Rendert alles uit de `tijdlijn`-prop
   (zie computeTijdlijn() in advice.js); voorbeelddata als default. */

export const TIJDLIJN_DEFAULT = {
  anker: { week: 0, datum: "03-02-2025", titel: "Eerste ziektedag" },
  eindeWachttijd: { week: 120, datum: "24-05-2027", verschovenDoorWazo: true },
  events: [
    { id: "pw-1",   type: "mijlpaal", categorie: "poortwachter", week: 1,   datum: "10-02-2025", titel: "Ziekmelding", sub: "Meld de werknemer ziek bij de arbodienst en leg de eerste ziektedag vast.", verschoven: false },
    { id: "pw-6",   type: "mijlpaal", categorie: "poortwachter", week: 6,   datum: "17-03-2025", titel: "Probleemanalyse", sub: "De bedrijfsarts stelt de Probleemanalyse op (uiterlijk week 6).", verschoven: false },
    { id: "pw-8",   type: "mijlpaal", categorie: "poortwachter", week: 8,   datum: "31-03-2025", titel: "Plan van Aanpak", sub: "Stel samen met de werknemer het Plan van Aanpak op.", verschoven: false },
    { id: "wazo",   type: "verlof",   categorie: "wazo", week: 24, datum: "22-07-2025", totWeek: 40, totDatum: "10-11-2025", titel: "WAZO-verlof (zwangerschap/bevalling)", sub: "16 wk — wachttijd pauzeert" },
    { id: "pw-42",  type: "mijlpaal", categorie: "poortwachter", week: 58,  datum: "16-03-2026", titel: "42e-weeksmelding bij UWV", sub: "Meld het langdurig verzuim bij UWV (verplicht in week 42).", verschoven: true },
    { id: "pw-52",  type: "mijlpaal", categorie: "poortwachter", week: 68,  datum: "25-05-2026", titel: "Eerstejaarsevaluatie", sub: "Evalueer het eerste jaar; beoordeel of het tweede spoor moet starten.", verschoven: true },
    { id: "pw-58",  type: "mijlpaal", categorie: "poortwachter", week: 74,  datum: "06-07-2026", titel: "Tweede spoor uiterlijk gestart", sub: "Start zo nodig het tweede spoor.", verschoven: true },
    { id: "pw-87",  type: "mijlpaal", categorie: "poortwachter", week: 103, datum: "25-01-2027", titel: "WIA-aanvraag mogelijk", sub: "Actueel oordeel + re-integratieverslag compleet.", verschoven: true },
    { id: "pw-93",  type: "mijlpaal", categorie: "poortwachter", week: 109, datum: "08-03-2027", titel: "WIA uiterlijk aanvragen", sub: "Werknemer vraagt uiterlijk week 93 WIA aan.", verschoven: true },
    { id: "pw-104", type: "mijlpaal", categorie: "poortwachter", week: 120, datum: "24-05-2027", titel: "Einde wachttijd", sub: "Einde van de 2 jaar loondoorbetaling; WIA-beoordeling volgt.", verschoven: true },
  ],
  banen: [
    { id: "loondoorbetaling", titel: "Loondoorbetaling", vanWeek: 0, totWeek: 120, vanDatum: "03-02-2025", totDatum: "24-05-2027", noot: "Cao-afhankelijk; in de meeste cao's geldt vanaf jaar 1 al 70%." },
  ],
};

const CAT = {
  poortwachter: { kleur: "var(--navy)",   bg: "var(--navy-50)",   tekst: "var(--navy)",        label: "Poortwachter" },
  wazo:         { kleur: "var(--green)",   bg: "var(--green-50)",  tekst: "var(--green-700)",   label: "WAZO-verlof" },
  zud:          { kleur: "var(--amber-line)", bg: "var(--amber-bg)", tekst: "var(--amber-text)", label: "Einde dienstverband" },
  aow:          { kleur: "var(--purple)",  bg: "var(--purple-bg)", tekst: "var(--purple-text)", label: "AOW" },
};

export function PoortwachterTijdlijn({ tijdlijn = TIJDLIJN_DEFAULT }) {
  const [hover, setHover] = React.useState(null); // {id, x, y}
  const total = tijdlijn.eindeWachttijd.week || 1;
  const pct = (w) => (w / total) * 100;

  const mijlpalen = tijdlijn.events.filter((e) => e.type === "mijlpaal");
  const verloven = tijdlijn.events.filter((e) => e.type === "verlof");
  const eindpunten = tijdlijn.events.filter((e) => e.type === "eindpunt");

  // Layout: wijs elk label een kant (boven/onder) en een tier (stapelniveau) toe
  // zodat labels elkaar nooit overlappen. Gebaseerd op horizontale extent in %.
  const labelLayout = React.useMemo(() => {
    const HALF = 8.8; // halve labelbreedte in % van de plotbreedte (marge tegen overlap)
    const sides = { boven: [], onder: [] };
    const res = {};
    let alt = 0;
    const all = [...mijlpalen, ...eindpunten].sort((a, b) => a.week - b.week);
    all.forEach((e) => {
      const p = pct(e.week);
      const side = alt % 2 === 0 ? "boven" : "onder";
      alt++;
      const lo = p - HALF, hi = p + HALF;
      const placed = sides[side];
      let tier = 0;
      while (placed.some((q) => q.tier === tier && !(hi < q.lo || lo > q.hi))) tier++;
      placed.push({ lo, hi, tier });
      res[e.id] = { side, tier };
    });
    const maxTier = { boven: 0, onder: 0 };
    Object.values(res).forEach((r) => { maxTier[r.side] = Math.max(maxTier[r.side], r.tier); });
    return { res, maxTier };
  }, [tijdlijn]);

  const TIER_STEP = 58; // px per stapelniveau
  const bovenH = 16 + (labelLayout.maxTier.boven + 1) * TIER_STEP;
  const onderH = 16 + (labelLayout.maxTier.onder + 1) * TIER_STEP;

  // Jaarmarkeringen op de as (elke 52 weken)
  const jaren = [];
  for (let w = 0; w <= total; w += 52) jaren.push(w);

  // Welke categorieën komen voor → legenda
  const gebruikteCats = Array.from(new Set([
    ...tijdlijn.events.map((e) => e.categorie),
  ])).filter((c) => CAT[c]);

  return (
    <div className="pwt">
      <style>{CSS}</style>

      {/* Kop */}
      <header className="pwt-head">
        <div>
          <span className="pwt-eyebrow"><span className="dot" />Wet verbetering poortwachter</span>
          <h2>Tijdlijn verzuim — van eerste ziektedag tot einde wachttijd</h2>
          <p className="pwt-sub">
            {tijdlijn.anker.datum} t/m {tijdlijn.eindeWachttijd.datum} · {total} weken
            {tijdlijn.eindeWachttijd.verschovenDoorWazo ? " (verlengd door WAZO-verlof)" : ""}
          </p>
        </div>
        <div className="pwt-legend">
          {gebruikteCats.map((c) => (
            <span className="lg" key={c}>
              <span className="lg-sw" style={{ background: CAT[c].kleur }} />
              {CAT[c].label}
            </span>
          ))}
        </div>
      </header>

      {/* Scrollgebied */}
      <div className="pwt-scroll">
        <div className="pwt-canvas">

          {/* Jaarraster */}
          <div className="pwt-grid">
            {jaren.map((w) => (
              <div className="pwt-gridline" key={w} style={{ left: pct(w) + "%" }}>
                <span className="pwt-gridlabel">{w === 0 ? "Start" : "Jaar " + Math.round(w / 52)}</span>
              </div>
            ))}
          </div>

          {/* Bovenlabels-rij (ruimte voor mijlpaallabels boven de as) */}
          <div className="pwt-labels-boven" style={{ height: bovenH }}>
            {[...mijlpalen, ...eindpunten].map((e) => {
              const lay = labelLayout.res[e.id];
              if (!lay || lay.side !== "boven") return null;
              return (
                <EventLabel key={e.id} e={e} pct={pct} kant="boven" tier={lay.tier} step={TIER_STEP}
                  eindpunt={e.type === "eindpunt"} onHover={setHover} />
              );
            })}
          </div>

          {/* De as zelf */}
          <div className="pwt-axis">
            {/* WAZO-verlof blok (rekt de as op) */}
            {verloven.map((v) => (
              <div
                key={v.id}
                className="pwt-verlof"
                style={{ left: pct(v.week) + "%", width: pct(v.totWeek - v.week) + "%" }}
                onMouseEnter={(ev) => setHover({ id: v.id, sub: v.sub, titel: v.titel, x: ev.clientX, y: ev.clientY })}
                onMouseMove={(ev) => setHover({ id: v.id, sub: v.sub, titel: v.titel, x: ev.clientX, y: ev.clientY })}
                onMouseLeave={() => setHover(null)}
              >
                <span className="pwt-verlof-label">
                  WAZO-verlof · {v.sub}
                </span>
                {v.split ? (
                  <span
                    className="pwt-verlof-split"
                    style={{ left: ((v.split.week - v.week) / (v.totWeek - v.week)) * 100 + "%" }}
                  >
                    <span className="tick" />
                    <span className="lbl">{v.split.label} {v.split.datum}</span>
                  </span>
                ) : null}
              </div>
            ))}

            {/* De lijn */}
            <div className="pwt-line" />

            {/* Mijlpaal-markers */}
            {mijlpalen.map((e) => {
              const isEinde = e.week === total;
              return (
                <div
                  key={e.id}
                  className={"pwt-marker" + (isEinde ? " einde" : "")}
                  style={{ left: pct(e.week) + "%" }}
                  onMouseEnter={(ev) => setHover({ id: e.id, sub: e.sub, titel: e.titel, x: ev.clientX, y: ev.clientY })}
                  onMouseMove={(ev) => setHover({ id: e.id, sub: e.sub, titel: e.titel, x: ev.clientX, y: ev.clientY })}
                  onMouseLeave={() => setHover(null)}
                >
                  <span className="dot" />
                </div>
              );
            })}

            {/* Eindpunten (ruit/vlag) */}
            {eindpunten.map((e) => (
              <div
                key={e.id}
                className={"pwt-eindpunt cat-" + e.categorie}
                style={{ left: pct(e.week) + "%" }}
                onMouseEnter={(ev) => setHover({ id: e.id, sub: e.sub, titel: e.titel, x: ev.clientX, y: ev.clientY })}
                onMouseLeave={() => setHover(null)}
              >
                <span className="ruit" />
              </div>
            ))}
          </div>

          {/* Onderlabels-rij */}
          <div className="pwt-labels-onder" style={{ height: onderH }}>
            {[...mijlpalen, ...eindpunten].map((e) => {
              const lay = labelLayout.res[e.id];
              if (!lay || lay.side !== "onder") return null;
              return (
                <EventLabel key={e.id} e={e} pct={pct} kant="onder" tier={lay.tier} step={TIER_STEP}
                  eindpunt={e.type === "eindpunt"} onHover={setHover} />
              );
            })}
          </div>

          {/* Banen (loondoorbetaling e.d.) — met segmenten (jaar 1 / jaar 2) */}
          <div className="pwt-banen">
            {tijdlijn.banen.map((b) => {
              const segs = (b.segmenten && b.segmenten.length) ? b.segmenten : [{ vanWeek: b.vanWeek, totWeek: b.totWeek, label: b.titel }];
              const span = (b.totWeek - b.vanWeek) || 1;
              return (
                <div className="pwt-baan-rij" key={b.id}>
                  <span className="pwt-baan-titel">{b.titel}<span className="pwt-baan-bereik">{b.vanDatum} – {b.totDatum}</span></span>
                  <div className="pwt-baan" style={{ left: pct(b.vanWeek) + "%", width: pct(b.totWeek - b.vanWeek) + "%" }}>
                    {segs.map((s, i) => (
                      <div key={i} className={"pwt-baan-seg" + (i ? " alt" : "")} style={{ width: ((s.totWeek - s.vanWeek) / span) * 100 + "%" }}>
                        <span className="pwt-baan-seglabel">{s.label}</span>
                      </div>
                    ))}
                  </div>
                  {b.noot ? <div className="pwt-baan-noot">{b.noot}</div> : null}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {hover ? (
        <div className="pwt-tooltip" style={{ left: hover.x, top: hover.y }}>
          <strong>{hover.titel}</strong>
          {hover.sub ? <span>{hover.sub}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function EventLabel({ e, pct, kant, tier = 0, step = 58, eindpunt, onHover }) {
  const cat = CAT[e.categorie] || CAT.poortwachter;
  const p = pct(e.week);
  // Voorkom clipping aan de randen: lijn labels links/rechts uit i.p.v. gecentreerd
  const edge = p < 7 ? "edge-left" : p > 93 ? "edge-right" : "";
  const offset = tier * step;
  const posStyle = { left: p + "%", "--cat": cat.kleur };
  if (kant === "boven") posStyle.bottom = 14 + offset; else posStyle.top = 14 + offset;
  // connector reikt van label tot de as (langer bij hogere tier)
  const connLen = 14 + offset;
  return (
    <div
      className={"pwt-evlabel " + kant + " " + edge + (eindpunt ? " is-eindpunt" : "")}
      style={posStyle}
      onMouseEnter={(ev) => onHover({ id: e.id, sub: e.sub, titel: e.titel, x: ev.clientX, y: ev.clientY })}
      onMouseMove={(ev) => onHover({ id: e.id, sub: e.sub, titel: e.titel, x: ev.clientX, y: ev.clientY })}
      onMouseLeave={() => onHover(null)}
    >
      <span className="pwt-conn" style={{ height: connLen }} />
      <div className="pwt-evlabel-inner">
        <span className="pwt-evtitel">
          {e.verschoven ? <span className="pwt-shift" title="Opgeschoven door WAZO-verlof">→</span> : null}
          {e.titel}
        </span>
        <span className="pwt-evmeta">{e.datum} · wk {e.week}</span>
      </div>
    </div>
  );
}

const CSS = `
.pwt {
  --navy:#1F3864; --navy-900:#14264a; --navy-600:#2c4a7e; --navy-400:#5b76a6;
  --navy-100:#e6ebf4; --navy-50:#f2f5fa;
  --green:#157f5b; --green-700:#0f6a4a; --green-100:#e1f1ea; --green-50:#f0f8f4;
  --amber-line:#f0b429; --amber-bg:#fdf4dd; --amber-text:#8a5a00;
  --purple:#6b4d9a; --purple-bg:#efeaf7; --purple-text:#4a3470;
  --ink:#18202f; --ink-soft:#3c465a; --muted:#69748b; --faint:#97a0b2;
  --line:#e3e7ee; --line-soft:#eef1f6;
  --radius:12px;
  --shadow-sm:0 1px 2px rgba(20,38,74,.06),0 1px 3px rgba(20,38,74,.05);
  --shadow:0 6px 24px -10px rgba(20,38,74,.22),0 2px 6px rgba(20,38,74,.06);
  --shadow-lg:0 24px 60px -24px rgba(20,38,74,.34);
  font-family: inherit; color: var(--ink);
}
.pwt-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; flex-wrap: wrap; margin-bottom: 26px; }
.pwt-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--navy-600); }
.pwt-eyebrow .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green); }
.pwt-head h2 { font-size: 25px; font-weight: 700; letter-spacing: -.02em; color: var(--navy-900); margin: 12px 0 0; line-height: 1.15; }
.pwt-sub { color: var(--muted); font-size: 14.5px; margin: 8px 0 0; }
.pwt-legend { display: flex; flex-wrap: wrap; gap: 8px 16px; padding-top: 4px; }
.pwt-legend .lg { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 500; color: var(--ink-soft); }
.pwt-legend .lg-sw { width: 14px; height: 14px; border-radius: 4px; }

.pwt-scroll { overflow-x: auto; overflow-y: visible; padding: 4px 0 6px; }
.pwt-scroll::-webkit-scrollbar { height: 9px; }
.pwt-scroll::-webkit-scrollbar-thumb { background: var(--navy-100); border-radius: 999px; }
.pwt-canvas {
  position: relative; min-width: 1180px;
  background: #fff; border: 1px solid var(--line); border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  padding: 16px 72px 22px;
}

/* Jaarraster */
.pwt-grid { position: absolute; inset: 16px 72px 22px; pointer-events: none; }
.pwt-gridline { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--line-soft); }
.pwt-gridline:first-child { background: var(--line); }
.pwt-gridlabel { position: absolute; top: -2px; left: 6px; font-size: 11px; font-weight: 600; color: var(--faint); white-space: nowrap; letter-spacing: .02em; }

/* Labelrijen */
.pwt-labels-boven { position: relative; }
.pwt-labels-onder { position: relative; }

.pwt-evlabel { position: absolute; transform: translateX(-50%); width: 134px; cursor: default; }
.pwt-evlabel.edge-left { transform: translateX(-12px); }
.pwt-evlabel.edge-right { transform: translateX(calc(-100% + 12px)); }
.pwt-evlabel-inner {
  position: relative; z-index: 1; background: #fff; border: 1px solid var(--line);
  border-left: 2px solid var(--cat); border-radius: 7px; padding: 6px 9px;
  transition: box-shadow .15s, transform .15s, border-color .15s;
}
.pwt-evlabel:hover { z-index: 6; }
.pwt-evlabel:hover .pwt-evlabel-inner { box-shadow: var(--shadow-sm); transform: translateY(-1px); border-color: var(--cat); }
.pwt-evtitel { display: block; font-size: 12px; font-weight: 600; color: var(--navy-900); line-height: 1.22; }
.pwt-evmeta { display: block; font-size: 10.5px; color: var(--muted); margin-top: 2px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.pwt-shift { color: var(--green-700); font-weight: 700; margin-right: 4px; }
.pwt-evlabel.is-eindpunt .pwt-evlabel-inner { border-left-color: var(--cat); background: var(--navy-50); }

/* Connector-lijntje van label naar de as */
.pwt-conn { position: absolute; left: 50%; width: 1px; background: var(--line); z-index: 0; }
.pwt-evlabel.edge-left .pwt-conn { left: 14px; }
.pwt-evlabel.edge-right .pwt-conn { left: auto; right: 14px; }
.pwt-evlabel.boven .pwt-conn { top: 100%; }
.pwt-evlabel.onder .pwt-conn { bottom: 100%; }

/* De as */
.pwt-axis { position: relative; height: 56px; }
.pwt-line { position: absolute; left: 0; right: 0; top: 50%; height: 3px; transform: translateY(-50%); background: var(--navy); border-radius: 2px; }

/* WAZO-verlof blok */
.pwt-verlof {
  position: absolute; top: 50%; transform: translateY(-50%); height: 30px;
  background-color: var(--green-50);
  background-image: repeating-linear-gradient(45deg, transparent 0 7px, rgba(21,127,91,.14) 7px 14px);
  border: 1.5px dashed var(--green); border-radius: 8px;
  display: flex; align-items: center; justify-content: center; z-index: 3; cursor: default;
}
.pwt-verlof-label { font-size: 11px; font-weight: 700; color: var(--green-700); white-space: nowrap; padding: 0 8px; overflow: hidden; text-overflow: ellipsis; }

/* Mijlpaal-markers */
.pwt-marker { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 4; cursor: default; }
.pwt-marker .dot { display: block; width: 13px; height: 13px; border-radius: 50%; background: #fff; border: 3px solid var(--navy); transition: transform .15s, box-shadow .15s; }
.pwt-marker:hover .dot { transform: scale(1.25); box-shadow: 0 0 0 5px var(--navy-100); }
.pwt-marker.einde .dot { width: 16px; height: 16px; background: var(--navy); border-color: var(--green); box-shadow: 0 0 0 4px var(--green-100); }

/* Split-marker op het WAZO-blok (vermoedelijke / werkelijke bevallingsdatum) */
.pwt-verlof-split { position: absolute; top: 0; bottom: 0; pointer-events: none; }
.pwt-verlof-split .tick { position: absolute; top: 0; bottom: 0; left: 0; width: 1.5px; transform: translateX(-50%); background: var(--green-700); }
.pwt-verlof-split .lbl { position: absolute; bottom: calc(100% + 4px); left: 0; transform: translateX(-50%); font-size: 9.5px; font-weight: 700; color: var(--green-700); white-space: nowrap; }

/* Eindpunten (ruit) */
.pwt-eindpunt { position: absolute; top: 50%; transform: translate(-50%, -50%); z-index: 4; cursor: default; }
.pwt-eindpunt .ruit { display: block; width: 16px; height: 16px; transform: rotate(45deg); background: #fff; border: 3px solid var(--cat, var(--amber-line)); }
.pwt-eindpunt.cat-zud .ruit { border-color: var(--amber-line); }
.pwt-eindpunt.cat-aow .ruit { border-color: var(--purple); }

/* Banen (loondoorbetaling) — titel boven, balk met segmenten, noot eronder */
.pwt-banen { position: relative; margin-top: 18px; padding-top: 18px; border-top: 1px dashed var(--line); }
.pwt-baan-rij { position: relative; padding-top: 20px; min-height: 80px; }
.pwt-baan-titel { position: absolute; top: 0; left: 0; display: flex; align-items: baseline; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--navy-600); }
.pwt-baan-bereik { font-size: 11px; font-weight: 500; letter-spacing: 0; text-transform: none; color: var(--muted); font-variant-numeric: tabular-nums; }
.pwt-baan { position: absolute; top: 20px; height: 30px; border: 1px solid var(--navy-100); border-radius: 8px; overflow: hidden; display: flex; }
.pwt-baan-seg { display: flex; align-items: center; padding: 0 12px; height: 100%; background: var(--navy-50); border-right: 1px dashed var(--navy-100); min-width: 0; }
.pwt-baan-seg:last-child { border-right: none; }
.pwt-baan-seg.alt { background: #fff; }
.pwt-baan-seglabel { font-size: 11.5px; font-weight: 600; color: var(--navy-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pwt-baan-noot { position: absolute; top: 56px; left: 0; font-size: 11px; color: var(--muted); font-style: italic; max-width: 72ch; }

/* Tooltip */
.pwt-tooltip {
  position: fixed; transform: translate(-50%, calc(-100% - 14px)); z-index: 50;
  background: var(--navy-900); color: #fff; border-radius: 9px; padding: 10px 13px;
  max-width: 280px; box-shadow: var(--shadow-lg); pointer-events: none;
}
.pwt-tooltip strong { display: block; font-size: 13px; font-weight: 700; margin-bottom: 3px; }
.pwt-tooltip span { display: block; font-size: 12px; color: rgba(255,255,255,.78); line-height: 1.45; }
.pwt-tooltip::after { content: ""; position: absolute; left: 50%; top: 100%; transform: translateX(-50%); border: 6px solid transparent; border-top-color: var(--navy-900); }

@media (max-width: 720px) {
  .pwt-head h2 { font-size: 21px; }
}
`;

/* Het brondocument: terugkoppeling bedrijfsarts, met aanklikbare functionele
   passages (amber) en geredigeerde medische passages (grijs). */

function HL({ id, active, onSel, children }) {
  return (
    <span
      className={"hl" + (active === id ? " active" : "")}
      onClick={(e) => { e.stopPropagation(); onSel(id); }}
      data-src={id}
    >{children}</span>
  );
}

function Redact({ children }) {
  return (
    <span>
      <span className="redact">{children}</span>
      <span className="redact-tag">Medisch — niet overgenomen</span>
    </span>
  );
}

export function SourceDoc({ active, onSel }) {
  const ref = React.useRef(null);

  // scroll de actieve highlight in beeld, alleen binnen het paneel
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current.querySelector(`[data-src="${active}"]`);
    if (el) {
      const c = ref.current;
      const top = el.offsetTop - c.offsetTop - c.clientHeight / 2 + el.clientHeight / 2;
      c.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, [active]);

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <h3>Bron · terugkoppeling bedrijfsarts</h3>
          <div className="sub">terugkoppeling-bedrijfsarts.pdf</div>
        </div>
        <span className="pill pill-navy"><span className="pdot"></span>Origineel</span>
      </div>
      <div className="doc-legend">
        <span><span className="lg-sw amber"></span> Overgenomen (functioneel)</span>
        <span><span className="lg-sw redact"></span> Gefilterd (medisch)</span>
      </div>
      <div className="srcdoc" ref={ref} style={{ maxHeight: 560, overflowY: "auto" }}>
        <p className="dh">Arbodienst · Spreekuurverslag</p>
        <p className="dtitle">Terugkoppeling spreekuur bedrijfsarts</p>
        <p className="dmeta">Opgesteld door bedrijfsarts · Spreekuurdatum 06-03-2025 · Vertrouwelijk</p>

        <h5>Werknemergegevens</h5>
        <p>
          Betreft <HL id="s-naam" active={active} onSel={onSel}>de heer J. de Vries</HL>,
          werkzaam als <HL id="s-functie" active={active} onSel={onSel}>administratief medewerker</HL> voor
          {" "}<HL id="s-uren" active={active} onSel={onSel}>32 uur per week</HL>. Werknemer is
          uitgevallen op <HL id="s-eerste" active={active} onSel={onSel}>3 februari 2025</HL>.
          Geboortedatum <Redact>14-08-1987</Redact> en BSN zijn bekend bij de arbodienst.
        </p>

        <h5>Aanleiding en medisch beeld</h5>
        <p>
          De klachten betreffen <Redact>aanhoudende rugklachten na een hernia-operatie</Redact>.
          Werknemer staat onder behandeling bij <Redact>de fysiotherapeut en een revalidatiearts</Redact>.
          Medicatie en behandeltraject zijn besproken; <Redact>het herstel verloopt volgens verwachting</Redact>.
          Deze medische gegevens zijn vertrouwelijk en worden niet in het Plan van Aanpak opgenomen.
        </p>

        <h5>Functionele mogelijkheden (belastbaarheid)</h5>
        <p>
          Werknemer is belastbaar voor <HL id="s-belast" active={active} onSel={onSel}>licht werk, met
          een opbouw vanaf twee dagdelen van 4 uur</HL>. Geadviseerd wordt een
          {" "}<HL id="s-opbouw" active={active} onSel={onSel}>wekelijkse opbouw van 4 uur</HL>,
          startend op <HL id="s-start" active={active} onSel={onSel}>10 maart 2025</HL>.
          Aandachtspunt: <HL id="s-aanpassing" active={active} onSel={onSel}>afwisseling tussen zitten en
          staan, geen piekbelasting</HL>.
        </p>

        <h5>Prognose</h5>
        <p>
          De verwachting is een <HL id="s-prognose" active={active} onSel={onSel}>volledige werkhervatting
          binnen circa 7 weken</HL>, mits de opbouw zonder terugval verloopt. Een
          tussentijdse evaluatie wordt aanbevolen.
        </p>
      </div>
    </div>
  );
}

/* "Mijn account"-pagina — profiel, creditsaldo, credits kopen, uitloggen.
   Zelfde paginastructuur als src/privacy.jsx (.tool / .tool-bar / .tool-body). */

import { I } from "./data.jsx";
import { BUNDLES, startCheckout, redeemCode } from "./credits.js";

const { useState, useEffect } = React;

export function Account({ onClose, session, onLogout, credits, refreshCredits }) {
  const email = session && session.user ? session.user.email : "—";
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [justPaid, setJustPaid] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState(null);
  const creditsActive = typeof credits === "number";

  async function redeem() {
    const c = code.trim();
    if (!c) return;
    setRedeeming(true); setRedeemMsg(null);
    try {
      const res = await redeemCode(session && session.access_token, c);
      setRedeemMsg({ ok: true, text: `Gelukt! ${res.credits} credit${res.credits === 1 ? "" : "s"} bijgeschreven. Nieuw saldo: ${res.balance}.` });
      setCode("");
      if (refreshCredits) refreshCredits();
    } catch (e) {
      setRedeemMsg({ ok: false, text: e && e.message ? e.message : "Inwisselen mislukt." });
    } finally { setRedeeming(false); }
  }

  useEffect(() => {
    const body = document.querySelector(".tool-body");
    if (body) body.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    // Terug van Mollie? Saldo een paar keer verversen (de webhook kan iets later komen).
    if (typeof window !== "undefined" && /[?&]betaling=terug/.test(window.location.search)) {
      setJustPaid(true);
      let n = 0;
      const tick = () => { if (refreshCredits) refreshCredits(); if (++n < 3) setTimeout(tick, 1500); };
      tick();
    }
  }, []);

  async function buy(key) {
    setError(null);
    setBusy(key);
    try {
      const url = await startCheckout(session && session.access_token, key);
      window.location.href = url;
    } catch (e) {
      setError("Kon de betaling niet starten: " + (e && e.message ? e.message : "onbekende fout"));
      setBusy(null);
    }
  }

  return (
    <div className="tool">
      <div className="tool-bar">
        <div className="tool-bar-inner">
          <button className="tool-back" onClick={onClose}>{I.arrowLeft} Terug naar site</button>
          <span style={{ fontWeight: 700, color: "var(--navy-900)" }}>Mijn account</span>
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); onClose(); }} style={{ fontSize: 15 }}>
            <span className="mark" style={{ width: 28, height: 28 }}>{I.doc}</span>
          </a>
        </div>
      </div>
      <div className="tool-body">
        <div className="account-wrap">
          <div className="account-card account-profile">
            <div>
              <h2>Profiel</h2>
              <p className="acc-email">{email}</p>
            </div>
            <button className="btn btn-ghost" onClick={onLogout}>Uitloggen</button>
          </div>

          {justPaid && (
            <div className="demo-note" style={{ marginBottom: 16 }}>
              {I.info}
              <p>Betaling verwerkt — je saldo wordt zo bijgewerkt. Ververst het niet? Open deze pagina zo dadelijk opnieuw.</p>
            </div>
          )}

          <div className="account-card">
            <h2>Credits</h2>
            {creditsActive
              ? <p className="acc-balance"><strong>{credits}</strong> credit{credits === 1 ? "" : "s"}</p>
              : <p className="acc-balance acc-muted">Credits zijn nog niet geactiveerd.</p>}
            <p className="acc-sub">Eén verwerking van een terugkoppeling van de bedrijfsarts kost 1 credit. De demo (voorbeeldcasus) blijft gratis.</p>

            <div className="bundle-grid">
              {BUNDLES.map((b) => (
                <div className="bundle" key={b.key}>
                  <div className="bundle-credits">{b.credits} credit{b.credits === 1 ? "" : "s"}</div>
                  <div className="bundle-price">{b.price}</div>
                  <div className="bundle-note">{b.note || " "}</div>
                  <button className="btn btn-primary" disabled={!creditsActive || !!busy} onClick={() => buy(b.key)}>
                    {busy === b.key ? "Bezig…" : "Kopen"}
                  </button>
                </div>
              ))}
            </div>

            <p className="acc-fine">Prijzen incl. btw. Betaling via Mollie (iDEAL/creditcard).</p>
            {!creditsActive && <p className="acc-fine">Betalen wordt geactiveerd zodra het creditsysteem live staat.</p>}
            {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}
          </div>

          <div className="account-card">
            <h2>Actiecode</h2>
            <p className="acc-sub">Heb je een actiecode? Wissel 'm hier in voor gratis credits.</p>
            <div className="redeem-row">
              <input className="redeem-input" placeholder="Bijv. PVALAUNCH" value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") redeem(); }} />
              <button className="btn btn-primary" disabled={redeeming || !code.trim()} onClick={redeem}>
                {redeeming ? "Bezig…" : "Inwisselen"}
              </button>
            </div>
            {redeemMsg && (redeemMsg.ok
              ? <p className="redeem-ok">{I.checkSm} {redeemMsg.text}</p>
              : <div className="upload-error" style={{ marginTop: 10 }}>{redeemMsg.text}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

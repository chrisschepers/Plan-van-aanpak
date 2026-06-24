/* Beheer (superuser) — gebruikers + credits + cijfers. Zelfde paginastructuur
   als account.jsx. Alle data komt server-side achter de admin-gate vandaan. */

import { I } from "./data.jsx";
import { adminListUsers, adminStats, adminAdjust, adminUserTransactions } from "./adminapi.js";

const { useState, useEffect } = React;

function fmtDate(iso) {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : "—";
}
function euro(cents) { return "€ " + (cents / 100).toFixed(2).replace(".", ","); }

const KIND_LABEL = {
  signup_bonus: "Gratis proefcredit", purchase: "Aankoop", consume: "Verwerking",
  refund: "Terugboeking", admin: "Handmatig (admin)", bonus: "Bonus",
};

export function Admin({ onClose, session }) {
  const token = session && session.access_token;
  const [users, setUsers] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState({});      // userId -> { amount, note }
  const [busy, setBusy] = useState(null);         // userId tijdens mutatie
  const [openTx, setOpenTx] = useState(null);     // userId waarvan historie open is
  const [tx, setTx] = useState({});               // userId -> transacties
  const [toast, setToast] = useState(null);

  async function load() {
    setError(null);
    try {
      const [u, s] = await Promise.all([adminListUsers(token), adminStats(token).catch(() => null)]);
      setUsers(u); setStats(s);
    } catch (e) {
      setError(e && e.message ? e.message : "Kon de gegevens niet laden.");
      setUsers([]);
    }
  }

  useEffect(() => {
    const body = document.querySelector(".tool-body");
    if (body) body.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
    load();
  }, []);

  const setDraft = (id, patch) => setDrafts((d) => ({ ...d, [id]: { amount: "", note: "", ...d[id], ...patch } }));

  async function doAdjust(u) {
    const d = drafts[u.id] || {};
    const amount = parseInt(d.amount, 10);
    if (!Number.isFinite(amount) || amount === 0) { setDraft(u.id, {}); setError("Geef een bedrag ≠ 0 (bijv. 5 of -1)."); return; }
    setError(null); setBusy(u.id);
    try {
      const balance = await adminAdjust(token, u.id, amount, (d.note || "").trim());
      setUsers((list) => list.map((x) => x.id === u.id ? { ...x, balance } : x));
      setDraft(u.id, { amount: "", note: "" });
      if (openTx === u.id) { const t = await adminUserTransactions(token, u.id).catch(() => null); if (t) setTx((m) => ({ ...m, [u.id]: t })); }
      adminStats(token).then(setStats).catch(() => {});
      setToast(`${amount > 0 ? "+" : ""}${amount} credit${Math.abs(amount) === 1 ? "" : "s"} → ${u.email} (nieuw saldo ${balance})`);
    } catch (e) {
      setError(e && e.message ? e.message : "Mutatie mislukt.");
    } finally { setBusy(null); }
  }

  async function toggleTx(u) {
    if (openTx === u.id) { setOpenTx(null); return; }
    setOpenTx(u.id);
    if (!tx[u.id]) {
      try { const t = await adminUserTransactions(token, u.id); setTx((m) => ({ ...m, [u.id]: t })); }
      catch (e) { setError(e && e.message ? e.message : "Kon historie niet laden."); }
    }
  }

  const q = query.trim().toLowerCase();
  const shown = (users || []).filter((u) => !q || (u.email || "").toLowerCase().includes(q));

  return (
    <div className="tool">
      <div className="tool-bar">
        <div className="tool-bar-inner">
          <button className="tool-back" onClick={onClose}>{I.arrowLeft} Terug naar site</button>
          <span style={{ fontWeight: 700, color: "var(--navy-900)" }}>Beheer</span>
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); onClose(); }} style={{ fontSize: 15 }}>
            <span className="mark" style={{ width: 28, height: 28 }}>{I.doc}</span>
          </a>
        </div>
      </div>
      <div className="tool-body">
        <div className="account-wrap admin-wrap">
          <h2 style={{ margin: "0 0 4px" }}>Beheer</h2>
          <p className="acc-sub" style={{ marginTop: 0 }}>Gebruikers, credits en cijfers. Mutaties worden vastgelegd in de historie.</p>

          {stats && (
            <div className="admin-stats">
              <div className="admin-stat"><span className="n">{stats.gebruikers}</span><span className="l">Gebruikers</span></div>
              <div className="admin-stat"><span className="n">{stats.verwerkingen}</span><span className="l">Verwerkingen</span></div>
              <div className="admin-stat"><span className="n">{stats.totaalSaldo}</span><span className="l">Openstaand saldo (credits)</span></div>
              <div className="admin-stat"><span className="n">{stats.betalingen}</span><span className="l">Betalingen</span></div>
              <div className="admin-stat"><span className="n">{euro(stats.omzetCents)}</span><span className="l">Omzet (incl. btw)</span></div>
            </div>
          )}

          {error && <div className="upload-error" style={{ marginBottom: 14 }}>{error}</div>}

          <div className="admin-toolbar">
            <input className="admin-search" placeholder="Zoek op e-mailadres…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn btn-ghost" onClick={load}>Verversen</button>
          </div>

          {users === null
            ? <p className="acc-sub">Laden…</p>
            : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>E-mailadres</th><th>Aangemaakt</th><th>Laatste login</th><th className="num">Saldo</th><th>Credits aanpassen</th></tr>
                  </thead>
                  <tbody>
                    {shown.map((u) => {
                      const d = drafts[u.id] || {};
                      return (
                        <React.Fragment key={u.id}>
                          <tr>
                            <td className="email">{u.email || "—"}</td>
                            <td>{fmtDate(u.created_at)}</td>
                            <td>{fmtDate(u.last_sign_in_at)}</td>
                            <td className="num"><strong>{u.balance}</strong></td>
                            <td>
                              <div className="admin-adjust">
                                <input type="number" step="1" placeholder="±" value={d.amount || ""}
                                  onChange={(e) => setDraft(u.id, { amount: e.target.value })} />
                                <input type="text" placeholder="reden (optioneel)" value={d.note || ""}
                                  onChange={(e) => setDraft(u.id, { note: e.target.value })} />
                                <button className="btn btn-primary btn-sm" disabled={busy === u.id} onClick={() => doAdjust(u)}>
                                  {busy === u.id ? "…" : "Bijwerken"}
                                </button>
                                <button className="btn btn-quiet btn-sm" onClick={() => toggleTx(u)}>{openTx === u.id ? "Verberg" : "Historie"}</button>
                              </div>
                            </td>
                          </tr>
                          {openTx === u.id && (
                            <tr className="admin-tx-row">
                              <td colSpan={5}>
                                {!tx[u.id] ? <span className="acc-sub">Laden…</span>
                                  : tx[u.id].length === 0 ? <span className="acc-sub">Nog geen transacties.</span>
                                    : (
                                      <table className="admin-tx">
                                        <thead><tr><th>Datum</th><th>Soort</th><th className="num">Aantal</th><th className="num">Saldo na</th><th>Details</th></tr></thead>
                                        <tbody>
                                          {tx[u.id].map((t, i) => (
                                            <tr key={i}>
                                              <td>{fmtDate(t.created_at)}</td>
                                              <td>{KIND_LABEL[t.kind] || t.kind}</td>
                                              <td className="num">{t.amount > 0 ? "+" : ""}{t.amount}</td>
                                              <td className="num">{t.balance_after}</td>
                                              <td className="muted">{t.note || (t.amount_cents ? euro(t.amount_cents) : "")}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {shown.length === 0 && <tr><td colSpan={5} className="acc-sub" style={{ padding: 16 }}>Geen gebruikers gevonden.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>

      {toast && (
        <div className="toast" onClick={() => setToast(null)}>
          <span className="ico">{I.checkSm}</span>
          <div><div className="tt">Saldo bijgewerkt</div><div className="ts">{toast}</div></div>
        </div>
      )}
    </div>
  );
}

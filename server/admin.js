/* Adminlaag: gebruikersbeheer + credits bijzetten/aftrekken (met audit) +
   overzichtscijfers. Praat met Supabase via de service_role (spiegelt
   server/credits.js). Toegang uitsluitend voor e-mailadressen in
   PVA_ADMIN_EMAILS (default: het eigen account). De gate staat SERVER-SIDE:
   de frontend verbergt de knop alleen cosmetisch. */

const SUPA_URL = (process.env.SUPABASE_URL || "").replace(/\s+/g, "").replace(/\/$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, "");
const ADMINS = (process.env.PVA_ADMIN_EMAILS || "chrisschepers22@gmail.com")
  .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

function svc(extra) { return { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, ...(extra || {}) }; }

export function adminConfigured() { return !!(SUPA_URL && SERVICE_KEY); }
export function isAdminEmail(email) { return !!email && ADMINS.includes(String(email).toLowerCase()); }

// Middleware: vereist een ingelogde admin. Draait NA requireAuth (zet req.user).
export function requireAdmin(req, res, next) {
  if (!isAdminEmail(req.user && req.user.email)) return res.status(403).json({ error: "Geen toegang." });
  next();
}

// Alle gebruikers (Supabase Auth Admin API) samengevoegd met hun creditsaldo.
export async function adminUsers() {
  const users = [];
  for (let page = 1; page <= 25; page++) {
    const r = await fetch(`${SUPA_URL}/auth/v1/admin/users?per_page=200&page=${page}`, { headers: svc() });
    if (!r.ok) throw new Error(`admin users (${r.status})`);
    const j = await r.json();
    const batch = Array.isArray(j) ? j : (j.users || []);
    users.push(...batch);
    if (batch.length < 200) break;
  }
  const bal = {};
  const br = await fetch(`${SUPA_URL}/rest/v1/credit_balances?select=user_id,balance`, { headers: svc() });
  if (br.ok) for (const row of await br.json()) bal[row.user_id] = row.balance;
  return users.map((u) => ({
    id: u.id,
    email: u.email || "",
    created_at: u.created_at || null,
    last_sign_in_at: u.last_sign_in_at || null,
    balance: bal[u.id] || 0,
  })).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

// Saldo aanpassen (+/-) met reden; geeft het nieuwe saldo terug.
export async function adminAdjust(userId, amount, note) {
  const r = await fetch(`${SUPA_URL}/rest/v1/rpc/rpc_admin_adjust`, {
    method: "POST",
    headers: svc({ "content-type": "application/json" }),
    body: JSON.stringify({ p_user: userId, p_amount: amount, p_note: note || null }),
  });
  if (!r.ok) throw new Error(`adjust (${r.status})`);
  return r.json(); // nieuw saldo (getal)
}

// Transactiehistorie van één gebruiker (meest recent eerst).
export async function adminUserTransactions(userId) {
  const cols = "kind,amount,balance_after,note,bundle,amount_cents,created_at";
  const r = await fetch(`${SUPA_URL}/rest/v1/credit_transactions?user_id=eq.${encodeURIComponent(userId)}&select=${cols}&order=created_at.desc&limit=100`, { headers: svc() });
  if (!r.ok) throw new Error(`transacties (${r.status})`);
  return r.json();
}

async function countTx(filter) {
  const r = await fetch(`${SUPA_URL}/rest/v1/credit_transactions?select=id&${filter}`, { headers: svc({ Prefer: "count=exact", Range: "0-0" }) });
  const cr = r.headers.get("content-range") || "*/0";
  return parseInt(cr.split("/")[1] || "0", 10) || 0;
}

// Overzichtscijfers voor het dashboard.
export async function adminStats() {
  const br = await fetch(`${SUPA_URL}/rest/v1/credit_balances?select=balance`, { headers: svc() });
  const balances = br.ok ? await br.json() : [];
  const totaalSaldo = balances.reduce((s, b) => s + (b.balance || 0), 0);

  const verwerkingen = await countTx("kind=eq.consume");

  const pr = await fetch(`${SUPA_URL}/rest/v1/credit_transactions?kind=eq.purchase&select=amount,amount_cents`, { headers: svc() });
  const purchases = pr.ok ? await pr.json() : [];
  const omzetCents = purchases.reduce((s, p) => s + (p.amount_cents || 0), 0);
  const verkochteCredits = purchases.reduce((s, p) => s + (p.amount || 0), 0);

  return {
    gebruikers: balances.length,
    totaalSaldo,
    verwerkingen,
    betalingen: purchases.length,
    verkochteCredits,
    omzetCents,
  };
}

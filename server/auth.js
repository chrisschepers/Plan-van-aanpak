/* Sessie-verificatie voor /api/extract. Controleert het Supabase-token door het
   bij Supabase op te halen (geen extra dependency, en respecteert verloop/intrekken).
   Zolang SUPABASE_URL/ANON_KEY niet gezet zijn is auth UIT (transitie): dan blijft
   het endpoint werken zoals voorheen, beschermd door rate-limiting. */

const SUPA_URL = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const SUPA_ANON = process.env.SUPABASE_ANON_KEY || "";

export function authConfigured() { return !!(SUPA_URL && SUPA_ANON); }

export async function requireAuth(req, res, next) {
  if (!authConfigured()) return next(); // nog niet gekoppeld → niet blokkeren
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) return res.status(401).json({ error: "Log in om echte documenten te verwerken." });
  try {
    const r = await fetch(`${SUPA_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPA_ANON },
    });
    if (!r.ok) return res.status(401).json({ error: "Je sessie is verlopen of ongeldig. Log opnieuw in." });
    req.user = await r.json();
    next();
  } catch (err) {
    console.error("auth-verificatie-fout:", err && err.message ? err.message : err);
    return res.status(502).json({ error: "Kon de sessie niet verifiëren. Probeer het later opnieuw." });
  }
}

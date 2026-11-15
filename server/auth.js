/* Sessie-verificatie voor /api/extract. Controleert het Supabase-token door het
   bij Supabase op te halen (geen extra dependency, en respecteert verloop/intrekken).
   Zolang SUPABASE_URL/ANON_KEY niet gezet zijn is auth UIT (transitie): dan blijft
   het endpoint werken zoals voorheen, beschermd door rate-limiting. */

// Strip ÁLLE witruimte (ook newlines middenin) — sleutels/URL bevatten nooit
// witruimte, en een geplakte newline maakt anders de fetch-header ongeldig.
const SUPA_URL = (process.env.SUPABASE_URL || "").replace(/\s+/g, "").replace(/\/$/, "");
const SUPA_ANON = (process.env.SUPABASE_ANON_KEY || "").replace(/\s+/g, "");

// Fail-closed-slot: met PVA_REQUIRE_AUTH=1 weigert de API wanneer de Supabase-
// config ontbreekt, in plaats van stilletjes zonder login door te draaien. Zo
// wordt een verdwenen/verhaspelde env-var een zichtbare storing i.p.v. een
// stille security-regressie (gratis anonieme AI-calls).
const REQUIRE = /^(1|true|yes)$/i.test((process.env.PVA_REQUIRE_AUTH || "").trim());

export function authConfigured() { return !!(SUPA_URL && SUPA_ANON); }
export function authEnforced() { return REQUIRE; }

export async function requireAuth(req, res, next) {
  if (!authConfigured()) {
    if (REQUIRE) {
      console.error("PVA_REQUIRE_AUTH staat aan maar SUPABASE_URL/SUPABASE_ANON_KEY ontbreken — verzoek geweigerd");
      return res.status(503).json({ error: "Inloggen is tijdelijk niet beschikbaar. Probeer het later opnieuw." });
    }
    return next(); // nog niet gekoppeld → niet blokkeren (demo-modus)
  }
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

/* Credit-laag: praat met Supabase via PostgREST/RPC met de service_role-sleutel
   (geen extra dependency; spiegelt server/auth.js). De service_role staat ALLEEN
   in de Railway-env, nooit in de frontend/git. Niet geconfigureerd →
   creditsConfigured() = false en de feature valt terug op gratis gebruik. */

// Strip álle witruimte (ook newlines middenin) — robuust tegen geplakte sleutels.
const SUPA_URL = (process.env.SUPABASE_URL || "").replace(/\s+/g, "").replace(/\/$/, "");
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, "");

export function creditsConfigured() { return !!(SUPA_URL && SERVICE_KEY); }

// Vaste bundels — de SERVER bepaalt de prijs (nooit de client).
export const BUNDLES = {
  single:   { credits: 1,  cents: 399,  label: "1 credit" },
  bundle5:  { credits: 5,  cents: 1800, label: "5 credits" },
  bundle10: { credits: 10, cents: 3400, label: "10 credits" },
};

async function rpc(fn, args) {
  const r = await fetch(`${SUPA_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) throw new Error(`rpc ${fn} faalde (${r.status})`);
  return r.json(); // scalaire return → JSON-getal of null
}

export const consumeCredit = (userId) => rpc("rpc_consume_credit", { p_user: userId });
export const refundCredit  = (userId) => rpc("rpc_refund_credit",  { p_user: userId });
export const addCredits = (userId, amount, paymentId, bundle, cents) =>
  rpc("rpc_add_credits", { p_user: userId, p_amount: amount, p_payment_id: paymentId, p_bundle: bundle, p_amount_cents: cents });

export async function getBalance(userId) {
  const r = await fetch(`${SUPA_URL}/rest/v1/credit_balances?user_id=eq.${userId}&select=balance`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!r.ok) return 0;
  const rows = await r.json();
  return rows[0] ? rows[0].balance : 0;
}
